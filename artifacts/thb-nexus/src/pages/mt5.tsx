import { useState } from "react";
import { useGetMt5Connection, useSaveMt5Connection, useStartMt5Bridge, getGetMt5ConnectionQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout";

export default function Mt5Page() {
  const queryClient = useQueryClient();
  const { data: conn } = useGetMt5Connection({ query: { refetchInterval: 5000, queryKey: getGetMt5ConnectionQueryKey() } });
  const saveMt5 = useSaveMt5Connection();
  const startBridge = useStartMt5Bridge();

  const [brokerName, setBrokerName] = useState("");
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [server, setServer] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"info" | "error">("info");

  function handleConnect(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    saveMt5.mutate(
      { data: { brokerName, loginId, password, server } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetMt5ConnectionQueryKey() });
          setMessageType("info");
          setMessage("MT5 credentials saved and connected (simulation mode)");
          setPassword("");
        },
        onError: (err: any) => {
          setMessageType("error");
          setMessage(err?.response?.data?.error ?? "Failed to connect");
        },
      }
    );
  }

  function handleStartBridge() {
    setMessage("");
    startBridge.mutate(undefined, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMt5ConnectionQueryKey() });
        setMessageType("info");
        setMessage("Trading bridge activated — simulation mode. Ready for future VPS integration.");
      },
      onError: (err: any) => {
        setMessageType("error");
        setMessage(err?.response?.data?.error ?? "Failed to start bridge");
      },
    });
  }

  return (
    <Layout>
      <div className="p-6 space-y-6 max-w-2xl">
        <div>
          <h1 className="text-lg font-bold text-foreground">MT5 Bridge</h1>
          <p className="text-sm text-muted-foreground">Connect your MetaTrader 5 broker account</p>
        </div>

        {/* Connection Status */}
        <div className={`rounded-lg border p-4 flex items-center gap-4 ${
          conn?.isConnected ? "bg-chart-2/10 border-chart-2/30" : "bg-card border-card-border"
        }`}>
          <div className={`w-3 h-3 rounded-full flex-shrink-0 ${conn?.isConnected ? "bg-chart-2 pulse-dot glow-green" : "bg-muted"}`} />
          <div className="flex-1">
            <div className={`text-sm font-bold ${conn?.isConnected ? "text-chart-2" : "text-muted-foreground"}`}>
              {conn?.isConnected ? `Connected to ${conn.brokerName}` : "Not Connected"}
            </div>
            {conn?.isConnected && (
              <div className="text-xs text-muted-foreground mt-0.5">
                Login: {conn.loginId} | Server: {conn.server}
              </div>
            )}
          </div>
          <div className="text-right">
            <div className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider ${
              conn?.bridgeRunning ? "bg-primary/20 text-primary border border-primary/30" :
              conn?.isConnected ? "bg-chart-2/20 text-chart-2 border border-chart-2/30" :
              "bg-muted text-muted-foreground border border-border"
            }`}>
              {conn?.status ?? "disconnected"}
            </div>
          </div>
        </div>

        {message && (
          <div className={`px-4 py-2.5 rounded-md text-sm border ${
            messageType === "error"
              ? "bg-destructive/10 border-destructive/30 text-destructive"
              : "bg-primary/10 border-primary/20 text-primary"
          }`}>
            {message}
          </div>
        )}

        {/* Credentials Form */}
        <div className="bg-card border border-card-border rounded-xl p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Broker Credentials</h2>
          <form onSubmit={handleConnect} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">
                  Broker Name
                </label>
                <input
                  type="text"
                  value={brokerName}
                  onChange={(e) => setBrokerName(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 bg-secondary border border-input rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
                  placeholder="e.g. ICMarkets"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">
                  Server
                </label>
                <input
                  type="text"
                  value={server}
                  onChange={(e) => setServer(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 bg-secondary border border-input rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
                  placeholder="e.g. ICMarkets-Demo"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">
                  Login ID
                </label>
                <input
                  type="text"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 bg-secondary border border-input rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors font-mono"
                  placeholder="12345678"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 bg-secondary border border-input rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
                  placeholder="Stored encrypted server-side"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saveMt5.isPending}
              className="w-full py-2.5 bg-primary text-primary-foreground font-semibold text-sm rounded-md hover:bg-primary/90 disabled:opacity-50 transition-all glow-cyan"
            >
              {saveMt5.isPending ? "Connecting..." : "Connect MT5"}
            </button>
          </form>
        </div>

        {/* Bridge Control */}
        <div className="bg-card border border-card-border rounded-xl p-5">
          <h2 className="text-sm font-semibold text-foreground mb-2">Trading Bridge</h2>
          <p className="text-xs text-muted-foreground mb-4">
            Start the trading automation bridge. This hooks into the MT5 architecture for future VPS Python integration.
          </p>
          <button
            onClick={handleStartBridge}
            disabled={startBridge.isPending || !conn?.isConnected || conn?.bridgeRunning}
            className={`w-full py-2.5 font-semibold text-sm rounded-md transition-all disabled:opacity-50 ${
              conn?.bridgeRunning
                ? "bg-muted text-muted-foreground border border-border cursor-not-allowed"
                : "bg-secondary border border-primary/30 text-primary hover:bg-primary/10"
            }`}
          >
            {conn?.bridgeRunning ? "Bridge Active" : startBridge.isPending ? "Starting..." : "Start Trading Bridge"}
          </button>
        </div>

        {/* Architecture Note */}
        <div className="bg-muted/20 border border-border rounded-lg p-4">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Architecture</div>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>— Credentials stored encrypted on backend (simulation hash)</li>
            <li>— Architecture ready for VPS Python MetaTrader 5 integration</li>
            <li>— WebSocket hook points prepared for live trade streaming</li>
            <li>— Copy trading module hook available (future release)</li>
          </ul>
        </div>
      </div>
    </Layout>
  );
}
