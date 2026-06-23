import { useGetMarketTickers, getGetMarketTickersQueryKey, useGetMarketSummary, getGetMarketSummaryQueryKey, useGetBotStatus, getGetBotStatusQueryKey, useGetBalance, getGetBalanceQueryKey, useGetTradeStats, getGetTradeStatsQueryKey, useGetSignalHistory, getGetSignalHistoryQueryKey, Ticker } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Link } from "wouter";

function SignalBadge({ signal }: { signal: string }) {
  const cls = signal === "BUY"
    ? "bg-chart-2/15 text-chart-2 border-chart-2/30"
    : signal === "SELL"
    ? "bg-destructive/15 text-destructive border-destructive/30"
    : "bg-chart-4/15 text-chart-4 border-chart-4/30";
  const dotColor = signal === "BUY" ? "bg-chart-2" : signal === "SELL" ? "bg-destructive" : "bg-chart-4";
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full border uppercase tracking-wider ${cls}`}>
      <span className={`w-1.5 h-1.5 ${dotColor} rounded-full`} />
      {signal}
    </span>
  );
}

function Sparkline({ prices, isUp }: { prices: number[]; isUp: boolean }) {
  if (prices.length < 2) return null;
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  const w = 80;
  const h = 28;
  const pts = prices.map((p, i) => {
    const x = (i / (prices.length - 1)) * w;
    const y = h - ((p - min) / range) * h;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  const color = isUp ? "#22d3a5" : "#f43f5e";
  return (
    <svg width={w} height={h} className="flex-shrink-0">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" opacity="0.8" />
    </svg>
  );
}

function RsiBar({ rsi }: { rsi: number }) {
  const color = rsi > 70 ? "bg-destructive" : rsi < 30 ? "bg-chart-2" : "bg-chart-4";
  const zone = rsi > 70 ? "text-destructive" : rsi < 30 ? "text-chart-2" : "text-chart-4";
  const label = rsi > 70 ? "OB" : rsi < 30 ? "OS" : "Neut";
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-[9px] text-muted-foreground">RSI4</span>
        <span className={`text-[9px] font-bold ${zone}`}>{rsi.toFixed(0)} · {label}</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden relative">
        <div className="absolute top-0 left-[30%] w-px h-full bg-chart-2/40" />
        <div className="absolute top-0 left-[70%] w-px h-full bg-destructive/40" />
        <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${Math.min(rsi, 100)}%` }} />
      </div>
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
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-sm font-bold text-foreground">{t.symbol}</div>
          <div className={`text-[11px] font-semibold mt-0.5 ${isUp ? "text-profit" : "text-loss"}`}>
            {isUp ? "▲ +" : "▼ "}{t.changePercent.toFixed(3)}%
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <div className={`w-2 h-2 rounded-full pulse-dot ${isUp ? "bg-chart-2" : "bg-destructive"}`} />
          <SignalBadge signal={t.signal} />
        </div>
      </div>

      <div className="flex items-end justify-between mb-3">
        <div className={`text-2xl font-bold font-mono ${isUp ? "text-profit" : "text-loss"}`}>
          {t.price.toFixed(dp)}
        </div>
        <Sparkline prices={t.priceHistory} isUp={isUp} />
      </div>

      <div className="mb-3">
        <RsiBar rsi={t.rsi} />
      </div>

      <div className="mb-2">
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${isUp ? "bg-chart-2" : "bg-destructive"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex justify-between text-[9px] text-muted-foreground font-mono mt-1">
          <span>L {t.low24h.toFixed(dp)}</span>
          <span>H {t.high24h.toFixed(dp)}</span>
        </div>
      </div>

      <div className="pt-2 border-t border-border grid grid-cols-2 gap-1 text-[9px]">
        <div className="text-muted-foreground">EMA9 <span className="text-foreground font-mono">{t.ema9.toFixed(dp)}</span></div>
        <div className="text-muted-foreground text-right">EMA100 <span className="text-foreground font-mono">{t.ema100.toFixed(dp)}</span></div>
        <div className="col-span-2 text-muted-foreground">Vol <span className="text-foreground font-mono">{t.volume > 1e6 ? `${(t.volume/1e6).toFixed(2)}M` : `${(t.volume/1000).toFixed(0)}K`}</span></div>
      </div>
    </div>
  );
}

