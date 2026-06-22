import { Link, useRoute, useLocation } from "wouter";
import { useAuth } from "./auth-context";
import { useLogout } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "◈" },
  { href: "/bot", label: "Trading Bot", icon: "⚡" },
  { href: "/mt5", label: "MT5 Bridge", icon: "⬡" },
  { href: "/deposits", label: "Deposits", icon: "◎" },
  { href: "/trades", label: "Trade History", icon: "▤" },
];

function NavItem({ href, label, icon }: { href: string; label: string; icon: string }) {
  const [isActive] = useRoute(href);
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200 ${
        isActive
          ? "bg-primary/15 text-primary border border-primary/30 glow-cyan"
          : "text-muted-foreground hover:text-foreground hover:bg-secondary"
      }`}
    >
      <span className={`text-base ${isActive ? "text-primary" : ""}`}>{icon}</span>
      {label}
      {isActive && <span className="ml-auto w-1 h-1 rounded-full bg-primary pulse-dot" />}
    </Link>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const logout = useLogout();

  function handleLogout() {
    logout.mutate(undefined, {
      onSuccess: () => {
        queryClient.clear();
        navigate("/login");
      },
    });
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 border-r border-border bg-sidebar flex flex-col">
        {/* Logo */}
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-primary/20 border border-primary/40 flex items-center justify-center glow-cyan">
              <span className="text-primary text-xs font-bold">Nx</span>
            </div>
            <div>
              <div className="text-sm font-bold text-foreground tracking-wide">THB Nexus</div>
              <div className="text-[10px] text-primary font-medium tracking-widest uppercase">AI Trader</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavItem key={item.href} {...item} />
          ))}
        </nav>

        {/* User */}
        <div className="p-3 border-t border-sidebar-border">
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-md">
            <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
              <span className="text-primary text-xs font-bold uppercase">{user?.name?.[0] ?? "U"}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-foreground truncate">{user?.name}</div>
              <div className="text-[10px] text-muted-foreground truncate">{user?.email}</div>
            </div>
            {user?.isAdmin && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-primary/20 text-primary border border-primary/30 uppercase tracking-wider">
                Admin
              </span>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="w-full mt-1.5 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition-colors text-left"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
