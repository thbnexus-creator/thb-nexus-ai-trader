import { useState } from "react";
import { useGetAdminOverview, getGetAdminOverviewQueryKey, useGetAdminUsers, getGetAdminUsersQueryKey, useGetActivationKeys, getGetActivationKeysQueryKey, useGenerateActivationKey, useAdminToggleUser, useGetAdminAllTrades, getGetAdminAllTradesQueryKey, useGetAdminAllDeposits, getGetAdminAllDepositsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { useAuth } from "@/components/auth-context";
import { Redirect } from "wouter";

type Tab = "overview" | "users" | "finance" | "trades" | "keys";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "overview", label: "Overview",   icon: "◈" },
  { id: "users",    label: "Users",      icon: "◉" },
  { id: "finance",  label: "Finance",    icon: "◎" },
  { id: "trades",   label: "All Trades", icon: "▤" },
  { id: "keys",     label: "Keys",       icon: "⬡" },
];

const PLANS = ["Standard", "Pro", "VIP", "Enterprise"];

function StatCard({ label, value, sub, color = "default" }: { label: string; value: string | number; sub?: string; color?: "primary" | "green" | "red" | "yellow" | "default" }) {
  const valClass = color === "primary" ? "text-primary ticker-glow" : color === "green" ? "text-profit" : color === "red" ? "text-loss" : color === "yellow" ? "text-chart-4" : "text-foreground";
  return (
    <div className="bg-card border border-card-border rounded-xl p-4">
      <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-2">{label}</div>
      <div className={`text-2xl font-bold font-mono ${valClass}`}>{value}</div>
      {sub && <div className="text-[11px] text-muted-foreground mt-1">{sub}</div>}
    </div>
  );
}

