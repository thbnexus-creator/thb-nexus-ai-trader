import { useState } from "react";
import { useAuth } from "@/components/auth-context";
import { useLogout, useGetBalance, getGetBalanceQueryKey, useGetTradeStats, getGetTradeStatsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout";

function SectionHeader({ title, icon }: { title: string; icon: string }) {
  return (
    <div className="px-4 py-3 border-b border-border bg-muted/10 flex items-center gap-2">
      <span className="text-muted-foreground text-sm">{icon}</span>
      <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{title}</h2>
    </div>
  );
}

function InfoRow({ label, value, badge, badgeVariant = "primary" }: { label: string; value: string; badge?: string; badgeVariant?: "primary" | "green" | "yellow" | "muted" }) {
  const badgeCls = badgeVariant === "green"
    ? "bg-chart-2/15 text-chart-2 border-chart-2/30"
    : badgeVariant === "yellow"
    ? "bg-chart-4/15 text-chart-4 border-chart-4/30"
    : badgeVariant === "muted"
    ? "bg-muted text-muted-foreground border-border"
    : "bg-primary/20 text-primary border-primary/30";

  return (
    <div className="flex items-center justify-between py-3 px-4 border-b border-border last:border-0 hover:bg-secondary/20 transition-colors">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm text-foreground font-medium text-right">{value}</span>
        {badge && (
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${badgeCls}`}>
            {badge}
          </span>
        )}
      </div>
    </div>
  );
}

function Toggle({ label, desc, on, onToggle }: { label: string; desc: string; on: boolean; onToggle?: () => void }) {
  return (
    <div className="flex items-center justify-between py-3 px-4 border-b border-border last:border-0">
      <div>
        <div className="text-sm text-foreground">{label}</div>
        <div className="text-[11px] text-muted-foreground mt-0.5">{desc}</div>
      </div>
      <button
        onClick={onToggle}
        className={`relative w-10 h-5.5 rounded-full transition-colors flex items-center ${on ? "bg-primary" : "bg-muted"}`}
        style={{ minWidth: "40px", height: "22px" }}
      >
        <span
          className={`absolute w-4 h-4 bg-white rounded-full shadow transition-transform ${on ? "translate-x-5" : "translate-x-0.5"}`}
        />
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const logout = useLogout();
  const { data: balance } = useGetBalance({ query: { refetchInterval: 10000, queryKey: getGetBalanceQueryKey() } });
  const { data: stats } = useGetTradeStats({ query: { refetchInterval: 10000, queryKey: getGetTradeStatsQueryKey() } });
  const [toast, setToast] = useState<string | null>(null);
  const [liveTickerOn, setLiveTickerOn] = useState(true);
  const [signalAlertsOn, setSignalAlertsOn] = useState(false);
  const [soundsOn, setSoundsOn] = useState(false);

  function handleLogout() {
    logout.mutate(undefined, {
      onSuccess: () => { queryClient.clear(); navigate("/login"); },
    });
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  const joinedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : "—";

  const totalPnl = stats?.totalPnl ?? 0;

  return (
    <Layout>
      <div className="p-4 sm:p-5 space-y-4 max-w-2xl">
        <div>
          <h1 className="text-base font-bold text-foreground">Settings</h1>
          <p className="text-[11px] text-muted-foreground mt-0.5">Account, platform, and display preferences</p>
        </div>

        {toast && (
          <div className="px-4 py-3 bg-primary/10 border border-primary/20 rounded-xl text-sm text-primary">
            {toast}
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-card border border-card-border rounded-xl p-4 flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center flex-shrink-0 glow-cyan">
            <span className="text-primary text-xl font-black uppercase">{user?.name?.[0] ?? "?"}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-foreground">{user?.name ?? "—"}</span>
              {user?.isAdmin && (
                <span className="text-[9px] font-black px-2 py-0.5 rounded bg-primary/20 text-primary border border-primary/30 uppercase">Admin</span>
              )}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">{user?.email ?? "—"}</div>
            <div className="text-[10px] text-primary mt-1 font-semibold">Member since {joinedDate}</div>
          </div>
          <div className="flex-shrink-0 text-right">
            <div className="text-xl font-bold font-mono text-primary">${(balance?.usdt ?? 0).toFixed(2)}</div>
            <div className="text-[9px] text-muted-foreground uppercase tracking-wider mt-0.5">USDT balance</div>
            <div className={`text-[11px] font-bold font-mono mt-1 ${totalPnl >= 0 ? "text-profit" : "text-loss"}`}>
              {totalPnl >= 0 ? "+" : ""}${totalPnl.toFixed(2)} P&L
            </div>
          </div>
        </div>

        {/* Account Info */}
        <div className="bg-card border border-card-border rounded-xl overflow-hidden">
          <SectionHeader title="Account Information" icon="◉" />
          <InfoRow label="Full Name" value={user?.name ?? "—"} />
          <InfoRow label="Email Address" value={user?.email ?? "—"} />
          <InfoRow label="Account Status" value="Verified & Active" badge="Active" badgeVariant="green" />
          <InfoRow label="Role" value={user?.isAdmin ? "Administrator" : "Trader"} badge={user?.isAdmin ? "Admin" : undefined} />
          <InfoRow label="Member Since" value={joinedDate} />
          <InfoRow label="Session" value="Active — 7-day cookie" />
        </div>

        {/* Trading Performance */}
        <div className="bg-card border border-card-border rounded-xl overflow-hidden">
          <SectionHeader title="Trading Performance" icon="▤" />
          <InfoRow label="Total Trades" value={String(stats?.totalTrades ?? 0)} />
          <InfoRow label="Win Rate" value={`${stats?.winRate ?? 0}%`} badge={`${stats?.winningTrades ?? 0}W / ${stats?.losingTrades ?? 0}L`} badgeVariant={(stats?.winRate ?? 0) >= 50 ? "green" : "muted"} />
          <InfoRow label="Total P&L" value={`${totalPnl >= 0 ? "+" : ""}$${totalPnl.toFixed(2)}`} badge={totalPnl >= 0 ? "Profit" : "Loss"} badgeVariant={totalPnl >= 0 ? "green" : "muted"} />
          <InfoRow label="Best Trade" value={`+$${(stats?.bestTrade ?? 0).toFixed(2)}`} />
          <InfoRow label="Worst Trade" value={`$${(stats?.worstTrade ?? 0).toFixed(2)}`} />
          <InfoRow label="Average Profit" value={`${(stats?.avgProfit ?? 0) >= 0 ? "+" : ""}$${(stats?.avgProfit ?? 0).toFixed(2)} / trade`} />
          <InfoRow label="USDT Balance" value={`$${(balance?.usdt ?? 0).toFixed(2)}`} badge="USDT" badgeVariant="primary" />
        </div>

        {/* Platform */}
        <div className="bg-card border border-card-border rounded-xl overflow-hidden">
          <SectionHeader title="Platform Information" icon="◈" />
          <InfoRow label="Platform Version" value="THB Nexus v1.0.0" />
          <InfoRow label="Trading Mode" value="Simulation Only" badge="Sim" badgeVariant="yellow" />
          <InfoRow label="Signal Engine" value="EMA9 / EMA100 / RSI4" />
          <InfoRow label="Data Feed" value="Simulated · 800ms intervals" />
          <InfoRow label="Bot Engine" value="Nexus AI Engine v1" />
          <InfoRow label="MT5 Integration" value="VPS Architecture Ready" badge="Pending" badgeVariant="muted" />
          <InfoRow label="Supported Symbols" value="EURUSD · GBPUSD · XAUUSD · BTCUSD" />
        </div>

        {/* Display Preferences */}
        <div className="bg-card border border-card-border rounded-xl overflow-hidden">
          <SectionHeader title="Display Preferences" icon="⚙" />
          <Toggle
            label="Live Price Tickers"
            desc="Real-time market data updates every 800ms"
            on={liveTickerOn}
            onToggle={() => setLiveTickerOn(v => !v)}
          />
          <Toggle
            label="Signal Alerts"
            desc="EMA9/RSI4 BUY/SELL signal notifications"
            on={signalAlertsOn}
            onToggle={() => {
              setSignalAlertsOn(v => !v);
              showToast("Signal alerts will be available after WebSocket integration");
            }}
          />
          <Toggle
            label="Notification Sounds"
            desc="Bot trade and alert audio feedback"
            on={soundsOn}
            onToggle={() => {
              setSoundsOn(v => !v);
              showToast("Sound settings will be available in a future update");
            }}
          />
        </div>

        {/* Roadmap */}
        <div className="bg-card border border-card-border rounded-xl overflow-hidden">
          <SectionHeader title="Platform Roadmap" icon="⬡" />
          <div className="divide-y divide-border">
            {[
              { label: "WebSocket Live Feeds",      status: "Planned", desc: "Real-time streaming via WS",          dot: "bg-muted-foreground/30" },
              { label: "VPS MT5 Python Bridge",     status: "In Dev",  desc: "Live broker execution via Python VPS", dot: "bg-chart-4" },
              { label: "Email OTP Delivery",        status: "Planned", desc: "Real email OTP for account security",  dot: "bg-muted-foreground/30" },
              { label: "Real Broker Connectivity",  status: "Planned", desc: "IC Markets, Exness, XM, FP Markets",   dot: "bg-muted-foreground/30" },
              { label: "Copy Trading Module",       status: "Planned", desc: "Follow expert trader signals",          dot: "bg-muted-foreground/30" },
              { label: "Withdrawal System",         status: "Planned", desc: "USDT payouts to wallet addresses",     dot: "bg-muted-foreground/30" },
              { label: "Multi-tier Subscriptions",  status: "Planned", desc: "Standard, Pro, VIP, Enterprise plans", dot: "bg-muted-foreground/30" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3 py-3 px-4 hover:bg-secondary/20 transition-colors">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${item.dot}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-foreground">{item.label}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{item.desc}</div>
                </div>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase flex-shrink-0 ${
                  item.status === "In Dev"
                    ? "bg-chart-4/15 text-chart-4 border-chart-4/30"
                    : "bg-muted/50 text-muted-foreground border-border"
                }`}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Danger zone */}
        <div className="bg-card border border-card-border rounded-xl overflow-hidden">
          <SectionHeader title="Session" icon="⚠" />
          <div className="p-4 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-foreground">Sign out of THB Nexus</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">Your simulation data and settings are saved server-side</div>
            </div>
            <button
              onClick={handleLogout}
              disabled={logout.isPending}
              className="px-4 py-2 bg-destructive/10 border border-destructive/30 text-destructive text-sm font-semibold rounded-xl hover:bg-destructive/20 transition-colors disabled:opacity-50 flex-shrink-0"
            >
              {logout.isPending ? "Signing out…" : "Sign Out"}
            </button>
          </div>
        </div>

        <p className="text-center text-[10px] text-muted-foreground pb-2">
          THB Nexus AI Trader — Simulation Platform Only · Not Financial Advice
        </p>
      </div>
    </Layout>
  );
}
