import { useGetMarketTickers, getGetMarketTickersQueryKey, useGetMarketSummary, getGetMarketSummaryQueryKey, useGetBotStatus, getGetBotStatusQueryKey, useGetBalance, getGetBalanceQueryKey, useGetTradeStats, getGetTradeStatsQueryKey } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";

function TickerBar() {
  const { data: tickers } = useGetMarketTickers({ query: { refetchInterval: 3000, queryKey: getGetMarketTickersQueryKey() } });

  return (
    <div className="bg-card border-b border-border px-6 py-2 flex items-center gap-6 overflow-x-auto">
      <span className="text-[10px] font-bold text-primary uppercase tracking-widest flex-shrink-0 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-primary pulse-dot" />
        Live
      </span>
      {(tickers ?? []).map((t) => (
        <div key={t.symbol} className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs font-bold text-foreground font-mono">{t.symbol}</span>
          <span className="text-xs font-mono ticker-glow text-primary">{t.price.toFixed(t.symbol === "BTCUSD" || t.symbol === "XAUUSD" ? 2 : 5)}</span>
          <span className={`text-[11px] font-medium ${t.direction === "up" ? "text-profit" : "text-loss"}`}>
            {t.direction === "up" ? "+" : ""}{t.changePercent.toFixed(3)}%
          </span>
        </div>
      ))}
    </div>
  );
}

function StatCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className={`bg-card border rounded-lg p-4 ${accent ? "border-primary/30 bg-primary/5" : "border-card-border"}`}>
      <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">{label}</div>
      <div className={`text-2xl font-bold font-mono ${accent ? "text-primary ticker-glow" : "text-foreground"}`}>{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
    </div>
  );
}

export default function Dashboard() {
  const { data: tickers } = useGetMarketTickers({ query: { refetchInterval: 3000, queryKey: getGetMarketTickersQueryKey() } });
  const { data: summary } = useGetMarketSummary({ query: { refetchInterval: 5000, queryKey: getGetMarketSummaryQueryKey() } });
  const { data: botStatus } = useGetBotStatus({ query: { refetchInterval: 5000, queryKey: getGetBotStatusQueryKey() } });
  const { data: balance } = useGetBalance({ query: { refetchInterval: 5000, queryKey: getGetBalanceQueryKey() } });
  const { data: stats } = useGetTradeStats();

  return (
    <Layout>
      <TickerBar />

      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-foreground">Trading Dashboard</h1>
            <p className="text-sm text-muted-foreground">Real-time market overview</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-chart-2 pulse-dot" />
            Markets open
          </div>
        </div>

        {/* Balance + Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="USDT Balance"
            value={`$${(balance?.usdt ?? 0).toFixed(2)}`}
            sub="Available funds"
            accent
          />
          <StatCard
            label="Total P&L"
            value={`${(stats?.totalPnl ?? 0) >= 0 ? "+" : ""}$${(stats?.totalPnl ?? 0).toFixed(2)}`}
            sub={`${stats?.totalTrades ?? 0} trades`}
          />
          <StatCard
            label="Win Rate"
            value={`${stats?.winRate ?? 0}%`}
            sub={`${stats?.winningTrades ?? 0}W / ${stats?.losingTrades ?? 0}L`}
          />
          <StatCard
            label="Bot Status"
            value={botStatus?.isRunning ? "RUNNING" : "IDLE"}
            sub={botStatus?.strategy ?? "No strategy"}
            accent={botStatus?.isRunning}
          />
        </div>

        {/* Tickers Grid */}
        <div>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Market Watch</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {(tickers ?? []).map((t) => (
              <div key={t.symbol} className="bg-card border border-card-border rounded-lg p-4 hover:border-primary/30 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-foreground">{t.symbol}</span>
                  <span className={`w-2 h-2 rounded-full pulse-dot ${t.direction === "up" ? "bg-chart-2" : "bg-destructive"}`} />
                </div>
                <div className="text-xl font-bold font-mono text-primary ticker-glow">
                  {t.price.toFixed(t.symbol === "BTCUSD" || t.symbol === "XAUUSD" ? 2 : 5)}
                </div>
                <div className={`text-sm font-medium mt-1 ${t.direction === "up" ? "text-profit" : "text-loss"}`}>
                  {t.direction === "up" ? "+" : ""}{t.changePercent.toFixed(3)}%
                </div>
                <div className="mt-3 pt-3 border-t border-border grid grid-cols-2 gap-2 text-[10px] text-muted-foreground">
                  <div>
                    <div className="text-[9px] uppercase tracking-wider mb-0.5">High 24h</div>
                    <div className="font-mono text-foreground">{t.high24h.toFixed(t.symbol === "BTCUSD" || t.symbol === "XAUUSD" ? 2 : 5)}</div>
                  </div>
                  <div>
                    <div className="text-[9px] uppercase tracking-wider mb-0.5">Low 24h</div>
                    <div className="font-mono text-foreground">{t.low24h.toFixed(t.symbol === "BTCUSD" || t.symbol === "XAUUSD" ? 2 : 5)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Market Summary + Bot Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-card border border-card-border rounded-lg p-4">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Market Sentiment</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Bullish</span>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 bg-muted rounded-full w-32 overflow-hidden">
                    <div
                      className="h-full bg-chart-2 rounded-full transition-all"
                      style={{ width: `${((summary?.bullishCount ?? 0) / 4) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-profit w-4">{summary?.bullishCount ?? 0}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Bearish</span>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 bg-muted rounded-full w-32 overflow-hidden">
                    <div
                      className="h-full bg-destructive rounded-full transition-all"
                      style={{ width: `${((summary?.bearishCount ?? 0) / 4) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-loss w-4">{summary?.bearishCount ?? 0}</span>
                </div>
              </div>
              <div className="pt-2 border-t border-border text-xs text-muted-foreground">
                Vol: {((summary?.totalVolume ?? 0) / 1000000).toFixed(2)}M
              </div>
            </div>
          </div>

          <div className="bg-card border border-card-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Bot Control</h2>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                botStatus?.isRunning ? "bg-chart-2/20 text-chart-2 border border-chart-2/30" : "bg-muted text-muted-foreground border border-border"
              }`}>
                {botStatus?.status ?? "idle"}
              </span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Strategy</span>
                <span className="text-foreground font-medium">{botStatus?.strategy ?? "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Risk Level</span>
                <span className="text-foreground font-medium">{botStatus?.riskLevel ?? "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Trades Run</span>
                <span className="text-primary font-mono font-bold">{botStatus?.tradesExecuted ?? 0}</span>
              </div>
            </div>
            <a
              href="/bot"
              onClick={(e) => { e.preventDefault(); window.location.href = "/bot"; }}
              className="mt-4 w-full inline-block text-center py-2 px-4 bg-secondary hover:bg-accent/20 border border-border hover:border-primary/30 text-sm text-foreground rounded-md transition-all"
            >
              Manage Bot
            </a>
          </div>
        </div>
      </div>
    </Layout>
  );
}
