import { useState } from "react";
import { useAuth } from "@/components/auth-context";
import { useLogout } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-card-border rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Row({ label, value, badge }: { label: string; value: string; badge?: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm text-foreground font-medium">{value}</span>
        {badge && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary/20 text-primary border border-primary/30 uppercase tracking-wider">
            {badge}
          </span>
        )}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const logout = useLogout();
  const [notification, setNotification] = useState("");

  function handleLogout() {
    logout.mutate(undefined, {
      onSuccess: () => {
        queryClient.clear();
        navigate("/login");
      },
    });
  }

  function showNotif(msg: string) {
    setNotification(msg);
    setTimeout(() => setNotification(""), 3000);
  }

  return (
    <Layout>
      <div className="p-6 space-y-6 max-w-2xl">
        <div>
          <h1 className="text-lg font-bold text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground">Account preferences and platform configuration</p>
        </div>

        {notification && (
          <div className="px-4 py-2.5 bg-primary/10 border border-primary/20 rounded-md text-sm text-primary">
            {notification}
          </div>
        )}

        {/* Account Info */}
        <Section title="Account Information">
          <div>
            <Row label="Name" value={user?.name ?? "—"} />
            <Row label="Email" value={user?.email ?? "—"} />
            <Row label="Account Status" value="Verified & Active" badge="Active" />
            <Row label="Role" value={user?.isAdmin ? "Administrator" : "Trader"} badge={user?.isAdmin ? "Admin" : undefined} />
            <Row label="Member Since" value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "—"} />
          </div>
        </Section>

        {/* Platform */}
        <Section title="Platform Information">
          <div>
            <Row label="Platform Version" value="THB Nexus v1.0.0" />
            <Row label="Trading Mode" value="Simulation Only" badge="Sim" />
            <Row label="Data Feed" value="Simulated (800ms intervals)" />
            <Row label="Bot Engine" value="Nexus AI Engine v1" />
            <Row label="MT5 Integration" value="VPS Ready (Pending)" />
            <Row label="Session" value="Active · 7-day cookie" />
          </div>
        </Section>

        {/* Preferences */}
        <Section title="Display Preferences">
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2.5 border-b border-border">
              <div>
                <div className="text-sm text-foreground">Dark Futuristic Theme</div>
                <div className="text-xs text-muted-foreground">Cyberpunk cyan-on-dark interface</div>
              </div>
              <div className="w-8 h-4 bg-primary rounded-full flex items-center justify-end pr-0.5">
                <div className="w-3 h-3 bg-primary-foreground rounded-full" />
              </div>
            </div>
            <div className="flex items-center justify-between py-2.5 border-b border-border">
              <div>
                <div className="text-sm text-foreground">Live Price Tickers</div>
                <div className="text-xs text-muted-foreground">Updates every 800ms</div>
              </div>
              <div className="w-8 h-4 bg-primary rounded-full flex items-center justify-end pr-0.5">
                <div className="w-3 h-3 bg-primary-foreground rounded-full" />
              </div>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <div>
                <div className="text-sm text-foreground">Notification Sounds</div>
                <div className="text-xs text-muted-foreground">Bot alerts and trade closes</div>
              </div>
              <div className="w-8 h-4 bg-muted rounded-full flex items-center justify-start pl-0.5 cursor-pointer" onClick={() => showNotif("Sound settings will be available in a future update")}>
                <div className="w-3 h-3 bg-muted-foreground rounded-full" />
              </div>
            </div>
          </div>
        </Section>

        {/* Future Upgrades */}
        <Section title="Planned Upgrades">
          <div className="space-y-2">
            {[
              { label: "WebSocket Live Feeds", status: "Planned", desc: "Real-time price streaming via WS" },
              { label: "VPS MT5 Python Bridge", status: "In Dev", desc: "Live broker execution via Python" },
              { label: "Copy Trading Module", status: "Planned", desc: "Follow expert trader signals" },
              { label: "Real Broker Connectivity", status: "Planned", desc: "IC Markets, Exness, XM integration" },
              { label: "Email OTP Service", status: "Planned", desc: "Real email delivery for OTP" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${item.status === "In Dev" ? "bg-chart-4" : "bg-muted"}`} />
                <div className="flex-1">
                  <div className="text-sm text-foreground">{item.label}</div>
                  <div className="text-xs text-muted-foreground">{item.desc}</div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border ${
                  item.status === "In Dev"
                    ? "bg-chart-4/15 text-chart-4 border-chart-4/30"
                    : "bg-muted text-muted-foreground border-border"
                }`}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </Section>

        {/* Danger Zone */}
        <Section title="Session">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-foreground">Sign out of THB Nexus</div>
              <div className="text-xs text-muted-foreground">Your data remains saved in this session</div>
            </div>
            <button
              onClick={handleLogout}
              disabled={logout.isPending}
              className="px-4 py-2 bg-destructive/15 border border-destructive/30 text-destructive text-sm font-medium rounded-md hover:bg-destructive/25 transition-colors disabled:opacity-50"
            >
              {logout.isPending ? "Signing out..." : "Sign Out"}
            </button>
          </div>
        </Section>
      </div>
    </Layout>
  );
}
