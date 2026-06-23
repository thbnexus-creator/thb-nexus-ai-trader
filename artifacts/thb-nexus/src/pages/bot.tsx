import { useState } from "react";
import {
  useGetBotStatus, useStartBot, useStopBot, getGetBotStatusQueryKey,
  useGetMt5Connection, getGetMt5ConnectionQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Layout } from "@/components/layout";

const STRATEGIES = [
  { id: "Scalping",        desc: "Fast micro-trades, high frequency" },
  { id: "Swing",           desc: "Medium-term momentum trades" },
  { id: "Grid",            desc: "Range-bound grid orders" },
  { id: "Trend Following", desc: "Follow macro EMA trend" },
];

const TIMEFRAMES = [
  { id: "1min", label: "1 Min",  desc: "Ultra-fast · ~20s intervals" },
  { id: "3min", label: "3 Min",  desc: "Fast · ~40s intervals" },
  { id: "5min", label: "5 Min",  desc: "Standard · ~60s intervals" },
];

const RISK_LEVELS = [
  { label: "Low",    desc: "1% risk / trade",  cls: "text-chart-2 bg-chart-2/15 border-chart-2/35" },
  { label: "Medium", desc: "2% risk / trade",  cls: "text-chart-4 bg-chart-4/15 border-chart-4/35" },
  { label: "High",   desc: "3% risk / trade",  cls: "text-destructive bg-destructive/15 border-destructive/35" },
];

const SYMBOLS = ["EURUSD", "GBPUSD", "XAUUSD", "BTCUSD"];

