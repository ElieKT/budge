"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePlaidLink } from "react-plaid-link";
import { Button } from "@/components/ui/Button";
import { createPlaidLinkToken, exchangePlaidPublicToken } from "@/server/actions/plaid";

export function PlaidConnectButton({ configured }: { configured: boolean }) {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const onSuccess = useCallback(
    async (publicToken: string | null) => {
      if (!publicToken) return;
      setLoading(true);
      const result = await exchangePlaidPublicToken(publicToken);
      setLoading(false);
      if (!result.ok) setError(result.error);
      else router.refresh();
    },
    [router],
  );

  const { open, ready } = usePlaidLink({ token: linkToken ?? "", onSuccess });

  useEffect(() => {
    if (linkToken && ready) open();
  }, [linkToken, ready, open]);

  async function start() {
    setError(null);
    setLoading(true);
    const result = await createPlaidLinkToken();
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setLinkToken(result.data.linkToken);
  }

  if (!configured) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-500">
        Bank/card sync requires Plaid API keys to be configured on this deployment (
        <code className="rounded bg-slate-200 px-1 py-0.5 text-xs">PLAID_CLIENT_ID</code> /{" "}
        <code className="rounded bg-slate-200 px-1 py-0.5 text-xs">PLAID_SECRET</code> — see README). Use
        &quot;+ Add account&quot; to track a balance manually instead.
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="secondary" onClick={start} disabled={loading}>
        {loading ? "Connecting…" : "🔗 Connect a bank or card"}
      </Button>
      {error && <span className="text-sm text-expense">{error}</span>}
    </div>
  );
}
