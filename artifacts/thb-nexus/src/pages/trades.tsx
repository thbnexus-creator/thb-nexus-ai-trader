import { useGetTrades, getGetTradesQueryKey, useGetTradeStats, getGetTradeStatsQueryKey } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";

export default function TradesPage() {
  const { data: trades } = useGetTrades({ query: { refetchInterval: 10000, queryKey: getGetTradesQueryKey() } });
  const { data: stats } = useGetTradeStats({ query: { refetchInterval: 10000, queryKey: getGetTradeStatsQueryKey() } });

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-lg font-bold text-foreground">Trade History</h1>
          <p className="text-sm text-muted-foreground">Simulated trade record and performance analytics</p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-card border border-card-border rounded-lg p-4">
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Total Trades</div>
            <div className="text-2xl font-bold font-mono text-foreground">{stats?.totalTrades ?? 0}</div>
          </div>
          <div className="bg-card border border-card-border rounded-lg p-4">
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Win Rate</div>
            <div className={`text-2xl font-bold font-mono ${(stats?.winRate ?? 0) >= 50 ? "text-profit" : "text-loss"}`}>
              {stats?.winRate ?? 0}%
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">{stats?.winningTrades ?? 0}W / {stats?.losingTrades ?? 0}L</div>
          </div>
          <div className="bg-card border border-card-border rounded-lg p-4">
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Total P&L</div>
            <div className={`text-2xl font-bold font-mono ${(stats?.totalPnl ?? 0) >= 0 ? "text-profit" : "text-loss"}`}>
              {(stats?.totalPnl ?? 0) >= 0 ? "+" : ""}${(stats?.totalPnl ?? 0).toFixed(2)}
            </div>
          </div>
          <div className="bg-card border border-card-border rounded-lg p-4">
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Best Trade</div>
            <div className="text-2xl font-bold font-mono text-profit">+${(stats?.bestTrade ?? 0).toFixed(2)}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">Worst: ${(stats?.worstTrade ?? 0).toFixed(2)}</div>
          </div>
        </div>

        {/* Trades Table */}
        <div className="bg-card border border-card-border rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-border flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Trade Log</h2>
            <span className="text-[10px] font-medium text-muted-foreground">{(trades ?? []).length} records</span>
          </div>
          <div className="overflow-x-auto">
            {(trades ?? []).length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-muted-foreground">No trades yet. Start the bot to generate simulated trades.</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="border-b border-border">
                  <tr className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    <th className="px-4 py-2.5 text-left">Symbol</th>
                    <th className="px-4 py-2.5 text-left">Side</th>
                    <th className="px-4 py-2.5 text-left">Entry</th>
                    <th className="px-4 py-2.5 text-left">Exit</th>
                    <th className="px-4 py-2.5 text-left">Lots</th>
                    <th className="px-4 py-2.5 text-left">P&L</th>
                    <th className="px-4 py-2.5 text-left">Status</th>
                    <th className="px-4 py-2.5 text-left">Opened</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {(trades ?? []).map((t) => (
                    <tr key={t.id} className="hover:bg-secondary/50 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-foreground text-xs">{t.symbol}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                          t.direction === "buy"
                            ? "bg-chart-2/15 text-chart-2 border border-chart-2/25"
                            : "bg-destructive/15 text-destructive border border-destructive/25"
                        }`}>
                          {t.direction}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{t.entryPrice.toFixed(5)}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{t.exitPrice ? t.exitPrice.toFixed(5) : "—"}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{t.lots}</td>
                      <td className={`px-4 py-3 font-mono font-bold text-sm ${(t.profitLoss ?? 0) >= 0 ? "text-profit" : "text-loss"}`}>
                        {t.profitLoss !== null ? `${t.profitLoss >= 0 ? "+" : ""}$${t.profitLoss.toFixed(2)}` : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] font-medium text-muted-foreground uppercase">{t.status}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(t.openedAt).toLocaleString()}
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
