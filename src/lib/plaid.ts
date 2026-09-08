import "server-only";
import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";
import crypto from "node:crypto";

/**
 * Read-only Plaid integration. This app only ever requests the
 * `transactions` and (optionally) `investments` products — never
 * `auth`/`transfer`/`payment_initiation`, which is what would let an app
 * move money. There is no code path anywhere that submits a transfer or a
 * trade to Plaid or any brokerage.
 *
 * Requires PLAID_CLIENT_ID and PLAID_SECRET (see .env.example). Without
 * them, isPlaidConfigured() returns false and every caller should treat
 * bank-sync UI as unavailable rather than attempt a request that will
 * fail.
 */
export function isPlaidConfigured(): boolean {
  return Boolean(process.env.PLAID_CLIENT_ID && process.env.PLAID_SECRET);
}

let cachedClient: PlaidApi | null = null;

export function getPlaidClient(): PlaidApi {
  if (!isPlaidConfigured()) {
    throw new Error(
      "Plaid is not configured. Set PLAID_CLIENT_ID and PLAID_SECRET (see .env.example) to enable bank sync.",
    );
  }
  if (cachedClient) return cachedClient;

  const env = process.env.PLAID_ENV || "sandbox";
  const configuration = new Configuration({
    basePath: PlaidEnvironments[env as keyof typeof PlaidEnvironments] ?? PlaidEnvironments.sandbox,
    baseOptions: {
      headers: {
        "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID,
        "PLAID-SECRET": process.env.PLAID_SECRET,
      },
    },
  });
  cachedClient = new PlaidApi(configuration);
  return cachedClient;
}

// --- Access token encryption at rest -----------------------------------
// A Plaid access token is a long-lived credential for read-only access to
// a user's linked institution — treated the same as a password: encrypted
// at rest (AES-256-GCM) with a server-only key, never sent to the client,
// never logged.

function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key || key.length < 32) {
    throw new Error(
      "ENCRYPTION_KEY is not set (or too short). Generate one with: openssl rand -hex 32 — see .env.example.",
    );
  }
  return crypto.createHash("sha256").update(key).digest();
}

export function encryptSecret(plaintext: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv.toString("base64"), authTag.toString("base64"), encrypted.toString("base64")].join(".");
}

export function decryptSecret(ciphertext: string): string {
  const [ivB64, tagB64, dataB64] = ciphertext.split(".");
  if (!ivB64 || !tagB64 || !dataB64) throw new Error("Malformed ciphertext.");
  const decipher = crypto.createDecipheriv("aes-256-gcm", getEncryptionKey(), Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(dataB64, "base64")), decipher.final()]).toString("utf8");
}
