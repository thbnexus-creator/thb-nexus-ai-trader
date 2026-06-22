import { useState } from "react";
import { useGetDeposits, useGetBalance, useCreateDeposit, getGetDepositsQueryKey, getGetBalanceQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout";

const QUICK_AMOUNTS = [100, 500, 1000, 5000];

export default function DepositsPage() {
  const queryClient = useQueryClient();
  const { data: deposits } = useGetDeposits({ query: { refetchInterval: 10000, queryKey: getGetDepositsQueryKey() } });
  const { data: balance } = useGetBalance({ query: { refetchInterval: 5000, queryKey: getGetBalanceQueryKey() } });
  const createDeposit = useCreateDeposit();

  const [amount, setAmount] = useState("");
  const [txHash, setTxHash] = useState("");
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);

  function showToast(msg: string, type: "ok" | "err" = "ok") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }

  function handleDeposit(e: React.FormEvent) {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!amt || amt < 1) { showToast("Minimum deposit is $1", "err"); return; }
    createDeposit.mutate(
      { data: { amount: amt, txHash: txHash || null } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetDepositsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetBalanceQueryKey() });
          showToast(`$${amt} USDT deposit confirmed`);
          setAmount("");
          setTxHash("");
        },
        onError: (err: any) => showToast(err?.response?.data?.error ?? "Deposit failed", "err"),
      }
    );
  }

  return (
    <Layout>
      <div className="p-4 sm:p-5 space-y-4">
        {/* Header */}
        <div>
          <h1 className="text-base font-bold text-foreground">USDT Deposits</h1>
          <p className="text-[11px] text-muted-foreground mt-0.5">Manage your simulation trading funds</p>
        </div>

        {/* Balance row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card border border-primary/20 rounded-xl p-3 sm:p-4">
            <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Balance</div>
            <div className="text-lg sm:text-2xl font-bold font-mono text-primary ticker-glow">${(balance?.usdt ?? 0).toFixed(2)}</div>
            <div className="text-[9px] text-muted-foreground mt-0.5">USDT</div>
          </div>
          <div className="bg-card border border-card-border rounded-xl p-3 sm:p-4">
            <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Deposited</div>
            <div className="text-lg sm:text-2xl font-bold font-mono text-foreground">${(balance?.totalDeposited ?? 0).toFixed(2)}</div>
            <div className="text-[9px] text-muted-foreground mt-0.5">USDT</div>
          </div>
          <div className="bg-card border border-card-border rounded-xl p-3 sm:p-4">
            <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Trading P&L</div>
            <div className={`text-lg sm:text-2xl font-bold font-mono ${(balance?.totalPnl ?? 0) >= 0 ? "text-profit" : "text-loss"}`}>
              {(balance?.totalPnl ?? 0) >= 0 ? "+" : ""}${(balance?.totalPnl ?? 0).toFixed(2)}
            </div>
            <div className="text-[9px] text-muted-foreground mt-0.5">USDT</div>
          </div>
        </div>

        {/* Toast */}
        {toast && (
          <div className={`px-4 py-3 rounded-xl border text-sm font-medium flex items-center gap-2 ${
            toast.type === "ok"
              ? "bg-chart-2/10 border-chart-2/25 text-chart-2"
              : "bg-destructive/10 border-destructive/25 text-destructive"
          }`}>
            <span>{toast.type === "ok" ? "✓" : "✗"}</span>
            {toast.msg}
          </div>
        )}

        {/* Deposit form */}
        <div className="bg-card border border-card-border rounded-xl p-4">
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4">Deposit USDT</div>

          {/* Wallet address */}
          <div className="mb-4 p-3 bg-secondary border border-input rounded-xl">
            <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Deposit Wallet (TRC20 · Simulation)</div>
            <div className="font-mono text-xs text-primary break-all select-all">TLfx9QkMz7JGPxA8B5nDwKhN3vRe2cY4mU</div>
          </div>

          <form onSubmit={handleDeposit} className="space-y-3">
            {/* Quick amounts */}
            <div>
              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Quick Select</div>
              <div className="grid grid-cols-4 gap-2">
                {QUICK_AMOUNTS.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setAmount(String(v))}
                    className={`py-2.5 text-xs font-bold font-mono rounded-xl border transition-all active:scale-[0.97] ${
                      amount === String(v)
                        ? "bg-primary/15 border-primary/40 text-primary"
                        : "bg-secondary border-border text-muted-foreground hover:text-primary hover:border-primary/30"
                    }`}
                  >
                    ${v}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Amount (USDT)</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-mono">$</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="1"
                  step="0.01"
                  required
                  placeholder="100.00"
                  className="w-full pl-8 pr-16 py-3 bg-secondary border border-input rounded-xl text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground">USDT</span>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">TX Hash (optional)</label>
              <input
                type="text"
                value={txHash}
                onChange={(e) => setTxHash(e.target.value)}
                placeholder="0x... or leave blank for auto"
                className="w-full px-3.5 py-3 bg-secondary border border-input rounded-xl text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={createDeposit.isPending}
              className="w-full py-4 bg-primary text-primary-foreground font-bold text-sm rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all glow-cyan active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {createDeposit.isPending ? <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> : "◎"}
              {createDeposit.isPending ? "Processing..." : "Confirm Deposit"}
            </button>
          </form>
        </div>

        {/* History */}
        <div className="bg-card border border-card-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Transaction History</div>
            <span className="text-[9px] text-muted-foreground">{(deposits ?? []).length} records</span>
          </div>
          {(deposits ?? []).length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">No deposits yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[400px]">
                <thead className="border-b border-border">
                  <tr className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                    <th className="px-4 py-2.5 text-left">Amount</th>
                    <th className="px-4 py-2.5 text-left">Status</th>
                    <th className="px-4 py-2.5 text-left">TX Hash</th>
                    <th className="px-4 py-2.5 text-left">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {(deposits ?? []).map((d) => (
                    <tr key={d.id} className="hover:bg-secondary/40 transition-colors">
                      <td className="px-4 py-3 font-bold font-mono text-profit text-sm">+${d.amount.toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <span className="text-[9px] font-bold px-2 py-1 rounded-full bg-chart-2/15 text-chart-2 border border-chart-2/25 uppercase tracking-wider">
                          {d.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-[10px] text-muted-foreground">
                        {d.txHash ? `${d.txHash.slice(0, 14)}…` : "—"}
                      </td>
                      <td className="px-4 py-3 text-[10px] text-muted-foreground whitespace-nowrap">
                        {new Date(d.createdAt).toLocaleDateString()}{" "}
                        <span className="opacity-60">{new Date(d.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
