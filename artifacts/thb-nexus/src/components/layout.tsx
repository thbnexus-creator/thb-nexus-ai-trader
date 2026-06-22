import { useState, useEffect } from "react";
import { Link, useRoute, useLocation } from "wouter";
import { useAuth } from "./auth-context";
import { useGetMarketTickers, getGetMarketTickersQueryKey, useLogout } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard",     icon: "◈" },
  { href: "/bot",       label: "Trading Bot",   icon: "⚡" },
  { href: "/mt5",       label: "MT5 Bridge",    icon: "⬡" },
  { href: "/deposits",  label: "Deposits",      icon: "◎" },
  { href: "/trades",    label: "Trade History", icon: "▤" },
  { href: "/settings",  label: "Settings",      icon: "⚙" },
];
const ADMIN_NAV = { href: "/admin", label: "Admin Panel", icon: "⚑" };

function NavLink({ href, label, icon, onClick, badge }: { href: string; label: string; icon: string; onClick?: () => void; badge?: string }) {
  const [isActive] = useRoute(href);
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150 active:scale-[0.98] ${
        isActive
          ? "bg-primary/15 text-primary border border-primary/30"
          : "text-muted-foreground hover:text-foreground hover:bg-white/5 border border-transparent"
      }`}
    >
      <span className={`text-base w-5 text-center flex-shrink-0 ${isActive ? "text-primary" : "opacity-50"}`}>{icon}</span>
      <span className="flex-1">{label}</span>
      {badge && <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-primary/20 text-primary border border-primary/30 uppercase">{badge}</span>}
      {isActive && <span className="w-1.5 h-1.5 rounded-full bg-primary pulse-dot" />}
    </Link>
  );
}

function MiniTickers() {
  const { data: tickers } = useGetMarketTickers({
    query: { refetchInterval: 1500, queryKey: getGetMarketTickersQueryKey() },
  });

  if (!tickers?.length) return null;

  return (
    <div className="space-y-2 px-1">
      {tickers.map((t) => {
        const dp = t.symbol === "BTCUSD" || t.symbol === "XAUUSD" ? 2 : 5;
        const isUp = t.direction === "up";
        const signalColor = t.signal === "BUY" ? "text-chart-2" : t.signal === "SELL" ? "text-destructive" : "text-chart-4";
        const rsiColor = t.rsi < 30 ? "text-chart-2" : t.rsi > 70 ? "text-destructive" : "text-muted-foreground";
        return (
          <div key={t.symbol} className="space-y-0.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold text-muted-foreground font-mono w-14 flex-shrink-0">{t.symbol}</span>
              <span className="text-[11px] font-mono text-foreground flex-1 text-right">{t.price.toFixed(dp)}</span>
              <span className={`text-[10px] font-black ${signalColor} w-9 text-right flex-shrink-0`}>{t.signal}</span>
            </div>
            <div className="flex items-center gap-1 pl-14">
              <span className={`text-[9px] font-mono ${rsiColor}`}>RSI {t.rsi.toFixed(0)}</span>
              <span className={`text-[9px] ml-auto ${isUp ? "text-profit" : "text-loss"}`}>{isUp ? "▲" : "▼"}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DrawerContent({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const logout = useLogout();

  function handleLogout() {
    logout.mutate(undefined, {
      onSuccess: () => {
        queryClient.clear();
        onClose();
        navigate("/login");
      },
    });
  }

  return (
    <div className="flex flex-col h-full bg-sidebar overflow-y-auto">
      <div className="flex items-center justify-between px-4 py-4 border-b border-sidebar-border flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center glow-cyan flex-shrink-0">
            <span className="text-primary text-sm font-black">Nx</span>
          </div>
          <div>
            <div className="text-sm font-bold text-foreground leading-tight">THB Nexus</div>
            <div className="text-[9px] text-primary font-semibold tracking-[0.18em] uppercase">AI Trader</div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-lg bg-secondary border border-border flex items-center justify-center text-muted-foreground hover:text-foreground"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      <div className="px-4 py-3 border-b border-sidebar-border flex-shrink-0">
        <div className="flex items-center gap-1.5 mb-2.5">
          <span className="w-1.5 h-1.5 rounded-full bg-chart-2 pulse-dot" />
          <span className="text-[9px] font-black text-chart-2 uppercase tracking-widest">Live · EMA9 · RSI4</span>
        </div>
        <MiniTickers />
      </div>

      <nav className="flex-1 px-3 py-3 space-y-1">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.href} {...item} onClick={onClose} />
        ))}
        {user?.isAdmin && (
          <>
            <div className="border-t border-border my-2" />
            <NavLink {...ADMIN_NAV} onClick={onClose} badge="ADM" />
          </>
        )}
      </nav>

      <div className="px-3 pb-4 pt-2 border-t border-sidebar-border flex-shrink-0">
        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/3 border border-border mb-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
            <span className="text-primary text-sm font-bold uppercase">{user?.name?.[0] ?? "U"}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-foreground truncate">{user?.name}</div>
            <div className="text-[10px] text-muted-foreground truncate">{user?.email}</div>
          </div>
          {user?.isAdmin && (
            <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-primary/20 text-primary border border-primary/30 uppercase flex-shrink-0">ADM</span>
          )}
        </div>
        <button
          onClick={handleLogout}
          className="w-full py-2.5 text-xs font-medium text-muted-foreground hover:text-destructive border border-border hover:border-destructive/30 rounded-xl transition-colors"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}

function MobileHeader({ onMenuOpen }: { onMenuOpen: () => void }) {
  const { data: tickers } = useGetMarketTickers({
    query: { refetchInterval: 1500, queryKey: getGetMarketTickersQueryKey() },
  });
  const btc = tickers?.find(t => t.symbol === "BTCUSD");
  const isUp = btc?.direction === "up";

  return (
    <header className="flex-shrink-0 h-14 bg-sidebar border-b border-border flex items-center justify-between px-4 z-10">
      <button
        onClick={onMenuOpen}
        className="w-9 h-9 rounded-lg bg-secondary border border-border flex flex-col items-center justify-center gap-1.5 flex-shrink-0"
        aria-label="Open menu"
      >
        <span className="w-[18px] h-0.5 bg-foreground rounded-full block" />
        <span className="w-3 h-0.5 bg-muted-foreground rounded-full block" />
        <span className="w-[18px] h-0.5 bg-foreground rounded-full block" />
      </button>

      <div className="flex items-center gap-2 absolute left-1/2 -translate-x-1/2">
        <div className="w-7 h-7 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center glow-cyan">
          <span className="text-primary text-[11px] font-black">Nx</span>
        </div>
        <div>
          <div className="text-sm font-bold text-foreground leading-none">THB Nexus</div>
          <div className="text-[8px] text-primary font-semibold tracking-widest uppercase leading-none mt-0.5">AI Trader</div>
        </div>
      </div>

      {btc && (
        <div className="flex items-center gap-1 bg-secondary/80 border border-border rounded-lg px-2 py-1.5 flex-shrink-0">
          <span className="text-[9px] font-mono text-muted-foreground">BTC</span>
          <span className="text-[11px] font-bold font-mono text-foreground">{btc.price.toFixed(0)}</span>
          <span className={`text-[9px] ${isUp ? "text-profit" : "text-loss"}`}>{isUp ? "▲" : "▼"}</span>
        </div>
      )}
    </header>
  );
}

function DesktopSidebar() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const logout = useLogout();

  return (
    <aside className="w-56 flex-shrink-0 border-r border-border bg-sidebar flex flex-col h-full select-none">
      <div className="px-4 py-4 border-b border-sidebar-border flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center glow-cyan flex-shrink-0">
            <span className="text-primary text-sm font-black">Nx</span>
          </div>
          <div>
            <div className="text-sm font-bold text-foreground">THB Nexus</div>
            <div className="text-[9px] text-primary font-semibold tracking-[0.15em] uppercase">AI Trader</div>
          </div>
        </div>
      </div>

      <div className="px-4 py-3 border-b border-sidebar-border flex-shrink-0">
        <div className="flex items-center gap-1.5 mb-2">
          <span className="w-1.5 h-1.5 rounded-full bg-chart-2 pulse-dot" />
          <span className="text-[9px] font-black text-chart-2 uppercase tracking-widest">Live · EMA9 · RSI4</span>
        </div>
        <MiniTickers />
      </div>

      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.href} {...item} />
        ))}
        {user?.isAdmin && (
          <>
            <div className="border-t border-border my-2" />
            <NavLink {...ADMIN_NAV} badge="ADM" />
          </>
        )}
      </nav>

      <div className="px-3 pb-4 pt-2 border-t border-sidebar-border flex-shrink-0">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl bg-white/3 border border-border mb-2">
          <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
            <span className="text-primary text-xs font-bold uppercase">{user?.name?.[0] ?? "U"}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-foreground truncate">{user?.name}</div>
            <div className="text-[10px] text-muted-foreground truncate">{user?.email}</div>
          </div>
          {user?.isAdmin && (
            <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-primary/20 text-primary border border-primary/30 uppercase flex-shrink-0">ADM</span>
          )}
        </div>
        <button
          onClick={() => { logout.mutate(undefined, { onSuccess: () => { queryClient.clear(); navigate("/login"); } }); }}
          className="w-full py-2 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-secondary"
        >
          Sign Out
        </button>
      </div>
    </aside>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const handler = (e: MediaQueryListEvent) => { if (e.matches) setDrawerOpen(false); };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <div className="hidden md:flex">
        <DesktopSidebar />
      </div>

      {/* Mobile backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 md:hidden ${drawerOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={() => setDrawerOpen(false)}
        aria-hidden="true"
      />

      {/* Mobile drawer */}
      <div
        className={`fixed top-0 left-0 bottom-0 z-50 w-72 shadow-2xl transition-transform duration-300 ease-in-out md:hidden ${drawerOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <DrawerContent onClose={() => setDrawerOpen(false)} />
      </div>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="md:hidden">
          <MobileHeader onMenuOpen={() => setDrawerOpen(true)} />
        </div>
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
