import { useState } from "react";
import { useGetDeposits, useGetBalance, useCreateDeposit, getGetDepositsQueryKey, getGetBalanceQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout";

export default function DepositsPage() {
  const queryClient = useQueryClient();
  const { data: deposits } = useGetDeposits({ query: { refetchInterval: 10000, queryKey: getGetDepositsQueryKey() } });
  const { data: balance } = useGetBalance({ query: { refetchInterval: 5000, queryKey: getGetBalanceQueryKey() } });
  const createDeposit = useCreateDeposit();

  const [amount, setAmount] = useState("");
  const [txHash, setTxHash] = useState("");
  const [message, setMessage] = useState("");

  function handleDeposit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    const amt = parseFloat(amount);
    if (!amt || amt < 1) {
      setMessage("Minimum deposit is $1 USDT");
      return;
    }
    createDeposit.mutate(
      { data: { amount: amt, txHash: txHash || null } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetDepositsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetBalanceQueryKey() });
          setMessage(`Deposit of $${amt} USDT confirmed (simulation)`);
          setAmount("");
          setTxHash("");
        },
        onError: (err: any) => {
          setMessage(err?.response?.data?.error ?? "Deposit failed");
        },
      }
    );
  }

  return (
    <Layout>
      <div className="p-6 space-y-6 max-w-3xl">
        <div>
          <h1 className="text-lg font-bold text-foreground">USDT Deposits</h1>
          <p className="text-sm text-muted-foreground">Manage your trading funds</p>
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-card border border-primary/20 rounded-lg p-4">
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Available Balance</div>
            <div className="text-2xl font-bold font-mono text-primary ticker-glow">${(balance?.usdt ?? 0).toFixed(2)}</div>
            <div className="text-[10px] text-muted-foreground mt-1">USDT</div>
          </div>
          <div className="bg-card border border-card-border rounded-lg p-4">
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Total Deposited</div>
            <div className="text-2xl font-bold font-mono text-foreground">${(balance?.totalDeposited ?? 0).toFixed(2)}</div>
            <div className="text-[10px] text-muted-foreground mt-1">USDT</div>
          </div>
          <div className="bg-card border border-card-border rounded-lg p-4">
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Trading P&L</div>
            <div className={`text-2xl font-bold font-mono ${(balance?.totalPnl ?? 0) >= 0 ? "text-profit" : "text-loss"}`}>
              {(balance?.totalPnl ?? 0) >= 0 ? "+" : ""}${(balance?.totalPnl ?? 0).toFixed(2)}
            </div>
            <div className="text-[10px] text-muted-foreground mt-1">USDT</div>
          </div>
        </div>

        {/* Deposit Form */}
        <div className="bg-card border border-card-border rounded-xl p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Deposit USDT</h2>
          <div className="mb-4 px-3 py-2.5 bg-muted/30 border border-border rounded-md text-xs text-muted-foreground">
            Send USDT (TRC20/ERC20) to the address below. Paste your TX hash for confirmation simulation.
          </div>

          {/* Wallet Address Display */}
          <div className="mb-4 p-3 bg-secondary border border-input rounded-md">
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Deposit Wallet Address</div>
            <div className="font-mono text-xs text-primary break-all">TLfx9QkMz7JGPxA8B5nDwKhN3vRe2cY4mU</div>
            <div className="text-[10px] text-muted-foreground mt-1">USDT — TRC20 (Tron) · Simulation Only</div>
          </div>

          <form onSubmit={handleDeposit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">
                Amount (USDT)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-mono">$</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="1"
                  step="0.01"
                  required
                  className="w-full pl-7 pr-16 py-2.5 bg-secondary border border-input rounded-md text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
                  placeholder="100.00"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-bold">USDT</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">
                TX Hash (optional)
              </label>
              <input
                type="text"
                value={txHash}
                onChange={(e) => setTxHash(e.target.value)}
                className="w-full px-3 py-2.5 bg-secondary border border-input rounded-md text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
                placeholder="0x... (auto-generated if empty)"
              />
            </div>

            {/* Quick amounts */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">Quick Select</label>
              <div className="flex gap-2">
                {[100, 500, 1000, 5000].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setAmount(String(v))}
                    className="py-1.5 px-3 text-xs font-mono font-medium bg-secondary hover:bg-primary/10 border border-border hover:border-primary/30 rounded text-muted-foreground hover:text-primary transition-all"
                  >
                    ${v}
                  </button>
                ))}
              </div>
            </div>

            {message && (
              <div className="px-3 py-2 bg-primary/10 border border-primary/20 rounded-md text-xs text-primary">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={createDeposit.isPending}
              className="w-full py-2.5 bg-primary text-primary-foreground font-semibold text-sm rounded-md hover:bg-primary/90 disabled:opacity-50 transition-all glow-cyan"
            >
              {createDeposit.isPending ? "Processing..." : "Confirm Deposit (Simulation)"}
            </button>
          </form>
        </div>

        {/* Transaction History */}
        <div className="bg-card border border-card-border rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">Transaction History</h2>
          </div>
          <div className="overflow-x-auto">
            {(deposits ?? []).length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-muted-foreground">No deposits yet</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="border-b border-border">
                  <tr className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    <th className="px-4 py-2.5 text-left">Amount</th>
                    <th className="px-4 py-2.5 text-left">Currency</th>
                    <th className="px-4 py-2.5 text-left">Status</th>
                    <th className="px-4 py-2.5 text-left">TX Hash</th>
                    <th className="px-4 py-2.5 text-left">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {(deposits ?? []).map((d) => (
                    <tr key={d.id} className="hover:bg-secondary/50 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-profit">+${d.amount.toFixed(2)}</td>
                      <td className="px-4 py-3 text-muted-foreground font-bold text-xs">{d.currency}</td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-chart-2/15 text-chart-2 border border-chart-2/25 uppercase">
                          {d.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {d.txHash ? `${d.txHash.slice(0, 12)}...` : "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {new Date(d.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
