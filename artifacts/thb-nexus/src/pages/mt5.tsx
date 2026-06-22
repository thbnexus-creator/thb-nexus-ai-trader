import { useState } from "react";
import { useGetMt5Connection, useSaveMt5Connection, useStartMt5Bridge, getGetMt5ConnectionQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout";

function StatusBadge({ status, isConnected, bridgeRunning }: { status: string; isConnected: boolean; bridgeRunning: boolean }) {
  if (bridgeRunning) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/15 border border-primary/30 rounded-xl">
        <span className="w-2.5 h-2.5 rounded-full bg-primary pulse-dot glow-cyan" />
        <span className="text-sm font-bold text-primary">Bridge Active</span>
      </div>
    );
  }
  if (isConnected) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-chart-2/15 border border-chart-2/30 rounded-xl">
        <span className="w-2.5 h-2.5 rounded-full bg-chart-2 glow-green" />
        <span className="text-sm font-bold text-chart-2">MT5 Connected</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 border border-border rounded-xl">
      <span className="w-2.5 h-2.5 rounded-full bg-muted-foreground/50" />
      <span className="text-sm font-medium text-muted-foreground">Not Connected</span>
    </div>
  );
}

export default function Mt5Page() {
  const queryClient = useQueryClient();
  const { data: conn } = useGetMt5Connection({ query: { refetchInterval: 5000, queryKey: getGetMt5ConnectionQueryKey() } });
  const saveMt5 = useSaveMt5Connection();
  const startBridge = useStartMt5Bridge();

  const [brokerName, setBrokerName] = useState("");
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [server, setServer] = useState("");
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);

  function showToast(msg: string, type: "ok" | "err" = "ok") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }

  function handleConnect(e: React.FormEvent) {
    e.preventDefault();
    saveMt5.mutate(
      { data: { brokerName, loginId, password, server } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetMt5ConnectionQueryKey() });
          showToast(`Connected to ${brokerName} (simulation mode)`);
          setPassword("");
        },
        onError: (err: any) => showToast(err?.response?.data?.error ?? "Failed to connect", "err"),
      }
    );
  }

  function handleStartBridge() {
    startBridge.mutate(undefined, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMt5ConnectionQueryKey() });
        showToast("Trading bridge activated — simulation mode");
      },
      onError: (err: any) => showToast(err?.response?.data?.error ?? "Failed to start bridge", "err"),
    });
  }

  return (
    <Layout>
      <div className="p-4 sm:p-5 space-y-4 max-w-2xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-base font-bold text-foreground">MT5 Bridge</h1>
          <p className="text-[11px] text-muted-foreground mt-0.5">Connect your MetaTrader 5 broker account</p>
        </div>

        {/* Status hero card */}
        <div className={`rounded-xl border p-4 ${
          conn?.isConnected ? "bg-chart-2/6 border-chart-2/25" : "bg-card border-card-border"
        }`}>
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-xl ${
                conn?.bridgeRunning ? "bg-primary/20 border border-primary/30" :
                conn?.isConnected ? "bg-chart-2/20 border border-chart-2/30" :
                "bg-muted border border-border"
              }`}>
                ⬡
              </div>
              <div>
                <div className="text-sm font-bold text-foreground">
                  {conn?.isConnected ? conn.brokerName : "MetaTrader 5"}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  {conn?.isConnected
                    ? `Login: ****${(conn.loginId ?? "").slice(-4)} · ${conn.server}`
                    : "No broker connected"}
                </div>
              </div>
            </div>
            <StatusBadge
              status={conn?.status ?? "disconnected"}
              isConnected={conn?.isConnected ?? false}
              bridgeRunning={conn?.bridgeRunning ?? false}
            />
          </div>

          {conn?.isConnected && (
            <div className="grid grid-cols-3 gap-3 pt-3 border-t border-chart-2/15 text-center">
              <div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Broker</div>
                <div className="text-xs font-bold text-foreground">{conn.brokerName}</div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Server</div>
                <div className="text-xs font-bold text-foreground truncate">{conn.server}</div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Bridge</div>
                <div className={`text-xs font-bold ${conn.bridgeRunning ? "text-primary" : "text-muted-foreground"}`}>
                  {conn.bridgeRunning ? "Active" : "Inactive"}
                </div>
              </div>
            </div>
          )}
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

        {/* Credentials form */}
        <div className="bg-card border border-card-border rounded-xl p-4">
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4">
            {conn?.isConnected ? "Update Credentials" : "Connect MT5 Account"}
          </div>
          <form onSubmit={handleConnect} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Broker Name</label>
                <input
                  type="text"
                  value={brokerName}
                  onChange={(e) => setBrokerName(e.target.value)}
                  required
                  placeholder="e.g. ICMarkets, Exness"
                  className="w-full px-3 py-3 bg-secondary border border-input rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Server</label>
                <input
                  type="text"
                  value={server}
                  onChange={(e) => setServer(e.target.value)}
                  required
                  placeholder="e.g. ICMarkets-Demo"
                  className="w-full px-3 py-3 bg-secondary border border-input rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Login ID</label>
                <input
                  type="text"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  required
                  placeholder="12345678"
                  className="w-full px-3 py-3 bg-secondary border border-input rounded-xl text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Trading Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Stored encrypted server-side"
                  className="w-full px-3 py-3 bg-secondary border border-input rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saveMt5.isPending}
              className="w-full py-3.5 bg-primary text-primary-foreground font-bold text-sm rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all glow-cyan active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {saveMt5.isPending ? <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> : "⬡"}
              {saveMt5.isPending ? "Connecting..." : conn?.isConnected ? "Update MT5 Connection" : "Connect MT5 Account"}
            </button>
          </form>
        </div>

        {/* Bridge control */}
        <div className="bg-card border border-card-border rounded-xl p-4">
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Trading Bridge</div>
          <p className="text-[11px] text-muted-foreground mb-4">
            Activate the automated trading bridge. Architecture is ready for VPS Python MT5 integration.
          </p>
          <button
            onClick={handleStartBridge}
            disabled={startBridge.isPending || !conn?.isConnected || conn?.bridgeRunning}
            className={`w-full py-3.5 font-bold text-sm rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] ${
              conn?.bridgeRunning
                ? "bg-primary/10 border border-primary/30 text-primary cursor-default"
                : "bg-secondary border border-primary/30 text-primary hover:bg-primary/10"
            }`}
          >
            {conn?.bridgeRunning
              ? "⚡ Bridge Running"
              : startBridge.isPending
              ? "Activating..."
              : !conn?.isConnected
              ? "Connect MT5 First"
              : "⚡ Activate Trading Bridge"}
          </button>
        </div>

        {/* Architecture info */}
        <div className="bg-muted/20 border border-border rounded-xl p-4">
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2.5">Future Integration Roadmap</div>
          <ul className="space-y-1.5 text-[11px] text-muted-foreground">
            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 flex-shrink-0" />Credentials hashed server-side (SHA-256 + salt)</li>
            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 flex-shrink-0" />VPS Python MetaTrader 5 API integration ready</li>
            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 flex-shrink-0" />WebSocket live trade streaming hook points prepared</li>
            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 flex-shrink-0" />Copy trading module (planned)</li>
            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 flex-shrink-0" />Brokers: IC Markets, Exness, XM, FP Markets</li>
          </ul>
        </div>
      </div>
    </Layout>
  );
}
