"use server";

import { revalidatePath } from "next/cache";
import { CountryCode, Products } from "plaid";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth-guard";
import { decryptSecret, encryptSecret, getPlaidClient, isPlaidConfigured } from "@/lib/plaid";
import { errorResult, okResult, type ActionResult } from "@/server/action-result";
import type { FinancialAccountType } from "@prisma/client";

function mapPlaidAccountType(type: string, subtype: string | null): FinancialAccountType {
  if (type === "credit") return "CREDIT_CARD";
  if (type === "loan") return "LOAN";
  if (type === "investment" || type === "brokerage") {
    if (subtype === "401k" || subtype === "ira" || subtype === "roth" || subtype === "roth 401k") {
      return "RETIREMENT";
    }
    return "INVESTMENT";
  }
  if (type === "depository") {
    return subtype === "savings" ? "SAVINGS" : "CHECKING";
  }
  return "OTHER";
}

/** Creates a Plaid Link token so the client can open the Link widget. Read-only products only. */
export async function createPlaidLinkToken(): Promise<ActionResult<{ linkToken: string }>> {
  const userId = await requireUserId();
  if (!isPlaidConfigured()) {
    return errorResult("Bank sync isn't configured on this deployment yet (missing Plaid API keys).");
  }

  try {
    const client = getPlaidClient();
    const response = await client.linkTokenCreate({
      user: { client_user_id: userId },
      client_name: "Budge",
      language: "en",
      country_codes: [CountryCode.Us],
      // Read-only products only — never `auth` (enables ACH transfers) or
      // `transfer`/`payment_initiation` (move money). See src/lib/plaid.ts.
      products: [Products.Transactions],
    });
    return okResult({ linkToken: response.data.link_token });
  } catch (error) {
    return errorResult(`Couldn't start bank connection: ${(error as Error).message}`);
  }
}

/** Exchanges a Link `public_token` for a stored, encrypted access token and imports the linked accounts. */
export async function exchangePlaidPublicToken(publicToken: string): Promise<ActionResult> {
  const userId = await requireUserId();
  if (!isPlaidConfigured()) return errorResult("Bank sync isn't configured on this deployment yet.");

  try {
    const client = getPlaidClient();
    const exchange = await client.itemPublicTokenExchange({ public_token: publicToken });
    const accessToken = exchange.data.access_token;
    const plaidItemId = exchange.data.item_id;

    const itemInfo = await client.itemGet({ access_token: accessToken });
    const institutionId = itemInfo.data.item.institution_id ?? undefined;
    let institutionName: string | undefined;
    if (institutionId) {
      const institution = await client.institutionsGetById({
        institution_id: institutionId,
        country_codes: [CountryCode.Us],
      });
      institutionName = institution.data.institution.name;
    }

    const accountsResponse = await client.accountsGet({ access_token: accessToken });

    const plaidItem = await prisma.plaidItem.create({
      data: {
        userId,
        plaidItemId,
        accessTokenCiphertext: encryptSecret(accessToken),
        institutionId,
        institutionName,
      },
    });

    await prisma.financialAccount.createMany({
      data: accountsResponse.data.accounts.map((a) => ({
        userId,
        plaidItemId: plaidItem.id,
        plaidAccountId: a.account_id,
        source: "PLAID" as const,
        name: a.name,
        officialName: a.official_name ?? undefined,
        type: mapPlaidAccountType(a.type, a.subtype ?? null),
        mask: a.mask ?? undefined,
        // Plaid balances are dollars; convert to cents. A credit-card
        // balance is already "amount owed" as a positive number.
        currentBalance: Math.round((a.balances.current ?? 0) * 100),
        availableBalance:
          a.balances.available != null ? Math.round(a.balances.available * 100) : undefined,
      })),
    });

    revalidatePath("/accounts");
    revalidatePath("/dashboard");
    return okResult(undefined);
  } catch (error) {
    return errorResult(`Couldn't finish connecting that account: ${(error as Error).message}`);
  }
}

/** Refreshes balances and imports new transactions for one already-linked item. */
export async function syncPlaidItem(plaidItemId: string): Promise<ActionResult> {
  const userId = await requireUserId();
  const item = await prisma.plaidItem.findFirst({ where: { id: plaidItemId, userId } });
  if (!item) return errorResult("Connection not found.");

  try {
    const client = getPlaidClient();
    const accessToken = decryptSecret(item.accessTokenCiphertext);

    const accountsResponse = await client.accountsGet({ access_token: accessToken });
    for (const a of accountsResponse.data.accounts) {
      await prisma.financialAccount.updateMany({
        where: { plaidAccountId: a.account_id },
        data: {
          currentBalance: Math.round((a.balances.current ?? 0) * 100),
          availableBalance: a.balances.available != null ? Math.round(a.balances.available * 100) : undefined,
        },
      });
    }

    let cursor = item.transactionsCursor ?? undefined;
    let hasMore = true;
    while (hasMore) {
      const syncResponse = await client.transactionsSync({ access_token: accessToken, cursor });
      const accountByPlaidId = new Map(
        (
          await prisma.financialAccount.findMany({
            where: { plaidItemId: item.id },
            select: { id: true, plaidAccountId: true },
          })
        ).map((a) => [a.plaidAccountId, a.id]),
      );

      for (const t of syncResponse.data.added.concat(syncResponse.data.modified)) {
        const accountId = accountByPlaidId.get(t.account_id);
        if (!accountId) continue;
        await prisma.transaction.upsert({
          where: { plaidTransactionId: t.transaction_id },
          create: {
            userId,
            accountId,
            plaidTransactionId: t.transaction_id,
            // Plaid convention: positive amount = money out (expense) for
            // most account types; negative = money in (income/refund).
            type: t.amount >= 0 ? "EXPENSE" : "INCOME",
            amount: Math.round(Math.abs(t.amount) * 100),
            date: new Date(t.date),
            merchant: t.merchant_name ?? t.name,
            pending: t.pending,
          },
          update: {
            amount: Math.round(Math.abs(t.amount) * 100),
            pending: t.pending,
          },
        });
      }
      for (const removed of syncResponse.data.removed) {
        if (removed.transaction_id) {
          await prisma.transaction
            .delete({ where: { plaidTransactionId: removed.transaction_id } })
            .catch(() => undefined);
        }
      }

      cursor = syncResponse.data.next_cursor;
      hasMore = syncResponse.data.has_more;
    }

    await prisma.plaidItem.update({ where: { id: item.id }, data: { transactionsCursor: cursor, status: "ACTIVE" } });

    revalidatePath("/accounts");
    revalidatePath("/transactions");
    revalidatePath("/dashboard");
    return okResult(undefined);
  } catch (error) {
    await prisma.plaidItem.update({ where: { id: item.id }, data: { status: "ERROR" } });
    return errorResult(`Sync failed: ${(error as Error).message}`);
  }
}

export async function unlinkPlaidItem(plaidItemId: string): Promise<ActionResult> {
  const userId = await requireUserId();
  const item = await prisma.plaidItem.findFirst({ where: { id: plaidItemId, userId } });
  if (!item) return errorResult("Connection not found.");

  try {
    const client = getPlaidClient();
    await client.itemRemove({ access_token: decryptSecret(item.accessTokenCiphertext) });
  } catch {
    // Best-effort: even if Plaid's own item-removal call fails (e.g. the
    // item is already invalid), still delete our local copy below.
  }

  await prisma.plaidItem.delete({ where: { id: item.id } }); // cascades to FinancialAccount (see schema)
  revalidatePath("/accounts");
  return okResult(undefined);
}
