import { useGetTrades, getGetTradesQueryKey, useGetTradeStats, getGetTradeStatsQueryKey } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";

const SYMBOL_DP: Record<string, number> = { BTCUSD: 2, XAUUSD: 2 };

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
          <p className="text-[11px] text-muted-foreground mt-0.5">Simulated trade record · EMA9 / EMA100 / RSI4 strategy engine</p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-card border border-card-border rounded-xl p-4">
            <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Total Trades</div>
            <div className="text-2xl font-bold font-mono text-foreground">{stats?.totalTrades ?? 0}</div>
            <div className="text-[9px] text-muted-foreground mt-1">{stats?.winningTrades ?? 0}W · {stats?.losingTrades ?? 0}L</div>
          </div>
          <div className="bg-card border border-card-border rounded-xl p-4">
            <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Win Rate</div>
            <div className={`text-2xl font-bold font-mono ${winRateUp ? "text-profit" : "text-loss"}`}>{stats?.winRate ?? 0}%</div>
            <div className="h-1.5 bg-muted rounded-full mt-2 overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-700 ${winRateUp ? "bg-chart-2" : "bg-destructive"}`} style={{ width: `${stats?.winRate ?? 0}%` }} />
            </div>
          </div>
          <div className={`bg-card border rounded-xl p-4 ${pnlUp ? "border-chart-2/20" : "border-destructive/20"}`}>
            <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Total P&L</div>
            <div className={`text-2xl font-bold font-mono ${pnlUp ? "text-profit" : "text-loss"}`}>
              {pnlUp ? "+" : ""}${(stats?.totalPnl ?? 0).toFixed(2)}
            </div>
            <div className="text-[9px] text-muted-foreground mt-1">Avg: {(stats?.avgProfit ?? 0) >= 0 ? "+" : ""}${(stats?.avgProfit ?? 0).toFixed(2)}/trade</div>
          </div>
          <div className="bg-card border border-card-border rounded-xl p-4">
            <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Best / Worst</div>
            <div className="text-xl font-bold font-mono text-profit">+${(stats?.bestTrade ?? 0).toFixed(2)}</div>
            <div className="text-[11px] font-mono text-loss mt-0.5">${(stats?.worstTrade ?? 0).toFixed(2)} worst</div>
          </div>
        </div>

        {/* Win/Loss bar */}
        <div className="bg-card border border-card-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Win vs Loss Breakdown</span>
            <span className="text-xs font-bold text-foreground">{stats?.winRate ?? 0}% win rate</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden flex">
            <div className="h-full bg-chart-2 transition-all duration-700" style={{ width: `${stats?.winRate ?? 0}%` }} />
            <div className="h-full bg-destructive/60 transition-all duration-700 flex-1" />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-[9px] text-chart-2">{stats?.winningTrades ?? 0} winning trades</span>
            <span className="text-[9px] text-destructive">{stats?.losingTrades ?? 0} losing trades</span>
          </div>
        </div>

        {/* Trades table */}
        <div className="bg-card border border-card-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Trade Log</div>
            <span className="text-[9px] text-muted-foreground">{(trades ?? []).length} records</span>
          </div>
          {(trades ?? []).length === 0 ? (
            <div className="py-12 text-center">
              <div className="text-4xl mb-3 opacity-20">▤</div>
              <p className="text-sm text-muted-foreground">No trades yet</p>
              <p className="text-[11px] text-muted-foreground mt-1">Start the trading bot to generate simulated trades</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[740px]">
                <thead className="border-b border-border bg-muted/20">
                  <tr className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                    <th className="px-4 py-2.5 text-left">Symbol</th>
                    <th className="px-4 py-2.5 text-left">Side</th>
                    <th className="px-4 py-2.5 text-left">Strategy</th>
                    <th className="px-4 py-2.5 text-left">TF</th>
                    <th className="px-4 py-2.5 text-left">Entry</th>
                    <th className="px-4 py-2.5 text-left">Exit</th>
                    <th className="px-4 py-2.5 text-left">Lots</th>
                    <th className="px-4 py-2.5 text-left">P&L</th>
                    <th className="px-4 py-2.5 text-left">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {(trades ?? []).map((t) => {
                    const up = (t.profitLoss ?? 0) >= 0;
                    const dp = SYMBOL_DP[t.symbol] ?? 5;
                    return (
                      <tr key={t.id} className="hover:bg-secondary/40 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-xs text-foreground">{t.symbol}</td>
                        <td className="px-4 py-3">
                          <span className={`text-[9px] font-black px-2 py-1 rounded-full border uppercase ${
                            t.direction === "buy"
                              ? "bg-chart-2/15 text-chart-2 border-chart-2/25"
                              : "bg-destructive/15 text-destructive border-destructive/25"
                          }`}>
                            {t.direction}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[10px] text-muted-foreground">{t.strategy ?? "—"}</td>
                        <td className="px-4 py-3">
                          {t.timeframe
                            ? <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-secondary border border-border text-muted-foreground">{t.timeframe}</span>
                            : <span className="text-muted-foreground/50">—</span>}
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">{t.entryPrice.toFixed(dp)}</td>
                        <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">{t.exitPrice ? t.exitPrice.toFixed(dp) : "—"}</td>
                        <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">{t.lots}</td>
                        <td className={`px-4 py-3 font-mono font-bold text-sm ${up ? "text-profit" : "text-loss"}`}>
                          {t.profitLoss !== null ? `${up ? "+" : ""}$${t.profitLoss.toFixed(2)}` : "—"}
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

        <p className="text-center text-[10px] text-muted-foreground">
          Simulation only — no real funds at risk · Powered by EMA9 / EMA100 / RSI4
        </p>
      </div>
    </Layout>
  );
}
