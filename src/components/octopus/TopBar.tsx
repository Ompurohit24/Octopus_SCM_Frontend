import { Bell, Plus, Search, Moon, Sun, ChevronDown, Building2, Check, LogOut, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useWorkspace, BRANCHES, FYS, getInitials } from "@/lib/workspace";
import { CommandPalette } from "./CommandPalette";
import { useEntityList, useUpdateEntity } from "@/lib/api/hooks";
import { formatDate } from "@/lib/csv";
import { toast } from "sonner";

function useClickOutside<T extends HTMLElement>(onAway: () => void) {
  const ref = useRef<T>(null);
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onAway();
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [onAway]);
  return ref;
}

export function TopBar() {
  const ws = useWorkspace();
  const navigate = useNavigate();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [branchOpen, setBranchOpen] = useState(false);
  const [fyOpen, setFyOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);

  const notifQuery = useEntityList("notifications", { pageSize: 8 });
  const updateNotif = useUpdateEntity("notifications", "Notification");
  const unread = (notifQuery.data?.rows ?? []).filter((n) => !n.read).length;

  const branchRef = useClickOutside<HTMLDivElement>(() => setBranchOpen(false));
  const fyRef = useClickOutside<HTMLDivElement>(() => setFyOpen(false));
  const quickRef = useClickOutside<HTMLDivElement>(() => setQuickOpen(false));
  const notifRef = useClickOutside<HTMLDivElement>(() => setNotifOpen(false));
  const userRef = useClickOutside<HTMLDivElement>(() => setUserOpen(false));

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const quickActions: { label: string; to: string }[] = [
    { label: "New Import Job", to: "/import" },
    { label: "New Export Job", to: "/export" },
    { label: "New Customer", to: "/master" },
    { label: "New Invoice", to: "/finance" },
    { label: "New Trip", to: "/transport" },
  ];

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-6 backdrop-blur-xl">
      <div className="relative flex max-w-md flex-1 items-center">
        <Search className="pointer-events-none absolute left-3 size-4 text-muted-foreground" />
        <button
          onClick={() => setPaletteOpen(true)}
          className="h-9 w-full rounded-lg border border-border bg-card pl-9 pr-16 text-left text-sm text-muted-foreground outline-none transition-colors hover:border-ring/40 focus:border-ring focus:ring-2 focus:ring-ring/20"
        >
          Search customers, jobs, containers, BL, vessels…
        </button>
        <kbd className="pointer-events-none absolute right-2.5 rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
          ⌘K
        </kbd>
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <div className="relative" ref={branchRef}>
          <button
            onClick={() => setBranchOpen((v) => !v)}
            className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-accent"
          >
            <Building2 className="size-3.5 text-muted-foreground" />
            {ws.branch}
            <ChevronDown className="size-3 text-muted-foreground" />
          </button>
          {branchOpen && (
            <div className="absolute right-0 top-full z-40 mt-1.5 w-48 overflow-hidden rounded-lg border border-border bg-popover shadow-elevated">
              {BRANCHES.map((b) => (
                <button
                  key={b}
                  onClick={() => {
                    ws.setBranch(b);
                    setBranchOpen(false);
                  }}
                  className="flex w-full items-center justify-between px-3 py-2 text-xs hover:bg-accent"
                >
                  {b}
                  {b === ws.branch && <Check className="size-3.5 text-brand" />}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative" ref={fyRef}>
          <button
            onClick={() => setFyOpen((v) => !v)}
            className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-accent"
          >
            {ws.fy}
          </button>
          {fyOpen && (
            <div className="absolute right-0 top-full z-40 mt-1.5 w-44 overflow-hidden rounded-lg border border-border bg-popover shadow-elevated">
              {FYS.map((f) => (
                <button
                  key={f}
                  onClick={() => {
                    ws.setFy(f);
                    setFyOpen(false);
                  }}
                  className="flex w-full items-center justify-between px-3 py-2 text-xs hover:bg-accent"
                >
                  {f}
                  {f === ws.fy && <Check className="size-3.5 text-brand" />}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mx-1 h-6 w-px bg-border" />

        <div className="relative" ref={quickRef}>
          <button
            onClick={() => setQuickOpen((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-soft hover:opacity-95"
          >
            <Plus className="size-3.5" />
            Quick Add
          </button>
          {quickOpen && (
            <div className="absolute right-0 top-full z-40 mt-1.5 w-52 overflow-hidden rounded-lg border border-border bg-popover shadow-elevated">
              {quickActions.map((a) => (
                <button
                  key={a.label}
                  onClick={() => {
                    setQuickOpen(false);
                    navigate({ to: a.to });
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-xs hover:bg-accent"
                >
                  <Plus className="size-3.5 text-muted-foreground" />
                  {a.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={ws.toggleDark}
          className="grid size-9 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
          aria-label="Toggle dark mode"
        >
          {ws.dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </button>

        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen((v) => !v)}
            className="relative grid size-9 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label="Notifications"
          >
            <Bell className="size-4" />
            {unread > 0 && (
              <span className="absolute right-2 top-2 size-1.5 rounded-full bg-brand-orange" />
            )}
          </button>
          {notifOpen && (
            <div className="absolute right-0 top-full z-40 mt-1.5 w-80 overflow-hidden rounded-lg border border-border bg-popover shadow-elevated">
              <div className="flex items-center justify-between border-b border-border px-3 py-2">
                <p className="text-xs font-semibold">Notifications</p>
                <button
                  onClick={async () => {
                    const rows = notifQuery.data?.rows ?? [];
                    for (const n of rows) {
                      if (!n.read) await updateNotif.mutateAsync({ id: n.id, patch: { read: true } });
                    }
                    toast.success("All notifications marked as read");
                  }}
                  className="text-[11px] font-medium text-brand hover:underline"
                >
                  Mark all read
                </button>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {(notifQuery.data?.rows ?? []).length === 0 ? (
                  <p className="px-3 py-6 text-center text-xs text-muted-foreground">
                    You're all caught up.
                  </p>
                ) : (
                  (notifQuery.data?.rows ?? []).map((n) => (
                    <button
                      key={n.id}
                      onClick={() => updateNotif.mutate({ id: n.id, patch: { read: true } })}
                      className={`flex w-full items-start gap-2 border-b border-border px-3 py-2.5 text-left text-xs last:border-b-0 hover:bg-accent ${
                        !n.read ? "bg-brand/5" : ""
                      }`}
                    >
                      <span
                        className={`mt-1 size-1.5 shrink-0 rounded-full ${
                          n.read ? "bg-transparent" : "bg-brand-orange"
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-foreground">{n.title}</p>
                        <p className="mt-0.5 line-clamp-2 text-muted-foreground">{n.body}</p>
                        <p className="mt-1 text-[10px] text-muted-foreground">{formatDate(n.createdAt)}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="relative" ref={userRef}>
          <button
            onClick={() => setUserOpen((v) => !v)}
            className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-brand to-brand-blue text-[11px] font-semibold text-white"
            aria-label="Account"
          >
            {ws.user ? getInitials(ws.user.name) : "AK"}
          </button>
          {userOpen && (
            <div className="absolute right-0 top-full z-40 mt-1.5 w-56 overflow-hidden rounded-lg border border-border bg-popover shadow-elevated">
              <div className="border-b border-border px-3 py-3">
                <p className="text-xs font-semibold">{ws.user?.name ?? "Aarav Kapoor"}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {ws.user?.email ?? "aarav.kapoor@octopus.scm"}
                </p>
              </div>
              <button
                onClick={() => {
                  setUserOpen(false);
                  navigate({ to: "/settings" });
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-xs hover:bg-accent"
              >
                <User className="size-3.5 text-muted-foreground" />
                Profile & Settings
              </button>
              <button
                onClick={() => {
                  ws.logout();
                  setUserOpen(false);
                  navigate({ to: "/login" });
                }}
                className="flex w-full items-center gap-2 border-t border-border px-3 py-2 text-xs text-destructive hover:bg-destructive/10"
              >
                <LogOut className="size-3.5" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </header>
  );
}