function OverviewTab() {
  const { data: overview } = useGetAdminOverview({ query: { refetchInterval: 5000, queryKey: getGetAdminOverviewQueryKey() } });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <StatCard label="Total Users"     value={overview?.totalUsers ?? 0}    sub={`${overview?.verifiedUsers ?? 0} verified`} color="primary" />
        <StatCard label="Active Users"    value={overview?.activeUsers ?? 0}   sub="accounts active" />
        <StatCard label="Total Deposited" value={`$${(overview?.totalDeposited ?? 0).toFixed(2)}`} color="green" />
        <StatCard label="Platform P&L"   value={`${(overview?.totalPnl ?? 0) >= 0 ? "+" : ""}$${(overview?.totalPnl ?? 0).toFixed(2)}`} color={(overview?.totalPnl ?? 0) >= 0 ? "green" : "red"} />
        <StatCard label="Total Trades"   value={overview?.totalTrades ?? 0} />
        <StatCard label="Active Bots"    value={overview?.activeBots ?? 0}  color="yellow" sub="bots running" />
        <StatCard label="MT5 Accounts"   value={overview?.mt5Connected ?? 0} sub="connected" />
        <StatCard label="Activation Keys" value={overview?.activationKeys ?? 0} />
      </div>

      <div className="bg-card border border-card-border rounded-xl p-4">
        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Platform Status</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-chart-2/8 border border-chart-2/20 rounded-xl">
            <div className="text-2xl font-bold text-chart-2">{overview?.activeBots ?? 0}</div>
            <div className="text-[9px] text-muted-foreground uppercase tracking-widest mt-1">Bots Running</div>
          </div>
          <div className="text-center p-3 bg-primary/8 border border-primary/20 rounded-xl">
            <div className="text-2xl font-bold text-primary">{overview?.mt5Connected ?? 0}</div>
            <div className="text-[9px] text-muted-foreground uppercase tracking-widest mt-1">MT5 Connected</div>
          </div>
          <div className="text-center p-3 bg-secondary border border-border rounded-xl">
            <div className="text-2xl font-bold text-foreground">{overview?.totalUsers ?? 0}</div>
            <div className="text-[9px] text-muted-foreground uppercase tracking-widest mt-1">Total Accounts</div>
          </div>
          <div className="text-center p-3 bg-secondary border border-border rounded-xl">
            <div className="text-2xl font-bold text-chart-4">{overview?.activationKeys ?? 0}</div>
            <div className="text-[9px] text-muted-foreground uppercase tracking-widest mt-1">Keys Generated</div>
          </div>
        </div>
      </div>

      <div className="bg-card border border-card-border rounded-xl p-4">
        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Roadmap & Future Upgrades</div>
        <ul className="space-y-2 text-[11px] text-muted-foreground">
          {[
            "WebSocket live price feed integration",
            "Real MT5 broker connection via VPS Python engine",
            "Automated copy trading system",
            "Withdrawal management with USDT payouts",
            "Multi-tier subscription system with activation keys",
            "Email OTP delivery integration",
            "Admin bot control across all user accounts",
          ].map((item, i) => (
            <li key={i} className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary/40 flex-shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function UsersTab() {
  const queryClient = useQueryClient();
  const { data: users = [] } = useGetAdminUsers({ query: { refetchInterval: 8000, queryKey: getGetAdminUsersQueryKey() } });
  const toggle = useAdminToggleUser();

  function handleToggle(userId: string) {
    toggle.mutate({ userId }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetAdminUsersQueryKey() }),
    });
  }

  return (
    <div className="bg-card border border-card-border rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">User Management</div>
        <span className="text-[9px] text-muted-foreground">{users.length} accounts</span>
      </div>
      {users.length === 0 ? (
        <div className="py-10 text-center text-sm text-muted-foreground">No users registered yet</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead className="border-b border-border bg-muted/20">
              <tr className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                <th className="px-4 py-2.5 text-left">User</th>
                <th className="px-4 py-2.5 text-left">Status</th>
                <th className="px-4 py-2.5 text-left">Balance</th>
                <th className="px-4 py-2.5 text-left">P&L</th>
                <th className="px-4 py-2.5 text-left">Trades</th>
                <th className="px-4 py-2.5 text-left">Bot</th>
                <th className="px-4 py-2.5 text-left">MT5</th>
                <th className="px-4 py-2.5 text-left">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-secondary/40 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
                        <span className="text-primary text-[10px] font-bold uppercase">{u.name[0]}</span>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                          {u.name}
                          {u.isAdmin && <span className="text-[8px] font-black px-1 py-0.5 bg-primary/20 text-primary rounded border border-primary/30">ADM</span>}
                        </div>
                        <div className="text-[10px] text-muted-foreground">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border uppercase ${u.isVerified ? "bg-chart-2/15 text-chart-2 border-chart-2/25" : "bg-muted/50 text-muted-foreground border-border"}`}>
                        {u.isVerified ? "verified" : "unverified"}
                      </span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border uppercase ${u.isActive ? "bg-primary/15 text-primary border-primary/25" : "bg-destructive/15 text-destructive border-destructive/25"}`}>
                        {u.isActive ? "active" : "suspended"}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-sm text-primary">${u.balance.toFixed(2)}</td>
                  <td className={`px-4 py-3 font-mono font-bold text-sm ${u.totalPnl >= 0 ? "text-profit" : "text-loss"}`}>
                    {u.totalPnl >= 0 ? "+" : ""}${u.totalPnl.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground font-mono">{u.totalTrades}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border uppercase ${u.botRunning ? "bg-chart-2/15 text-chart-2 border-chart-2/25 pulse-dot" : "bg-muted/50 text-muted-foreground border-border"}`}>
                      {u.botRunning ? "⚡ on" : "off"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border uppercase ${u.mt5Connected ? "bg-chart-2/15 text-chart-2 border-chart-2/25" : "bg-muted/50 text-muted-foreground border-border"}`}>
                      {u.mt5Connected ? "⬡ on" : "off"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {!u.isAdmin && (
                      <button
                        onClick={() => handleToggle(u.id)}
                        disabled={toggle.isPending}
                        className={`text-[9px] font-bold px-2 py-1 rounded-lg border transition-all active:scale-[0.97] ${
                          u.isActive
                            ? "bg-destructive/10 text-destructive border-destructive/25 hover:bg-destructive/20"
                            : "bg-chart-2/10 text-chart-2 border-chart-2/25 hover:bg-chart-2/20"
                        }`}
                      >
                        {u.isActive ? "Suspend" : "Restore"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function FinanceTab() {
  const { data: deposits = [] } = useGetAdminAllDeposits({ query: { refetchInterval: 10000, queryKey: getGetAdminAllDepositsQueryKey() } });
  const { data: users = [] } = useGetAdminUsers({ query: { refetchInterval: 10000, queryKey: getGetAdminUsersQueryKey() } });

  const totalDeposited = deposits.reduce((s, d) => s + d.amount, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatCard label="Total Deposited" value={`$${totalDeposited.toFixed(2)}`} color="green" sub="All time USDT" />
        <StatCard label="Deposits"        value={deposits.length} sub="transactions" />
        <StatCard label="Avg Deposit"     value={deposits.length ? `$${(totalDeposited / deposits.length).toFixed(2)}` : "$0"} />
      </div>

      <div className="bg-card border border-card-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">All Deposits</div>
        </div>
        {deposits.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">No deposits yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead className="border-b border-border bg-muted/20">
                <tr className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                  <th className="px-4 py-2.5 text-left">User</th>
                  <th className="px-4 py-2.5 text-left">Amount</th>
                  <th className="px-4 py-2.5 text-left">Status</th>
                  <th className="px-4 py-2.5 text-left">TX Hash</th>
                  <th className="px-4 py-2.5 text-left">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {deposits.slice(0, 50).map((d) => {
                  const user = users.find(u => u.id === d.userId);
                  return (
                    <tr key={d.id} className="hover:bg-secondary/40 transition-colors">
                      <td className="px-4 py-3 text-xs text-muted-foreground">{user?.email ?? d.userId.slice(0, 8)}</td>
                      <td className="px-4 py-3 font-mono font-bold text-profit text-sm">+${d.amount.toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-chart-2/15 text-chart-2 border border-chart-2/25 uppercase">{d.status}</span>
                      </td>
                      <td className="px-4 py-3 font-mono text-[10px] text-muted-foreground">{d.txHash ? `${d.txHash.slice(0, 14)}…` : "—"}</td>
                      <td className="px-4 py-3 text-[10px] text-muted-foreground whitespace-nowrap">
                        {new Date(d.createdAt).toLocaleDateString()} <span className="opacity-60">{new Date(d.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function TradesTab() {
  const { data: trades = [] } = useGetAdminAllTrades({ query: { refetchInterval: 8000, queryKey: getGetAdminAllTradesQueryKey() } });
  const { data: users = [] } = useGetAdminUsers({ query: { queryKey: getGetAdminUsersQueryKey() } });

  return (
    <div className="bg-card border border-card-border rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">All Platform Trades</div>
        <span className="text-[9px] text-muted-foreground">{trades.length} trades</span>
      </div>
      {trades.length === 0 ? (
        <div className="py-10 text-center text-sm text-muted-foreground">No trades yet</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px]">
            <thead className="border-b border-border bg-muted/20">
              <tr className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                <th className="px-4 py-2.5 text-left">User</th>
                <th className="px-4 py-2.5 text-left">Symbol</th>
                <th className="px-4 py-2.5 text-left">Side</th>
                <th className="px-4 py-2.5 text-left">Strategy</th>
                <th className="px-4 py-2.5 text-left">Lots</th>
                <th className="px-4 py-2.5 text-left">P&L</th>
                <th className="px-4 py-2.5 text-left">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {trades.slice(0, 100).map((t) => {
                const user = users.find(u => u.id === t.userId);
                const pnlUp = (t.profitLoss ?? 0) >= 0;
                return (
                  <tr key={t.id} className="hover:bg-secondary/40 transition-colors">
                    <td className="px-4 py-3 text-[10px] text-muted-foreground">{user?.email ?? t.userId.slice(0, 8)}</td>
                    <td className="px-4 py-3 font-mono font-bold text-xs text-foreground">{t.symbol}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full border uppercase ${t.direction === "buy" ? "bg-chart-2/15 text-chart-2 border-chart-2/25" : "bg-destructive/15 text-destructive border-destructive/25"}`}>
                        {t.direction}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[10px] text-muted-foreground">{t.strategy ?? "—"} {t.timeframe ? `· ${t.timeframe}` : ""}</td>
                    <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">{t.lots}</td>
                    <td className={`px-4 py-3 font-mono font-bold text-sm ${pnlUp ? "text-profit" : "text-loss"}`}>
                      {t.profitLoss !== null ? `${pnlUp ? "+" : ""}$${t.profitLoss.toFixed(2)}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-[10px] text-muted-foreground whitespace-nowrap">
                      {new Date(t.openedAt).toLocaleDateString()} <span className="opacity-60">{new Date(t.openedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function KeysTab() {
  const queryClient = useQueryClient();
  const { data: keys = [] } = useGetActivationKeys({ query: { refetchInterval: 10000, queryKey: getGetActivationKeysQueryKey() } });
  const generate = useGenerateActivationKey();
  const [plan, setPlan] = useState("Standard");
  const [expiryDays, setExpiryDays] = useState(30);
  const [copied, setCopied] = useState<string | null>(null);

  function handleGenerate() {
    generate.mutate(
      { data: { plan, expiryDays } },
      { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetActivationKeysQueryKey() }) }
    );
  }

  function copyKey(key: string) {
    navigator.clipboard.writeText(key).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  return (
    <div className="space-y-4">
      {/* Generator */}
      <div className="bg-card border border-card-border rounded-xl p-4">
        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4">Generate Activation Key</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[10px] font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Plan</label>
            <select
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
              className="w-full px-3 py-3 bg-secondary border border-input rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              {PLANS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Expiry (days)</label>
            <input
              type="number"
              value={expiryDays}
              onChange={(e) => setExpiryDays(Number(e.target.value))}
              min={1}
              className="w-full px-3 py-3 bg-secondary border border-input rounded-xl text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleGenerate}
              disabled={generate.isPending}
              className="w-full py-3 bg-primary text-primary-foreground font-bold text-sm rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all glow-cyan active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {generate.isPending ? <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> : "⬡"}
              {generate.isPending ? "Generating..." : "Generate Key"}
            </button>
          </div>
        </div>
      </div>

      {/* Keys list */}
      <div className="bg-card border border-card-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Activation Keys</div>
          <span className="text-[9px] text-muted-foreground">{keys.length} keys</span>
        </div>
        {keys.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">No keys generated yet</div>
        ) : (
          <div className="divide-y divide-border">
            {keys.map((k) => (
              <div key={k.id} className="px-4 py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold text-primary">{k.key}</span>
                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border uppercase ${k.isActive && !k.usedBy ? "bg-chart-2/15 text-chart-2 border-chart-2/25" : "bg-muted/50 text-muted-foreground border-border"}`}>
                      {k.usedBy ? "used" : k.isActive ? "active" : "inactive"}
                    </span>
                    <span className="text-[8px] font-bold px-1.5 py-0.5 rounded border bg-secondary text-muted-foreground border-border uppercase">{k.plan}</span>
                  </div>
                  <div className="text-[9px] text-muted-foreground">
                    Generated {new Date(k.createdAt).toLocaleDateString()}
                    {k.expiresAt && ` · Expires ${new Date(k.expiresAt).toLocaleDateString()}`}
                    {k.usedBy && ` · Used by ${k.usedBy.slice(0, 8)}`}
                  </div>
                </div>
                <button
                  onClick={() => copyKey(k.key)}
                  className="flex-shrink-0 text-[9px] font-bold px-2.5 py-1.5 rounded-lg bg-secondary border border-border text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors"
                >
                  {copied === k.key ? "✓ Copied" : "Copy"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("overview");

  if (!user?.isAdmin) return <Redirect to="/dashboard" />;

  return (
    <Layout>
      <div className="p-4 sm:p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-foreground flex items-center gap-2">
              Admin Control Panel
              <span className="text-[9px] font-black px-2 py-0.5 rounded bg-primary/20 text-primary border border-primary/30 uppercase tracking-wider">Admin</span>
            </h1>
            <p className="text-[11px] text-muted-foreground mt-0.5">Full platform management — {user.email}</p>
          </div>
        </div>

        {/* Tab nav — scrollable on mobile */}
        <div className="flex overflow-x-auto gap-1 pb-0.5 -mx-1 px-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                tab === t.id
                  ? "bg-primary/15 text-primary border border-primary/30"
                  : "bg-secondary text-muted-foreground border border-border hover:text-foreground"
              }`}
            >
              <span>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === "overview" && <OverviewTab />}
        {tab === "users"    && <UsersTab />}
        {tab === "finance"  && <FinanceTab />}
        {tab === "trades"   && <TradesTab />}
        {tab === "keys"     && <KeysTab />}
      </div>
    </Layout>
  );
}
