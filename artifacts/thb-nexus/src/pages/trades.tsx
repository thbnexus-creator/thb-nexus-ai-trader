import { useGetTrades, getGetTradesQueryKey, useGetTradeStats, getGetTradeStatsQueryKey } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";

export default function TradesPage() {
  const { data: trades } = useGetTrades({ query: { refetchInterval: 5000, queryKey: getGetTradesQueryKey() } });
  const { data: stats } = useGetTradeStats({ query: { refetchInterval: 5000, queryKey: getGetTradeStatsQueryKey() } });

  const pnlUp = (stats?.totalPnl ?? 0) >= 0;
  const winRateUp = (stats?.winRate ?? 0) >= 50;

  return (
    <Layout>
      <div className="p-4 sm:p-5 space-y-4">
        <div>
          <h1 className="text-base font-bold text-foreground">Trade History</h1>
          <p className="text-[11px] text-muted-foreground mt-0.5">Simulated trade record and performance analytics</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-card border border-card-border rounded-xl p-4">
            <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Total Trades</div>
            <div className="text-2xl font-bold font-mono text-foreground">{stats?.totalTrades ?? 0}</div>
          </div>
          <div className="bg-card border border-card-border rounded-xl p-4">
            <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Win Rate</div>
            <div className={`text-2xl font-bold font-mono ${winRateUp ? "text-profit" : "text-loss"}`}>{stats?.winRate ?? 0}%</div>
            <div className="text-[9px] text-muted-foreground mt-1">{stats?.winningTrades ?? 0}W · {stats?.losingTrades ?? 0}L</div>
          </div>
          <div className="bg-card border border-card-border rounded-xl p-4">
            <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Total P&L</div>
            <div className={`text-2xl font-bold font-mono ${pnlUp ? "text-profit" : "text-loss"}`}>
              {pnlUp ? "+" : ""}${(stats?.totalPnl ?? 0).toFixed(2)}
            </div>
          </div>
          <div className="bg-card border border-card-border rounded-xl p-4">
            <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Best Trade</div>
            <div className="text-2xl font-bold font-mono text-profit">+${(stats?.bestTrade ?? 0).toFixed(2)}</div>
            <div className="text-[9px] text-muted-foreground mt-1">Worst: ${(stats?.worstTrade ?? 0).toFixed(2)}</div>
          </div>
        </div>

        {/* Win rate bar */}
        <div className="bg-card border border-card-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Win vs Loss</span>
            <span className="text-xs font-bold text-foreground">{stats?.winRate ?? 0}% win rate</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden flex">
            <div
              className="h-full bg-chart-2 transition-all duration-700"
              style={{ width: `${stats?.winRate ?? 0}%` }}
            />
            <div
              className="h-full bg-destructive transition-all duration-700"
              style={{ width: `${100 - (stats?.winRate ?? 0)}%` }}
            />
          </div>
          <div className="flex justify-between mt-1.5 text-[9px] text-muted-foreground">
            <span className="text-chart-2">{stats?.winningTrades ?? 0} winning</span>
            <span className="text-destructive">{stats?.losingTrades ?? 0} losing</span>
          </div>
        </div>

        {/* Trades table */}
        <div className="bg-card border border-card-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Trade Log</div>
            <span className="text-[9px] text-muted-foreground">{(trades ?? []).length} records</span>
          </div>
          {(trades ?? []).length === 0 ? (
            <div className="py-10 text-center">
              <div className="text-3xl mb-2 opacity-20">▤</div>
              <p className="text-sm text-muted-foreground">No trades yet</p>
              <p className="text-[11px] text-muted-foreground mt-1">Start the bot to generate simulated trades</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead className="border-b border-border bg-muted/20">
                  <tr className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                    <th className="px-4 py-2.5 text-left">Symbol</th>
                    <th className="px-4 py-2.5 text-left">Side</th>
                    <th className="px-4 py-2.5 text-left">Entry</th>
                    <th className="px-4 py-2.5 text-left">Exit</th>
                    <th className="px-4 py-2.5 text-left">Lots</th>
                    <th className="px-4 py-2.5 text-left">P&L</th>
                    <th className="px-4 py-2.5 text-left">Opened</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {(trades ?? []).map((t) => {
                    const pnlUp = (t.profitLoss ?? 0) >= 0;
                    return (
                      <tr key={t.id} className="hover:bg-secondary/40 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-xs text-foreground">{t.symbol}</td>
                        <td className="px-4 py-3">
                          <span className={`text-[9px] font-black px-2 py-1 rounded-full border uppercase tracking-wider ${
                            t.direction === "buy"
                              ? "bg-chart-2/15 text-chart-2 border-chart-2/25"
                              : "bg-destructive/15 text-destructive border-destructive/25"
                          }`}>
                            {t.direction}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">{t.entryPrice.toFixed(5)}</td>
                        <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">{t.exitPrice ? t.exitPrice.toFixed(5) : "—"}</td>
                        <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">{t.lots}</td>
                        <td className={`px-4 py-3 font-mono font-bold text-sm ${pnlUp ? "text-profit" : "text-loss"}`}>
                          {t.profitLoss !== null ? `${pnlUp ? "+" : ""}$${t.profitLoss.toFixed(2)}` : "—"}
                        </td>
                        <td className="px-4 py-3 text-[10px] text-muted-foreground whitespace-nowrap">
                          {new Date(t.openedAt).toLocaleDateString()}{" "}
                          <span className="opacity-60">{new Date(t.openedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
