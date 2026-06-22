import { Link, useRoute } from "wouter";
import { useAuth } from "./auth-context";
import { useGetMarketTickers, getGetMarketTickersQueryKey } from "@workspace/api-client-react";
import React from "react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "◈" },
  { href: "/bot", label: "Trading Bot", icon: "⚡" },
  { href: "/mt5", label: "MT5 Bridge", icon: "⬡" },
  { href: "/deposits", label: "Deposits", icon: "◎" },
  { href: "/trades", label: "Trade History", icon: "▤" },
  { href: "/settings", label: "Settings", icon: "⚙" },
];

function NavItem({ href, label, icon }: { href: string; label: string; icon: string }) {
  const [isActive] = useRoute(href);
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
        isActive
          ? "bg-primary/12 text-primary border border-primary/25"
          : "text-muted-foreground hover:text-foreground hover:bg-white/5 border border-transparent"
      }`}
    >
      <span className={`text-base w-5 text-center flex-shrink-0 ${isActive ? "text-primary" : "opacity-60"}`}>{icon}</span>
      <span className="flex-1">{label}</span>
      {isActive && <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />}
    </Link>
  );
}

function LiveTicker() {
  const { data: tickers } = useGetMarketTickers({
    query: { refetchInterval: 1500, queryKey: getGetMarketTickersQueryKey() },
  });

  if (!tickers?.length) return null;

  return (
    <div className="px-3 py-2 space-y-1.5">
      {tickers.map((t) => {
        const dp = t.symbol === "BTCUSD" || t.symbol === "XAUUSD" ? 2 : 5;
        const isUp = t.direction === "up";
        return (
          <div key={t.symbol} className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground font-mono">{t.symbol}</span>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-mono text-foreground">{t.price.toFixed(dp)}</span>
              <span className={`text-[10px] font-medium ${isUp ? "text-profit" : "text-loss"}`}>
                {isUp ? "▲" : "▼"}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 border-r border-border bg-sidebar flex flex-col select-none">
        {/* Logo */}
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center glow-cyan flex-shrink-0">
              <span className="text-primary text-xs font-black tracking-tight">Nx</span>
            </div>
            <div>
              <div className="text-sm font-bold text-foreground">THB Nexus</div>
              <div className="text-[9px] text-primary font-semibold tracking-[0.15em] uppercase">AI Trader</div>
            </div>
          </div>
        </div>

        {/* Live mini tickers */}
        <div className="border-b border-sidebar-border">
          <div className="px-3 pt-2 pb-0.5">
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-chart-2 animate-pulse" />
              <span className="text-[9px] font-bold text-chart-2 uppercase tracking-widest">Live</span>
            </div>
          </div>
          <LiveTicker />
          <div className="h-2" />
        </div>

        {/* Nav */}
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <NavItem key={item.href} {...item} />
          ))}
        </nav>

        {/* User */}
        <div className="p-3 border-t border-sidebar-border">
          <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg bg-white/3">
            <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
              <span className="text-primary text-xs font-bold uppercase">{user?.name?.[0] ?? "U"}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-foreground truncate">{user?.name}</div>
              <div className="text-[10px] text-muted-foreground truncate">{user?.email}</div>
            </div>
            {user?.isAdmin && (
              <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-primary/20 text-primary border border-primary/30 uppercase tracking-wider flex-shrink-0">
                ADM
              </span>
            )}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