function SignalAnalysisPanel({ tickers }: { tickers: Ticker[] }) {
  return (
    <div className="bg-card border border-card-border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <span className="w-1.5 h-1.5 rounded-full bg-primary pulse-dot" />
        <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex-1">AI Signal Analysis — EMA9 · EMA100 · RSI4</h2>
        <span className="text-[9px] text-muted-foreground">Live</span>
      </div>
      <div className="space-y-3">
        {tickers.map((t) => {
          const dp = t.symbol === "BTCUSD" || t.symbol === "XAUUSD" ? 2 : 5;
          const isUp = t.direction === "up";
          const conf = t.signalStrength === "strong" ? 85 : t.signalStrength === "moderate" ? 60 : 35;
          const barColor = t.signal === "BUY" ? "bg-chart-2" : t.signal === "SELL" ? "bg-destructive" : "bg-chart-4";
          const ema9AboveEma100 = t.ema9 > t.ema100;

          return (
            <div key={t.symbol} className="p-3 bg-secondary/40 rounded-xl border border-border">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-14 flex-shrink-0">
                  <div className="text-[11px] font-bold text-foreground font-mono">{t.symbol}</div>
                  <div className={`text-[9px] ${isUp ? "text-profit" : "text-loss"}`}>{t.price.toFixed(dp)}</div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] text-muted-foreground">Confidence</span>
                    <span className="text-[9px] font-bold text-muted-foreground">{conf}%</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-700 ${barColor}`} style={{ width: `${conf}%` }} />
                  </div>
                </div>
                <SignalBadge signal={t.signal} />
              </div>
              <div className="grid grid-cols-3 gap-2 text-[9px] text-muted-foreground">
                <span>RSI4: <span className={t.rsi < 30 ? "text-chart-2 font-bold" : t.rsi > 70 ? "text-destructive font-bold" : "text-foreground"}>{t.rsi.toFixed(1)}</span></span>
                <span>EMA9: <span className={ema9AboveEma100 ? "text-chart-2" : "text-destructive"}>{ema9AboveEma100 ? "▲ Above" : "▼ Below"} EMA100</span></span>
                <span>Bias: <span className={t.signal === "BUY" ? "text-chart-2" : t.signal === "SELL" ? "text-destructive" : "text-chart-4"}>{t.signal}</span></span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SignalHistoryPanel() {
  const { data: history = [] } = useGetSignalHistory({ query: { refetchInterval: 15000, queryKey: getGetSignalHistoryQueryKey() } });

  const grouped = ["EURUSD", "GBPUSD", "XAUUSD", "BTCUSD"].map(sym => ({
    symbol: sym,
    records: history.filter(h => h.symbol === sym).slice(0, 8),
  }));

  return (
    <div className="bg-card border border-card-border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex-1">Signal History — Last 8 per Symbol</h2>
        <span className="text-[9px] text-muted-foreground">~12s intervals</span>
      </div>

      {history.length === 0 ? (
        <div className="py-6 text-center text-sm text-muted-foreground">
          <div className="text-2xl mb-2 opacity-20">◈</div>
          Signal history builds after ~12 seconds of market activity
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {grouped.map(({ symbol, records }) => (
            <div key={symbol} className="bg-secondary/30 rounded-xl border border-border overflow-hidden">
              <div className="px-3 py-2 border-b border-border bg-muted/20">
                <span className="text-[10px] font-bold text-foreground font-mono">{symbol}</span>
              </div>
              {records.length === 0 ? (
                <div className="px-3 py-4 text-[10px] text-muted-foreground">No signals yet</div>
              ) : (
                <div className="divide-y divide-border">
                  {records.map((r, i) => {
                    const dp = r.symbol === "BTCUSD" || r.symbol === "XAUUSD" ? 2 : 5;
                    const signalColor = r.signal === "BUY" ? "text-chart-2" : r.signal === "SELL" ? "text-destructive" : "text-chart-4";
                    const time = new Date(r.timestamp);
                    return (
                      <div key={i} className="px-3 py-2 flex items-center justify-between">
                        <div>
                          <span className={`text-[9px] font-black ${signalColor}`}>{r.signal}</span>
                          <span className="text-[9px] text-muted-foreground ml-1.5">{r.price.toFixed(dp)}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-[9px] text-muted-foreground">{time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</div>
                          <div className="text-[8px] text-muted-foreground/60">RSI {r.rsi.toFixed(0)}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { data: tickers = [] } = useGetMarketTickers({ query: { refetchInterval: 900, queryKey: getGetMarketTickersQueryKey() } });
  const { data: summary } = useGetMarketSummary({ query: { refetchInterval: 3000, queryKey: getGetMarketSummaryQueryKey() } });
  const { data: botStatus } = useGetBotStatus({ query: { refetchInterval: 3000, queryKey: getGetBotStatusQueryKey() } });
  const { data: balance } = useGetBalance({ query: { refetchInterval: 5000, queryKey: getGetBalanceQueryKey() } });
  const { data: stats } = useGetTradeStats({ query: { refetchInterval: 10000, queryKey: getGetTradeStatsQueryKey() } });

  const pnlUp = (stats?.totalPnl ?? 0) >= 0;

  return (
    <Layout>
      {/* Live ticker banner */}
      <div className="border-b border-border bg-card/50 overflow-x-auto px-4 py-2 flex-shrink-0">
        <div className="flex items-center gap-4 min-w-max">
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="w-1.5 h-1.5 bg-chart-2 rounded-full pulse-dot" />
            <span className="text-[9px] font-black text-chart-2 uppercase tracking-widest">Live</span>
          </div>
          {tickers.map((t) => {
            const dp = t.symbol === "BTCUSD" || t.symbol === "XAUUSD" ? 2 : 5;
            const isUp = t.direction === "up";
            return (
              <div key={t.symbol} className="flex items-center gap-2 flex-shrink-0">
                <span className="text-[10px] font-bold text-muted-foreground">{t.symbol}</span>
                <span className="text-[12px] font-bold font-mono text-foreground">{t.price.toFixed(dp)}</span>
                <span className={`text-[10px] font-bold ${isUp ? "text-profit" : "text-loss"}`}>{isUp ? "▲" : "▼"}{Math.abs(t.changePercent).toFixed(3)}%</span>
                <SignalBadge signal={t.signal} />
                <span className={`text-[9px] font-mono ${t.rsi < 30 ? "text-chart-2" : t.rsi > 70 ? "text-destructive" : "text-muted-foreground"}`}>
                  RSI {t.rsi.toFixed(0)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-foreground">Overview</h1>
            <p className="text-[11px] text-muted-foreground">EMA9 · EMA100 · RSI4 strategy engine</p>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-chart-2 pulse-dot" />
            Simulating
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-card border border-primary/20 rounded-xl p-4">
            <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-2">USDT Balance</div>
            <div className="text-2xl font-bold font-mono text-primary ticker-glow">${(balance?.usdt ?? 0).toFixed(2)}</div>
            <div className="text-[11px] text-muted-foreground mt-1">Available funds</div>
          </div>
          <div className={`bg-card border rounded-xl p-4 ${pnlUp ? "border-chart-2/20" : "border-destructive/20"}`}>
            <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Total P&L</div>
            <div className={`text-2xl font-bold font-mono ${pnlUp ? "text-profit" : "text-loss"}`}>
              {pnlUp ? "+" : ""}${(stats?.totalPnl ?? 0).toFixed(2)}
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">{stats?.totalTrades ?? 0} trades</div>
          </div>
          <div className="bg-card border border-card-border rounded-xl p-4">
            <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Win Rate</div>
            <div className={`text-2xl font-bold font-mono ${(stats?.winRate ?? 0) >= 50 ? "text-profit" : "text-loss"}`}>{stats?.winRate ?? 0}%</div>
            <div className="text-[11px] text-muted-foreground mt-1">{stats?.winningTrades ?? 0}W · {stats?.losingTrades ?? 0}L</div>
          </div>
          <div className={`bg-card border rounded-xl p-4 ${botStatus?.isRunning ? "border-chart-2/20" : "border-card-border"}`}>
            <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Bot Status</div>
            <div className={`text-2xl font-bold ${botStatus?.isRunning ? "text-chart-2" : "text-muted-foreground"}`}>
              {botStatus?.isRunning ? "ACTIVE" : "IDLE"}
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">
              {botStatus?.isRunning ? `${botStatus.timeframe} · ${botStatus.strategy}` : "Not running"}
            </div>
          </div>
        </div>

        {/* Market cards */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Market Watch</h2>
            <span className="text-[9px] text-muted-foreground">~900ms · sparklines</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            {tickers.map((t) => <MarketCard key={t.symbol} t={t} />)}
          </div>
        </div>

        {/* Live signal analysis */}
        <SignalAnalysisPanel tickers={tickers} />

        {/* Signal history */}
        <SignalHistoryPanel />

        {/* Bot + Sentiment */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-card border border-card-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Trading Bot</h2>
              <div className={`flex items-center gap-1.5 text-[9px] font-black px-2.5 py-1 rounded-full border uppercase tracking-wider ${botStatus?.isRunning ? "bg-chart-2/15 text-chart-2 border-chart-2/25" : "bg-muted/50 text-muted-foreground border-border"}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${botStatus?.isRunning ? "bg-chart-2 pulse-dot" : "bg-muted-foreground"}`} />
                {botStatus?.status ?? "idle"}
              </div>
            </div>
            {botStatus?.isRunning ? (
              <div className="grid grid-cols-4 gap-3 text-center py-2">
                <div>
                  <div className="text-xl font-bold font-mono text-primary">{botStatus.tradesExecuted}</div>
                  <div className="text-[9px] text-muted-foreground uppercase mt-0.5">Trades</div>
                </div>
                <div>
                  <div className={`text-xl font-bold font-mono ${(botStatus.profitLoss ?? 0) >= 0 ? "text-profit" : "text-loss"}`}>
                    {(botStatus.profitLoss ?? 0) >= 0 ? "+" : ""}${(botStatus.profitLoss ?? 0).toFixed(2)}
                  </div>
                  <div className="text-[9px] text-muted-foreground uppercase mt-0.5">P&L</div>
                </div>
                <div>
                  <div className="text-xl font-bold font-mono text-chart-4">{botStatus.winStreak ?? 0}</div>
                  <div className="text-[9px] text-muted-foreground uppercase mt-0.5">Streak</div>
                </div>
                <div>
                  <div className="text-base font-bold text-foreground">{botStatus.timeframe}</div>
                  <div className="text-[9px] text-muted-foreground uppercase mt-0.5">Timeframe</div>
                </div>
              </div>
            ) : (
              <div className="py-5 text-center">
                <div className="text-2xl mb-2 opacity-30">⚡</div>
                <p className="text-sm text-muted-foreground">Bot is not running</p>
                <p className="text-[11px] text-muted-foreground mt-1">Start from the Trading Bot page</p>
              </div>
            )}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Link href="/bot" className="flex items-center justify-center py-3 bg-secondary hover:bg-primary/10 border border-border hover:border-primary/30 text-xs font-semibold text-foreground rounded-xl transition-all active:scale-[0.97]">
                ⚡ Manage Bot
              </Link>
              <Link href="/trades" className="flex items-center justify-center py-3 bg-secondary hover:bg-primary/10 border border-border hover:border-primary/30 text-xs font-semibold text-foreground rounded-xl transition-all active:scale-[0.97]">
                ▤ Trade History
              </Link>
            </div>
          </div>

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
              <div className="pt-2.5 border-t border-border space-y-1.5 text-[11px]">
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
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Avg profit</span>
                  <span className={`font-mono ${(stats?.avgProfit ?? 0) >= 0 ? "text-profit" : "text-loss"}`}>
                    {(stats?.avgProfit ?? 0) >= 0 ? "+" : ""}${(stats?.avgProfit ?? 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
