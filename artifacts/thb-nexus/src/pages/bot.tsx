import { useState } from "react";
import { useGetBotStatus, useStartBot, useStopBot, getGetBotStatusQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout";

const STRATEGIES = ["Scalping", "Swing", "Grid", "Trend Following"];
const RISK_LEVELS = ["Low", "Medium", "High"];
const SYMBOLS = ["EURUSD", "GBPUSD", "XAUUSD", "BTCUSD"];

export default function BotPage() {
  const queryClient = useQueryClient();
  const { data: botStatus, isLoading } = useGetBotStatus({ query: { refetchInterval: 3000, queryKey: getGetBotStatusQueryKey() } });
  const startBot = useStartBot();
  const stopBot = useStopBot();

  const [strategy, setStrategy] = useState("Scalping");
  const [riskLevel, setRiskLevel] = useState("Medium");
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>(["EURUSD", "GBPUSD"]);
  const [message, setMessage] = useState("");

  function toggleSymbol(s: string) {
    setSelectedSymbols((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  }

  function handleStart() {
    setMessage("");
    startBot.mutate(
      { data: { strategy, riskLevel, symbols: selectedSymbols } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetBotStatusQueryKey() });
          setMessage("Bot started successfully — simulation running");
        },
        onError: (err: any) => {
          setMessage(err?.response?.data?.error ?? "Failed to start bot");
        },
      }
    );
  }

  function handleStop() {
    setMessage("");
    stopBot.mutate(undefined, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetBotStatusQueryKey() });
        setMessage("Bot stopped");
      },
    });
  }

  return (
    <Layout>
      <div className="p-6 space-y-6 max-w-3xl">
        <div>
          <h1 className="text-lg font-bold text-foreground">Trading Bot Control</h1>
          <p className="text-sm text-muted-foreground">Configure and manage your automated trading bot (simulation)</p>
        </div>

        {/* Status Banner */}
        <div className={`rounded-lg border p-4 flex items-center gap-4 ${
          botStatus?.isRunning ? "bg-chart-2/10 border-chart-2/30" : "bg-card border-card-border"
        }`}>
          <div className={`w-3 h-3 rounded-full flex-shrink-0 ${botStatus?.isRunning ? "bg-chart-2 pulse-dot glow-green" : "bg-muted"}`} />
          <div className="flex-1">
            <div className={`text-sm font-bold ${botStatus?.isRunning ? "text-chart-2" : "text-muted-foreground"}`}>
              {botStatus?.isRunning ? "Bot Active — Trading in Simulation" : "Bot Inactive"}
            </div>
            {botStatus?.isRunning && (
              <div className="text-xs text-muted-foreground mt-0.5">
                Strategy: {botStatus.strategy} | Risk: {botStatus.riskLevel} | Trades: {botStatus.tradesExecuted}
              </div>
            )}
          </div>
          <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider ${
            botStatus?.isRunning ? "bg-chart-2/20 text-chart-2" : "bg-muted text-muted-foreground"
          }`}>
            {botStatus?.status ?? "idle"}
          </span>
        </div>

        {message && (
          <div className="px-4 py-2.5 bg-primary/10 border border-primary/20 rounded-md text-sm text-primary">
            {message}
          </div>
        )}

        {/* Configuration */}
        <div className="bg-card border border-card-border rounded-xl p-5 space-y-5">
          <h2 className="text-sm font-semibold text-foreground">Bot Configuration</h2>

          {/* Strategy */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Strategy</label>
            <div className="grid grid-cols-2 gap-2">
              {STRATEGIES.map((s) => (
                <button
                  key={s}
                  onClick={() => setStrategy(s)}
                  className={`py-2 px-3 rounded-md text-sm font-medium border transition-all ${
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

          {/* Risk Level */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Risk Level</label>
            <div className="grid grid-cols-3 gap-2">
              {RISK_LEVELS.map((r) => (
                <button
                  key={r}
                  onClick={() => setRiskLevel(r)}
                  className={`py-2 px-3 rounded-md text-sm font-medium border transition-all ${
                    riskLevel === r
                      ? r === "High"
                        ? "bg-destructive/15 border-destructive/40 text-destructive"
                        : r === "Low"
                        ? "bg-chart-2/15 border-chart-2/40 text-chart-2"
                        : "bg-chart-4/15 border-chart-4/40 text-chart-4"
                      : "bg-secondary border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Symbols */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Symbols</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {SYMBOLS.map((s) => (
                <button
                  key={s}
                  onClick={() => toggleSymbol(s)}
                  className={`py-2 px-3 rounded-md text-sm font-medium font-mono border transition-all ${
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

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleStart}
            disabled={startBot.isPending || botStatus?.isRunning}
            className="flex-1 py-3 px-6 bg-chart-2 text-white font-bold text-sm rounded-lg hover:bg-chart-2/90 disabled:opacity-50 transition-all glow-green"
          >
            {startBot.isPending ? "Starting..." : "Start Bot"}
          </button>
          <button
            onClick={handleStop}
            disabled={stopBot.isPending || !botStatus?.isRunning}
            className="flex-1 py-3 px-6 bg-destructive text-white font-bold text-sm rounded-lg hover:bg-destructive/90 disabled:opacity-50 transition-all"
          >
            {stopBot.isPending ? "Stopping..." : "Stop Bot"}
          </button>
        </div>

        {/* Stats when running */}
        {botStatus?.isRunning && (
          <div className="bg-card border border-card-border rounded-lg p-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Live Session Stats</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-xl font-bold font-mono text-primary">{botStatus.tradesExecuted}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">Trades</div>
              </div>
              <div>
                <div className={`text-xl font-bold font-mono ${(botStatus.profitLoss ?? 0) >= 0 ? "text-profit" : "text-loss"}`}>
                  {(botStatus.profitLoss ?? 0) >= 0 ? "+" : ""}${(botStatus.profitLoss ?? 0).toFixed(2)}
                </div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">P&L</div>
              </div>
              <div>
                <div className="text-sm font-medium text-foreground">{botStatus.riskLevel}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">Risk</div>
              </div>
            </div>
          </div>
        )}

        <div className="px-4 py-3 bg-muted/30 border border-border rounded-md text-xs text-muted-foreground">
          All trading activity is simulated. No real funds are used or at risk. Architecture is prepared for future VPS Python MT5 integration.
        </div>
      </div>
    </Layout>
  );
}
