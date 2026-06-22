import { useGetMarketTickers, getGetMarketTickersQueryKey, useGetMarketSummary, getGetMarketSummaryQueryKey, useGetBotStatus, getGetBotStatusQueryKey, useGetBalance, getGetBalanceQueryKey, useGetTradeStats, getGetTradeStatsQueryKey } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Link } from "wouter";

function TickerBanner() {
  const { data: tickers } = useGetMarketTickers({ query: { refetchInterval: 1000, queryKey: getGetMarketTickersQueryKey() } });

  return (
    <div className="bg-card/50 border-b border-border px-5 py-2.5 flex items-center gap-6 overflow-x-auto">
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-chart-2 animate-pulse" />
        <span className="text-[9px] font-black text-chart-2 uppercase tracking-widest">Live Market</span>
      </div>
      <div className="flex items-center gap-5">
        {(tickers ?? []).map((t) => {
          const dp = t.symbol === "BTCUSD" || t.symbol === "XAUUSD" ? 2 : 5;
          const isUp = t.direction === "up";
          return (
            <div key={t.symbol} className="flex items-center gap-2.5 flex-shrink-0">
              <span className="text-[11px] font-bold text-foreground font-mono">{t.symbol}</span>
              <span className="text-[13px] font-bold font-mono text-primary">{t.price.toFixed(dp)}</span>
              <span className={`text-[11px] font-semibold flex items-center gap-0.5 ${isUp ? "text-profit" : "text-loss"}`}>
                {isUp ? "▲" : "▼"} {Math.abs(t.changePercent).toFixed(3)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: "primary" | "green" | "red" | "default" }) {
  const valueClass = color === "primary" ? "text-primary" : color === "green" ? "text-profit" : color === "red" ? "text-loss" : "text-foreground";
  const borderClass = color === "primary" ? "border-primary/25 bg-primary/4" : "border-card-border";
  return (
    <div className={`bg-card border rounded-xl p-4 ${borderClass}`}>
      <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-2.5">{label}</div>
      <div className={`text-2xl font-bold font-mono leading-none ${valueClass}`}>{value}</div>
      {sub && <div className="text-[11px] text-muted-foreground mt-1.5">{sub}</div>}
    </div>
  );
}

function MarketCard({ t }: { t: { symbol: string; price: number; changePercent: number; direction: string; high24h: number; low24h: number; volume: number } }) {
  const dp = t.symbol === "BTCUSD" || t.symbol === "XAUUSD" ? 2 : 5;
  const isUp = t.direction === "up";
  const highLowRange = t.high24h - t.low24h;
  const pct = highLowRange > 0 ? ((t.price - t.low24h) / highLowRange) * 100 : 50;

  return (
    <div className={`bg-card border rounded-xl p-4 hover:border-primary/30 transition-colors group`} style={{ borderColor: isUp ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)" }}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-sm font-bold text-foreground">{t.symbol}</div>
          <div className={`text-xs font-semibold flex items-center gap-1 mt-0.5 ${isUp ? "text-profit" : "text-loss"}`}>
            {isUp ? "▲" : "▼"} {isUp ? "+" : ""}{t.changePercent.toFixed(3)}%
          </div>
        </div>
        <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${isUp ? "bg-chart-2" : "bg-destructive"}`} />
      </div>

      <div className={`text-2xl font-bold font-mono mb-3 ${isUp ? "text-profit" : "text-loss"}`}>
        {t.price.toFixed(dp)}
      </div>

      {/* Price range bar */}
      <div className="mb-3">
        <div className="h-1 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${isUp ? "bg-chart-2" : "bg-destructive"}`}
            style={{ width: `${Math.max(2, Math.min(98, pct))}%` }}
          />
        </div>
        <div className="flex justify-between mt-1 text-[9px] text-muted-foreground font-mono">
          <span>{t.low24h.toFixed(dp)}</span>
          <span>24h</span>
          <span>{t.high24h.toFixed(dp)}</span>
        </div>
      </div>

      <div className="text-[10px] text-muted-foreground">
        Vol: {t.volume > 1000000 ? `${(t.volume / 1000000).toFixed(2)}M` : `${(t.volume / 1000).toFixed(0)}K`}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data: tickers } = useGetMarketTickers({ query: { refetchInterval: 1000, queryKey: getGetMarketTickersQueryKey() } });
  const { data: summary } = useGetMarketSummary({ query: { refetchInterval: 3000, queryKey: getGetMarketSummaryQueryKey() } });
  const { data: botStatus } = useGetBotStatus({ query: { refetchInterval: 3000, queryKey: getGetBotStatusQueryKey() } });
  const { data: balance } = useGetBalance({ query: { refetchInterval: 5000, queryKey: getGetBalanceQueryKey() } });
  const { data: stats } = useGetTradeStats({ query: { refetchInterval: 10000, queryKey: getGetTradeStatsQueryKey() } });

  const pnlPositive = (stats?.totalPnl ?? 0) >= 0;
  const balancePositive = (balance?.usdt ?? 0) >= 0;

  return (
    <Layout>
      <TickerBanner />

      <div className="p-5 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-foreground">Overview</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Real-time simulation dashboard</p>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-chart-2 animate-pulse" />
            Markets simulating
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          <StatCard
            label="USDT Balance"
            value={`$${(balance?.usdt ?? 0).toFixed(2)}`}
            sub="Available funds"
            color={balancePositive ? "primary" : "red"}
          />
          <StatCard
            label="Total P&L"
            value={`${pnlPositive ? "+" : ""}$${(stats?.totalPnl ?? 0).toFixed(2)}`}
            sub={`${stats?.totalTrades ?? 0} closed trades`}
            color={pnlPositive ? "green" : "red"}
          />
          <StatCard
            label="Win Rate"
            value={`${stats?.winRate ?? 0}%`}
            sub={`${stats?.winningTrades ?? 0}W · ${stats?.losingTrades ?? 0}L`}
            color={(stats?.winRate ?? 0) >= 50 ? "green" : "red"}
          />
          <StatCard
            label="Bot Status"
            value={botStatus?.isRunning ? "ACTIVE" : "IDLE"}
            sub={botStatus?.isRunning ? (botStatus.strategy ?? "") : "Not running"}
            color={botStatus?.isRunning ? "green" : "default"}
          />
        </div>

        {/* Market Watch */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Market Watch</h2>
            <span className="text-[9px] text-muted-foreground">Updates every 800ms</span>
          </div>
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
            {(tickers ?? []).map((t) => <MarketCard key={t.symbol} t={t} />)}
          </div>
        </div>

        {/* Bottom row: Bot + Sentiment */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Bot status */}
          <div className="lg:col-span-2 bg-card border border-card-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Bot Control</h2>
              <span className={`text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest border ${
                botStatus?.isRunning
                  ? "bg-chart-2/15 text-chart-2 border-chart-2/25"
                  : "bg-muted text-muted-foreground border-border"
              }`}>
                {botStatus?.status ?? "idle"}
              </span>
            </div>

            {botStatus?.isRunning ? (
              <div className="grid grid-cols-3 gap-4 text-center py-2">
                <div>
                  <div className="text-2xl font-bold font-mono text-primary">{botStatus.tradesExecuted}</div>
                  <div className="text-[9px] text-muted-foreground uppercase tracking-wider mt-1">Trades Run</div>
                </div>
                <div>
                  <div className={`text-2xl font-bold font-mono ${(botStatus.profitLoss ?? 0) >= 0 ? "text-profit" : "text-loss"}`}>
                    {(botStatus.profitLoss ?? 0) >= 0 ? "+" : ""}${(botStatus.profitLoss ?? 0).toFixed(2)}
                  </div>
                  <div className="text-[9px] text-muted-foreground uppercase tracking-wider mt-1">Session P&L</div>
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">{botStatus.strategy}</div>
                  <div className="text-[9px] text-muted-foreground uppercase tracking-wider mt-1">Strategy</div>
                </div>
              </div>
            ) : (
              <div className="py-4 text-center">
                <p className="text-sm text-muted-foreground">Bot is not running</p>
                <p className="text-xs text-muted-foreground mt-1">Configure and start from the Trading Bot page</p>
              </div>
            )}

            <div className="mt-3 flex gap-2">
              <Link href="/bot" className="flex-1 py-2 text-center bg-secondary hover:bg-primary/10 border border-border hover:border-primary/30 text-sm font-medium text-foreground rounded-lg transition-all text-xs">
                Manage Bot →
              </Link>
              <Link href="/trades" className="flex-1 py-2 text-center bg-secondary hover:bg-primary/10 border border-border hover:border-primary/30 text-sm font-medium text-foreground rounded-lg transition-all text-xs">
                Trade History →
              </Link>
            </div>
          </div>

          {/* Sentiment */}
          <div className="bg-card border border-card-border rounded-xl p-4">
            <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4">Sentiment</h2>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-chart-2 font-semibold">Bullish</span>
                  <span className="text-chart-2 font-bold">{summary?.bullishCount ?? 0}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-chart-2 rounded-full transition-all duration-700" style={{ width: `${((summary?.bullishCount ?? 0) / 4) * 100}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-destructive font-semibold">Bearish</span>
                  <span className="text-destructive font-bold">{summary?.bearishCount ?? 0}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-destructive rounded-full transition-all duration-700" style={{ width: `${((summary?.bearishCount ?? 0) / 4) * 100}%` }} />
                </div>
              </div>
              <div className="pt-2 border-t border-border space-y-1.5">
                <div className="flex justify-between text-[11px]">
                  <span className="text-muted-foreground">24h Volume</span>
                  <span className="text-foreground font-mono">{((summary?.totalVolume ?? 0) / 1000000).toFixed(2)}M</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-muted-foreground">Best trade</span>
                  <span className="text-profit font-mono">+${(stats?.bestTrade ?? 0).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