export default function BotPage() {
  const queryClient = useQueryClient();
  const { data: botStatus } = useGetBotStatus({ query: { refetchInterval: 2000, queryKey: getGetBotStatusQueryKey() } });
  const { data: mt5 } = useGetMt5Connection({ query: { refetchInterval: 10000, queryKey: getGetMt5ConnectionQueryKey() } });
  const startBot = useStartBot();
  const stopBot = useStopBot();

  const [strategy, setStrategy] = useState("Scalping");
  const [timeframe, setTimeframe] = useState("5min");
  const [riskLevel, setRiskLevel] = useState("Medium");
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>(["EURUSD", "GBPUSD"]);
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);

  function showToast(msg: string, type: "ok" | "err" = "ok") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  function toggleSymbol(s: string) {
    setSelectedSymbols((prev) => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  }

  function handleStart() {
    if (!selectedSymbols.length) { showToast("Select at least one symbol", "err"); return; }
    startBot.mutate(
      { data: { strategy, riskLevel, symbols: selectedSymbols, timeframe } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetBotStatusQueryKey() });
          showToast(`Bot started — ${strategy} · ${timeframe} · ${riskLevel} risk`);
        },
        onError: (err: any) => showToast(err?.response?.data?.error ?? "Failed to start", "err"),
      }
    );
  }

  function handleStop() {
    stopBot.mutate(undefined, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetBotStatusQueryKey() });
        showToast("Bot stopped");
      },
    });
  }

  const isRunning = botStatus?.isRunning ?? false;
  const mt5Connected = mt5?.isConnected ?? false;
  const mt5BridgeActive = mt5?.bridgeRunning ?? false;

  return (
    <Layout>
      <div className="p-4 sm:p-5 space-y-4 max-w-2xl mx-auto">
        <div>
          <h1 className="text-base font-bold text-foreground">Trading Bot</h1>
          <p className="text-[11px] text-muted-foreground mt-0.5">Strategy engine — EMA9 / EMA100 / RSI4 analysis (simulation only)</p>
        </div>

        {/* MT5 Connection Status Panel */}
        <div className={`rounded-xl border p-4 ${mt5Connected ? "bg-chart-2/6 border-chart-2/25" : "bg-muted/10 border-border"}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg ${mt5Connected ? "bg-chart-2/20 border border-chart-2/30" : "bg-muted border border-border"}`}>
                ⬡
              </div>
              <div>
                <div className="text-sm font-semibold text-foreground">
                  MT5 Bridge — {mt5Connected ? (mt5?.brokerName ?? "Connected") : "Not Connected"}
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  {mt5Connected
                    ? `${mt5?.server} · Bridge ${mt5BridgeActive ? "Active" : "Idle"} · Simulation mode`
                    : "Connect your MT5 account to enable bridge integration"}
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
              <span className={`text-[9px] font-black px-2 py-1 rounded-full border uppercase tracking-wider ${mt5Connected ? "bg-chart-2/15 text-chart-2 border-chart-2/25" : "bg-muted/50 text-muted-foreground border-border"}`}>
                {mt5Connected ? (mt5BridgeActive ? "Bridge Active" : "Connected") : "Offline"}
              </span>
              {!mt5Connected && (
                <Link href="/mt5" className="text-[9px] font-bold text-primary hover:underline">
                  Connect MT5 →
                </Link>
              )}
            </div>
          </div>

          {mt5Connected && (
            <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-chart-2/15 text-[10px] text-center">
              <div>
                <div className="text-muted-foreground mb-0.5">Broker</div>
                <div className="font-semibold text-foreground text-xs">{mt5?.brokerName}</div>
              </div>
              <div>
                <div className="text-muted-foreground mb-0.5">Server</div>
                <div className="font-semibold text-foreground text-xs truncate">{mt5?.server}</div>
              </div>
              <div>
                <div className="text-muted-foreground mb-0.5">Bridge</div>
                <div className={`font-bold text-xs ${mt5BridgeActive ? "text-primary" : "text-muted-foreground"}`}>
                  {mt5BridgeActive ? "⚡ Active" : "Idle"}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Toast */}
        {toast && (
          <div className={`px-4 py-3 rounded-xl border text-sm font-medium flex items-center gap-2 ${toast.type === "ok" ? "bg-chart-2/10 border-chart-2/25 text-chart-2" : "bg-destructive/10 border-destructive/25 text-destructive"}`}>
            <span>{toast.type === "ok" ? "✓" : "✗"}</span>
            {toast.msg}
          </div>
        )}

        {/* Bot status card */}
        <div className={`rounded-xl border p-4 transition-all ${isRunning ? "bg-chart-2/8 border-chart-2/30" : "bg-card border-card-border"}`}>
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl ${isRunning ? "bg-chart-2/20 border border-chart-2/30" : "bg-muted border border-border"}`}>
              {isRunning ? <span className="pulse-dot">⚡</span> : <span className="opacity-30">⚡</span>}
            </div>
            <div className="flex-1 min-w-0">
              <div className={`text-sm font-bold ${isRunning ? "text-chart-2" : "text-muted-foreground"}`}>
                {isRunning ? "Bot Active — Strategy Running" : "Bot Inactive"}
              </div>
              {isRunning && (
                <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
                  {botStatus?.strategy} · {botStatus?.timeframe} · {botStatus?.riskLevel} risk · {botStatus?.symbols?.join(", ")}
                </div>
              )}
            </div>
            <div className={`flex-shrink-0 text-[9px] font-black px-2.5 py-1.5 rounded-full border uppercase tracking-wider ${isRunning ? "bg-chart-2/15 text-chart-2 border-chart-2/30" : "bg-muted/50 text-muted-foreground border-border"}`}>
              {botStatus?.status ?? "idle"}
            </div>
          </div>

          {isRunning && (
            <div className="grid grid-cols-4 gap-3 mt-4 pt-4 border-t border-chart-2/20">
              <div className="text-center">
                <div className="text-xl font-bold font-mono text-primary">{botStatus?.tradesExecuted ?? 0}</div>
                <div className="text-[8px] text-muted-foreground uppercase tracking-wider mt-0.5">Trades</div>
              </div>
              <div className="text-center">
                <div className={`text-xl font-bold font-mono ${(botStatus?.profitLoss ?? 0) >= 0 ? "text-profit" : "text-loss"}`}>
                  {(botStatus?.profitLoss ?? 0) >= 0 ? "+" : ""}${(botStatus?.profitLoss ?? 0).toFixed(2)}
                </div>
                <div className="text-[8px] text-muted-foreground uppercase tracking-wider mt-0.5">P&L</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold font-mono text-chart-4">{botStatus?.winStreak ?? 0}</div>
                <div className="text-[8px] text-muted-foreground uppercase tracking-wider mt-0.5">Streak</div>
              </div>
              <div className="text-center">
                <div className="text-base font-bold text-foreground font-mono">{botStatus?.currentLot?.toFixed(2) ?? "0.01"}</div>
                <div className="text-[8px] text-muted-foreground uppercase tracking-wider mt-0.5">Lots</div>
              </div>
            </div>
          )}
        </div>

        {/* Config */}
        <div className="bg-card border border-card-border rounded-xl p-4 space-y-5">
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Bot Configuration</div>

          {/* Timeframe */}
          <div>
            <div className="text-xs font-semibold text-muted-foreground mb-2.5 uppercase tracking-wider">Timeframe</div>
            <div className="grid grid-cols-3 gap-2">
              {TIMEFRAMES.map((tf) => (
                <button
                  key={tf.id}
                  onClick={() => setTimeframe(tf.id)}
                  disabled={isRunning}
                  className={`py-3 px-2 rounded-xl border transition-all active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed text-center ${
                    timeframe === tf.id
                      ? "bg-primary/15 border-primary/40 text-primary"
                      : "bg-secondary border-border text-muted-foreground hover:text-foreground hover:border-primary/20"
                  }`}
                >
                  <div className="text-sm font-bold">{tf.label}</div>
                  <div className="text-[9px] mt-0.5 opacity-70">{tf.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Strategy */}
          <div>
            <div className="text-xs font-semibold text-muted-foreground mb-2.5 uppercase tracking-wider">Strategy</div>
            <div className="grid grid-cols-2 gap-2">
              {STRATEGIES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setStrategy(s.id)}
                  disabled={isRunning}
                  className={`py-3 px-3 rounded-xl text-left border transition-all active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed ${
                    strategy === s.id
                      ? "bg-primary/15 border-primary/40 text-primary"
                      : "bg-secondary border-border text-muted-foreground hover:text-foreground hover:border-primary/20"
                  }`}
                >
                  <div className="text-sm font-bold">{s.id}</div>
                  <div className="text-[9px] mt-0.5 opacity-70">{s.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Risk */}
          <div>
            <div className="text-xs font-semibold text-muted-foreground mb-2.5 uppercase tracking-wider">Risk Level</div>
            <div className="grid grid-cols-3 gap-2">
              {RISK_LEVELS.map((r) => (
                <button
                  key={r.label}
                  onClick={() => setRiskLevel(r.label)}
                  disabled={isRunning}
                  className={`py-3 px-2 rounded-xl border transition-all active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed text-center ${
                    riskLevel === r.label
                      ? `${r.cls} font-bold`
                      : "bg-secondary border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <div className="text-sm font-bold">{r.label}</div>
                  <div className="text-[9px] mt-0.5 opacity-70">{r.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Symbols */}
          <div>
            <div className="text-xs font-semibold text-muted-foreground mb-2.5 uppercase tracking-wider">Symbols</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {SYMBOLS.map((s) => (
                <button
                  key={s}
                  onClick={() => toggleSymbol(s)}
                  disabled={isRunning}
                  className={`py-3 rounded-xl text-sm font-bold font-mono border transition-all active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed ${
                    selectedSymbols.includes(s)
                      ? "bg-primary/15 border-primary/40 text-primary"
                      : "bg-secondary border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Strategy engine info */}
        <div className="bg-card border border-card-border rounded-xl p-4">
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Signal Logic — EMA9 · EMA100 · RSI4</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
            <div className="p-3 bg-chart-2/8 border border-chart-2/20 rounded-xl">
              <div className="font-bold text-chart-2 mb-1.5">BUY Conditions</div>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Price above EMA100</li>
                <li>• EMA9 trending upward</li>
                <li>• RSI4 below 35 with hook up</li>
                <li>• TP: +3–6 pips · SL: −3–6 pips</li>
              </ul>
            </div>
            <div className="p-3 bg-destructive/8 border border-destructive/20 rounded-xl">
              <div className="font-bold text-destructive mb-1.5">SELL Conditions</div>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Price below EMA100</li>
                <li>• EMA9 trending downward</li>
                <li>• RSI4 above 65 with hook down</li>
                <li>• TP: +3–6 pips · SL: −3–6 pips</li>
              </ul>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-[10px] text-muted-foreground">
            <div className="p-2 bg-secondary border border-border rounded-lg text-center">
              <div className="font-bold text-foreground mb-0.5">Timeout</div>180s max
            </div>
            <div className="p-2 bg-secondary border border-border rounded-lg text-center">
              <div className="font-bold text-foreground mb-0.5">Lot Sizing</div>Dynamic %
            </div>
            <div className="p-2 bg-secondary border border-border rounded-lg text-center">
              <div className="font-bold text-foreground mb-0.5">Win Boost</div>+10% / win
            </div>
          </div>
        </div>

        {/* Start/Stop */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleStart}
            disabled={startBot.isPending || isRunning}
            className="py-4 rounded-xl text-sm font-bold bg-chart-2 text-white hover:bg-chart-2/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.97] flex items-center justify-center gap-2"
          >
            {startBot.isPending ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "⚡"}
            {startBot.isPending ? "Starting..." : "Start Bot"}
          </button>
          <button
            onClick={handleStop}
            disabled={stopBot.isPending || !isRunning}
            className="py-4 rounded-xl text-sm font-bold bg-destructive text-white hover:bg-destructive/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.97] flex items-center justify-center gap-2"
          >
            {stopBot.isPending ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "⏹"}
            {stopBot.isPending ? "Stopping..." : "Stop Bot"}
          </button>
        </div>

        <div className="bg-muted/20 border border-border rounded-xl px-4 py-3 text-[11px] text-muted-foreground">
          <strong className="text-foreground">Simulation only.</strong> No real funds are at risk. All trades are analysis-based demos. Architecture is ready for future VPS Python MT5 real broker integration.
        </div>
      </div>
    </Layout>
  );
}
