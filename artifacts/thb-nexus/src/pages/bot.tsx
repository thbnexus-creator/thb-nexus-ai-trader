import { useState } from "react";
import { useGetBotStatus, useStartBot, useStopBot, getGetBotStatusQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout";

const STRATEGIES = ["Scalping", "Swing", "Grid", "Trend Following"];
const RISK_LEVELS = [
  { label: "Low",    color: "text-chart-2",   bg: "bg-chart-2/15",    border: "border-chart-2/35" },
  { label: "Medium", color: "text-chart-4",   bg: "bg-chart-4/15",    border: "border-chart-4/35" },
  { label: "High",   color: "text-destructive", bg: "bg-destructive/15", border: "border-destructive/35" },
];
const SYMBOLS = ["EURUSD", "GBPUSD", "XAUUSD", "BTCUSD"];

export default function BotPage() {
  const queryClient = useQueryClient();
  const { data: botStatus } = useGetBotStatus({ query: { refetchInterval: 2000, queryKey: getGetBotStatusQueryKey() } });
  const startBot = useStartBot();
  const stopBot = useStopBot();

  const [strategy, setStrategy] = useState("Scalping");
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
      { data: { strategy, riskLevel, symbols: selectedSymbols } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetBotStatusQueryKey() });
          showToast(`Bot started — ${strategy} · ${riskLevel} risk`);
        },
        onError: (err: any) => showToast(err?.response?.data?.error ?? "Failed to start bot", "err"),
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

  return (
    <Layout>
      <div className="p-4 sm:p-5 space-y-4 max-w-2xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-base font-bold text-foreground">Trading Bot</h1>
          <p className="text-[11px] text-muted-foreground mt-0.5">Configure and control your AI trading bot (simulation)</p>
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

        {/* Status card */}
        <div className={`rounded-xl border p-4 transition-all ${
          isRunning ? "bg-chart-2/8 border-chart-2/30" : "bg-card border-card-border"
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
              isRunning ? "bg-chart-2/20 border border-chart-2/30" : "bg-muted border border-border"
            }`}>
              <span className={`text-xl ${isRunning ? "pulse-dot" : "opacity-30"}`}>⚡</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className={`text-sm font-bold ${isRunning ? "text-chart-2" : "text-muted-foreground"}`}>
                {isRunning ? "Bot Active — Simulation Running" : "Bot Inactive"}
              </div>
              {isRunning && (
                <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
                  {botStatus?.strategy} · {botStatus?.riskLevel} risk · {botStatus?.symbols?.join(", ")}
                </div>
              )}
            </div>
            <div className={`flex-shrink-0 text-[9px] font-black px-2.5 py-1.5 rounded-full border uppercase tracking-wider ${
              isRunning
                ? "bg-chart-2/15 text-chart-2 border-chart-2/30"
                : "bg-muted/50 text-muted-foreground border-border"
            }`}>
              {botStatus?.status ?? "idle"}
            </div>
          </div>

          {/* Live stats when running */}
          {isRunning && (
            <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-chart-2/20">
              <div className="text-center">
                <div className="text-2xl font-bold font-mono text-primary">{botStatus?.tradesExecuted ?? 0}</div>
                <div className="text-[9px] text-muted-foreground uppercase tracking-wider mt-0.5">Trades</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold font-mono ${(botStatus?.profitLoss ?? 0) >= 0 ? "text-profit" : "text-loss"}`}>
                  {(botStatus?.profitLoss ?? 0) >= 0 ? "+" : ""}${(botStatus?.profitLoss ?? 0).toFixed(2)}
                </div>
                <div className="text-[9px] text-muted-foreground uppercase tracking-wider mt-0.5">P&L</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-bold text-foreground">{botStatus?.riskLevel}</div>
                <div className="text-[9px] text-muted-foreground uppercase tracking-wider mt-0.5">Risk</div>
              </div>
            </div>
          )}
        </div>

        {/* Config */}
        <div className="bg-card border border-card-border rounded-xl p-4 space-y-5">
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Bot Configuration</div>

          {/* Strategy */}
          <div>
            <div className="text-xs font-semibold text-muted-foreground mb-2.5 uppercase tracking-wider">Strategy</div>
            <div className="grid grid-cols-2 gap-2">
              {STRATEGIES.map((s) => (
                <button
                  key={s}
                  onClick={() => setStrategy(s)}
                  disabled={isRunning}
                  className={`py-3 px-3 rounded-xl text-sm font-semibold border transition-all active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed ${
                    strategy === s
                      ? "bg-primary/15 border-primary/40 text-primary"
                      : "bg-secondary border-border text-muted-foreground hover:text-foreground hover:border-primary/20"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Risk level */}
          <div>
            <div className="text-xs font-semibold text-muted-foreground mb-2.5 uppercase tracking-wider">Risk Level</div>
            <div className="grid grid-cols-3 gap-2">
              {RISK_LEVELS.map((r) => (
                <button
                  key={r.label}
                  onClick={() => setRiskLevel(r.label)}
                  disabled={isRunning}
                  className={`py-3 rounded-xl text-sm font-bold border transition-all active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed ${
                    riskLevel === r.label
                      ? `${r.bg} ${r.border} ${r.color}`
                      : "bg-secondary border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {r.label}
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

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleStart}
            disabled={startBot.isPending || isRunning}
            className="py-4 rounded-xl text-sm font-bold bg-chart-2 text-white hover:bg-chart-2/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.97] glow-green flex items-center justify-center gap-2"
          >
            {startBot.isPending ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : "⚡"}
            {startBot.isPending ? "Starting..." : "Start Bot"}
          </button>
          <button
            onClick={handleStop}
            disabled={stopBot.isPending || !isRunning}
            className="py-4 rounded-xl text-sm font-bold bg-destructive text-white hover:bg-destructive/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.97] flex items-center justify-center gap-2"
          >
            {stopBot.isPending ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : "⏹"}
            {stopBot.isPending ? "Stopping..." : "Stop Bot"}
          </button>
        </div>

        {/* Disclaimer */}
        <div className="bg-muted/20 border border-border rounded-xl px-4 py-3 text-[11px] text-muted-foreground">
          All trading activity is <strong className="text-foreground">simulation only</strong>. No real funds are used or at risk. Architecture is prepared for future VPS Python MT5 integration and real broker connectivity.
        </div>
      </div>
    </Layout>
  );
}
