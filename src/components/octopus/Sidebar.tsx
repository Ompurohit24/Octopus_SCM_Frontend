import { useEffect, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Database,
  PackageOpen,
  Ship,
  Truck,
  Wallet,
  BarChart3,
  Zap,
  Settings,
  HelpCircle,
  Search,
  ChevronsLeft,
  ChevronsRight,
  FileText,
  Info,
  ClipboardList,
} from "lucide-react";
import { Logo } from "./Logo";
import { cn } from "@/lib/utils";
import { useWorkspace, getInitials } from "@/lib/workspace";
import { CommandPalette } from "./CommandPalette";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/master", label: "Master", icon: Database },
  { to: "/import", label: "Import", icon: PackageOpen },
  {
    to: "/purchase-orders",
    label: "Purchase Order",
    icon: ClipboardList,
  }, 
  { to: "/export", label: "Export", icon: Ship },
  { to: "/transport", label: "Transport", icon: Truck },

 // Purchase Orders generated from job services
   

  { to: "/finance", label: "Finance", icon: Wallet },
  { to: "/reports", label: "Reports", icon: BarChart3 },
  { to: "/automation", label: "Automation", icon: Zap },
  { to: "/documents", label: "Documents", icon: FileText },
  { to: "/about", label: "About", icon: Info },
] as const;

const FOOTER_NAV = [
  { to: "/settings", label: "Settings", icon: Settings },
  { to: "/help", label: "Help", icon: HelpCircle },
] as const;

const COLLAPSE_KEY = "octopus.scm.sidebar.collapsed";

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [palette, setPalette] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });
  const ws = useWorkspace();
  const navigate = useNavigate();

  useEffect(() => {
    const stored = typeof window !== "undefined" ? window.localStorage.getItem(COLLAPSE_KEY) : null;
    if (stored === "1") setCollapsed(true);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(COLLAPSE_KEY, collapsed ? "1" : "0");
    }
  }, [collapsed]);

  return (
    <aside
      className={cn(
        "group/sidebar relative flex h-dvh flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-300 ease-out",
        collapsed ? "w-[68px]" : "w-[244px]",
      )}
    >
      <Link to="/dashboard" className="flex h-16 items-center px-4">
        <Logo size={28} showWordmark={!collapsed} />
      </Link>

      <div className="px-3 pb-3">
        <button
          onClick={() => setPalette(true)}
          className={cn(
            "flex w-full items-center gap-2 rounded-lg border border-sidebar-border bg-background/60 px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-accent/60",
            collapsed && "justify-center px-0",
          )}
          aria-label="Open command palette"
        >
          <Search className="size-3.5 shrink-0" />
          {!collapsed && (
            <>
              <span className="truncate">Search…</span>
              <kbd className="ml-auto rounded border border-sidebar-border bg-background px-1.5 py-0.5 font-mono text-[10px]">
                ⌘K
              </kbd>
            </>
          )}
        </button>
      </div>

      <nav className="scrollbar-thin flex-1 space-y-0.5 overflow-y-auto px-2">
        {!collapsed && (
          <p className="px-3 pb-2 pt-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Workspace
          </p>
        )}
        {NAV.map((item) => {
          const active = path === item.to || path.startsWith(item.to + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "group/item relative flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                collapsed && "justify-center",
              )}
              title={collapsed ? item.label : undefined}
            >
              {active && (
                <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-brand" />
              )}
              <Icon className="size-[18px] shrink-0" strokeWidth={1.75} />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-0.5 border-t border-sidebar-border p-2">
        {FOOTER_NAV.map((item) => {
          const Icon = item.icon;
          const active = path.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                active && "bg-sidebar-accent text-sidebar-accent-foreground",
                collapsed && "justify-center",
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="size-[18px]" strokeWidth={1.75} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}

        <button
          onClick={() => navigate({ to: "/settings" })}
          className={cn(
            "mt-2 flex w-full items-center gap-2.5 rounded-lg p-2 text-left hover:bg-sidebar-accent/60",
            collapsed && "justify-center",
          )}
        >
          <div className="grid size-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand to-brand-blue text-xs font-semibold text-white">
            {ws.user ? getInitials(ws.user.name) : "AK"}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold">{ws.user?.name ?? "Aarav Kapoor"}</p>
              <p className="truncate text-[11px] text-muted-foreground">
                {ws.user?.role ?? "Ops Manager"}
              </p>
            </div>
          )}
        </button>

        <button
          onClick={() => setCollapsed((c) => !c)}
          className={cn(
            "flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-[11px] text-muted-foreground hover:bg-sidebar-accent/50",
            collapsed && "justify-center",
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronsRight className="size-4" /> : <ChevronsLeft className="size-4" />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>

      <CommandPalette open={palette} onOpenChange={setPalette} />
    </aside>
  );
}
