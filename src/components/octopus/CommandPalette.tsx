import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search, ArrowRight } from "lucide-react";

interface Item {
  group: string;
  label: string;
  hint?: string;
  to: string;
  keywords?: string;
}

const ITEMS: Item[] = [
  { group: "Navigate", label: "Dashboard", to: "/dashboard", hint: "G then D" },
  { group: "Navigate", label: "Master Data", to: "/master" },
  { group: "Navigate", label: "Import Jobs", to: "/import" },
  { group: "Navigate", label: "Export Jobs", to: "/export" },
  { group: "Navigate", label: "Transport", to: "/transport" },
  { group: "Navigate", label: "Finance", to: "/finance" },
  { group: "Navigate", label: "Reports", to: "/reports" },
  { group: "Navigate", label: "Automation", to: "/automation" },
  { group: "Navigate", label: "Documents", to: "/documents" },
  { group: "Navigate", label: "Settings", to: "/settings" },
  { group: "Navigate", label: "Help", to: "/help" },
  { group: "Create", label: "New Customer", to: "/master?new=customers" },
  { group: "Create", label: "New Import Job", to: "/import?new=1" },
  { group: "Create", label: "New Export Job", to: "/export?new=1" },
  { group: "Create", label: "New Invoice", to: "/finance?new=1" },
];

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);
  const navigate = useNavigate();

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return ITEMS;
    return ITEMS.filter(
      (i) =>
        i.label.toLowerCase().includes(term) ||
        (i.keywords ?? "").toLowerCase().includes(term) ||
        i.group.toLowerCase().includes(term),
    );
  }, [q]);

  useEffect(() => {
    setIdx(0);
  }, [q, open]);

  useEffect(() => {
    if (!open) setQ("");
  }, [open]);

  if (!open) return null;

  const groups: Record<string, Item[]> = {};
  for (const r of results) (groups[r.group] ??= []).push(r);

  const go = (item: Item) => {
    onOpenChange(false);
    const url = new URL(item.to, window.location.origin);
    navigate({ to: url.pathname, search: Object.fromEntries(url.searchParams) as Record<string, string> });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-foreground/20 px-4 pt-[14vh] backdrop-blur-sm"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-card shadow-elevated"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <Search className="size-4 text-muted-foreground" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setIdx((i) => Math.min(results.length - 1, i + 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setIdx((i) => Math.max(0, i - 1));
              } else if (e.key === "Enter") {
                e.preventDefault();
                const r = results[idx];
                if (r) go(r);
              } else if (e.key === "Escape") {
                onOpenChange(false);
              }
            }}
            placeholder="Search or jump to…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
            esc
          </kbd>
        </div>
        <div className="max-h-[60dvh] overflow-y-auto p-1.5">
          {results.length === 0 ? (
            <p className="px-3 py-8 text-center text-xs text-muted-foreground">No matches.</p>
          ) : (
            Object.entries(groups).map(([group, items]) => (
              <div key={group} className="mb-1">
                <p className="px-2.5 pb-1 pt-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  {group}
                </p>
                {items.map((item) => {
                  const i = results.indexOf(item);
                  const active = i === idx;
                  return (
                    <button
                      key={`${item.group}-${item.label}`}
                      onMouseEnter={() => setIdx(i)}
                      onClick={() => go(item)}
                      className={`flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm transition-colors ${
                        active ? "bg-accent text-foreground" : "text-foreground/80"
                      }`}
                    >
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.hint && (
                        <span className="text-[10px] text-muted-foreground">{item.hint}</span>
                      )}
                      <ArrowRight className="size-3.5 text-muted-foreground" />
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
