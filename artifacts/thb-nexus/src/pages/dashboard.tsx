import { useGetMarketTickers, getGetMarketTickersQueryKey, useGetMarketSummary, getGetMarketSummaryQueryKey, useGetBotStatus, getGetBotStatusQueryKey, useGetBalance, getGetBalanceQueryKey, useGetTradeStats, getGetTradeStatsQueryKey, Ticker } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Link } from "wouter";

function SignalBadge({ signal, strength }: { signal: string; strength: string }) {
  const cls = signal === "BUY"
    ? "bg-chart-2/15 text-chart-2 border-chart-2/30"
    : signal === "SELL"
    ? "bg-destructive/15 text-destructive border-destructive/30"
    : "bg-chart-4/15 text-chart-4 border-chart-4/30";
  const dot = strength === "strong" ? "w-2 h-2" : strength === "moderate" ? "w-1.5 h-1.5" : "w-1 h-1";
  const dotCls = signal === "BUY" ? "bg-chart-2" : signal === "SELL" ? "bg-destructive" : "bg-chart-4";

  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full border uppercase tracking-wider ${cls}`}>
      <span className={`${dot} ${dotCls} rounded-full`} />
      {signal}
    </span>
  );
}

function StatCard({ label, value, sub, color = "default" }: { label: string; value: string; sub?: string; color?: "primary" | "green" | "red" | "yellow" | "default" }) {
  const valClass = color === "primary" ? "text-primary ticker-glow" : color === "green" ? "text-profit" : color === "red" ? "text-loss" : color === "yellow" ? "text-chart-4" : "text-foreground";
  const borderClass = color === "primary" ? "border-primary/20 bg-primary/3" : color === "green" ? "border-profit/20" : color === "red" ? "border-loss/20" : "border-card-border";
  return (
    <div className={`bg-card border rounded-xl p-4 ${borderClass}`}>
      <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-2">{label}</div>
      <div className={`text-xl sm:text-2xl font-bold font-mono leading-none ${valClass}`}>{value}</div>
      {sub && <div className="text-[11px] text-muted-foreground mt-1.5 leading-none">{sub}</div>}
    </div>
  );
}

function MarketCard({ t }: { t: Ticker }) {
  const dp = t.symbol === "BTCUSD" || t.symbol === "XAUUSD" ? 2 : 5;
  const isUp = t.direction === "up";
  const range = t.high24h - t.low24h;
  const pct = range > 0 ? Math.max(2, Math.min(98, ((t.price - t.low24h) / range) * 100)) : 50;

  return (
    <div className={`bg-card border rounded-xl p-4 transition-colors ${isUp ? "border-chart-2/20" : "border-destructive/20"}`}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="text-sm font-bold text-foreground">{t.symbol}</div>
          <div className={`text-[11px] font-semibold mt-0.5 ${isUp ? "text-profit" : "text-loss"}`}>
            {isUp ? "▲" : "▼"} {isUp ? "+" : ""}{t.changePercent.toFixed(3)}%
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className={`w-2 h-2 rounded-full ${isUp ? "bg-chart-2 glow-green" : "bg-destructive glow-red"} pulse-dot`} />
          <SignalBadge signal={t.signal} strength={t.signalStrength} />
        </div>
      </div>

      <div className={`text-xl sm:text-2xl font-bold font-mono mb-3 ${isUp ? "text-profit" : "text-loss"}`}>
        {t.price.toFixed(dp)}
      </div>

      <div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-1.5">
          <div
            className={`h-full rounded-full transition-all duration-500 ${isUp ? "bg-chart-2" : "bg-destructive"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex justify-between text-[9px] text-muted-foreground font-mono">
          <span>L {t.low24h.toFixed(dp)}</span>
          <span>H {t.high24h.toFixed(dp)}</span>
        </div>
      </div>

      <div className="mt-2.5 pt-2.5 border-t border-border flex justify-between text-[10px] text-muted-foreground">
        <span>EMA5 <span className="text-foreground font-mono">{t.ema5.toFixed(dp)}</span></span>
        <span>Vol {t.volume > 1e6 ? `${(t.volume/1e6).toFixed(2)}M` : `${(t.volume/1000).toFixed(0)}K`}</span>
      </div>
    </div>
  );
}

function SignalsPanel({ tickers }: { tickers: Ticker[] }) {
  return (
    <div className="bg-card border border-card-border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <span className="w-1.5 h-1.5 rounded-full bg-primary pulse-dot" />
        <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">AI Signal Analysis</h2>
        <span className="ml-auto text-[9px] text-muted-foreground">Demo only · Not financial advice</span>
      </div>
      <div className="space-y-3">
        {tickers.map((t) => {
          const dp = t.symbol === "BTCUSD" || t.symbol === "XAUUSD" ? 2 : 5;
          const isUp = t.direction === "up";
          const strengthLabel = t.signalStrength === "strong" ? "Strong" : t.signalStrength === "moderate" ? "Moderate" : "Weak";
          const conf = t.signalStrength === "strong" ? 78 : t.signalStrength === "moderate" ? 55 : 35;
          const barColor = t.signal === "BUY" ? "bg-chart-2" : t.signal === "SELL" ? "bg-destructive" : "bg-chart-4";

          return (
            <div key={t.symbol} className="flex items-center gap-3">
              <div className="w-16 flex-shrink-0">
                <div className="text-[10px] font-bold text-foreground font-mono">{t.symbol}</div>
                <div className={`text-[9px] ${isUp ? "text-profit" : "text-loss"}`}>{t.price.toFixed(dp)}</div>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] text-muted-foreground">{strengthLabel} signal</span>
                  <span className="text-[9px] font-bold text-muted-foreground">{conf}%</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-700 ${barColor}`} style={{ width: `${conf}%` }} />
                </div>
              </div>
              <SignalBadge signal={t.signal} strength={t.signalStrength} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data: tickers = [] } = useGetMarketTickers({ query: { refetchInterval: 1000, queryKey: getGetMarketTickersQueryKey() } });
  const { data: summary } = useGetMarketSummary({ query: { refetchInterval: 3000, queryKey: getGetMarketSummaryQueryKey() } });
  const { data: botStatus } = useGetBotStatus({ query: { refetchInterval: 3000, queryKey: getGetBotStatusQueryKey() } });
  const { data: balance } = useGetBalance({ query: { refetchInterval: 5000, queryKey: getGetBalanceQueryKey() } });
  const { data: stats } = useGetTradeStats({ query: { refetchInterval: 10000, queryKey: getGetTradeStatsQueryKey() } });

  const pnlUp = (stats?.totalPnl ?? 0) >= 0;

  return (
    <Layout>
      {/* Scrolling ticker banner */}
      <div className="border-b border-border bg-card/50 overflow-x-auto px-4 py-2">
        <div className="flex items-center gap-5 min-w-max">
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="w-1.5 h-1.5 bg-chart-2 rounded-full pulse-dot" />
            <span className="text-[9px] font-black text-chart-2 uppercase tracking-widest">Live</span>
          </div>
          {tickers.map((t) => {
            const dp = t.symbol === "BTCUSD" || t.symbol === "XAUUSD" ? 2 : 5;
            const isUp = t.direction === "up";
            return (
              <div key={t.symbol} className="flex items-center gap-1.5 flex-shrink-0">
                <span className="text-[11px] font-bold text-muted-foreground">{t.symbol}</span>
                <span className="text-[13px] font-bold font-mono text-foreground">{t.price.toFixed(dp)}</span>
                <span className={`text-[11px] font-bold ${isUp ? "text-profit" : "text-loss"}`}>{isUp ? "▲" : "▼"}{Math.abs(t.changePercent).toFixed(3)}%</span>
                <SignalBadge signal={t.signal} strength={t.signalStrength} />
              </div>
            );
          })}
        </div>
      </div>

      <div className="p-4 sm:p-5 space-y-4">
        {/* Page title */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-foreground">Overview</h1>
            <p className="text-[11px] text-muted-foreground mt-0.5">Simulation dashboard</p>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-chart-2 pulse-dot" />
            Simulating
          </div>
        </div>

        {/* Stats — 2×2 on mobile, 4×1 on lg */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            label="USDT Balance"
            value={`$${(balance?.usdt ?? 0).toFixed(2)}`}
            sub="Available funds"
            color="primary"
          />
          <StatCard
            label="Total P&L"
            value={`${pnlUp ? "+" : ""}$${(stats?.totalPnl ?? 0).toFixed(2)}`}
            sub={`${stats?.totalTrades ?? 0} trades`}
            color={pnlUp ? "green" : "red"}
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
            sub={botStatus?.isRunning ? `${botStatus.strategy}` : "Not running"}
            color={botStatus?.isRunning ? "green" : "default"}
          />
        </div>

        {/* Market cards — 1 col mobile, 2 col sm, 4 col xl */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Market Watch</h2>
            <span className="text-[9px] text-muted-foreground">~800ms updates</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            {tickers.map((t) => <MarketCard key={t.symbol} t={t} />)}
          </div>
        </div>

        {/* Signal analysis */}
        <SignalsPanel tickers={tickers} />

        {/* Bot + Sentiment */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Bot */}
          <div className="lg:col-span-2 bg-card border border-card-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Trading Bot</h2>
              <div className={`flex items-center gap-1.5 text-[9px] font-black px-2.5 py-1 rounded-full border uppercase tracking-wider ${
                botStatus?.isRunning
                  ? "bg-chart-2/15 text-chart-2 border-chart-2/25"
                  : "bg-muted/50 text-muted-foreground border-border"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${botStatus?.isRunning ? "bg-chart-2 pulse-dot" : "bg-muted-foreground"}`} />
                {botStatus?.status ?? "idle"}
              </div>
            </div>

            {botStatus?.isRunning ? (
              <div className="grid grid-cols-3 gap-3 text-center py-2">
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
                  <div className="text-base font-semibold text-foreground">{botStatus.strategy}</div>
                  <div className="text-[9px] text-muted-foreground uppercase tracking-wider mt-1">Strategy</div>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center">
                <div className="text-2xl mb-2 opacity-30">⚡</div>
                <p className="text-sm text-muted-foreground">Bot is not running</p>
                <p className="text-[11px] text-muted-foreground mt-1">Configure and start from the Trading Bot page</p>
              </div>
            )}

            <div className="mt-4 grid grid-cols-2 gap-2">
              <Link href="/bot" className="flex items-center justify-center py-3 bg-secondary hover:bg-primary/10 border border-border hover:border-primary/30 text-[12px] font-semibold text-foreground rounded-xl transition-all active:scale-[0.97]">
                ⚡ Manage Bot
              </Link>
              <Link href="/trades" className="flex items-center justify-center py-3 bg-secondary hover:bg-primary/10 border border-border hover:border-primary/30 text-[12px] font-semibold text-foreground rounded-xl transition-all active:scale-[0.97]">
                ▤ Trade History
              </Link>
            </div>
          </div>

          {/* Sentiment */}
          <div className="bg-card border border-card-border rounded-xl p-4">
            <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4">Market Sentiment</h2>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-chart-2 font-semibold">Bullish / BUY</span>
                  <span className="text-chart-2 font-bold">{summary?.bullishCount ?? 0}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-chart-2 rounded-full transition-all duration-700" style={{ width: `${((summary?.bullishCount ?? 0) / 4) * 100}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-destructive font-semibold">Bearish / SELL</span>
                  <span className="text-destructive font-bold">{summary?.bearishCount ?? 0}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-destructive rounded-full transition-all duration-700" style={{ width: `${((summary?.bearishCount ?? 0) / 4) * 100}%` }} />
                </div>
              </div>
              <div className="pt-2 border-t border-border space-y-2 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">24h Volume</span>
                  <span className="font-mono text-foreground">{((summary?.totalVolume ?? 0) / 1e6).toFixed(2)}M</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Best trade</span>
                  <span className="font-mono text-profit">+${(stats?.bestTrade ?? 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Worst trade</span>
                  <span className="font-mono text-loss">${(stats?.worstTrade ?? 0).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
