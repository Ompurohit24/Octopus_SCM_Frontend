import { createFileRoute } from "@tanstack/react-router";
import { LifeBuoy, BookOpen, MessageSquare, Keyboard, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/help")({
  head: () => ({ meta: [{ title: "Help — Octopus SCM" }] }),
  component: Help,
});

const SHORTCUTS = [
  { keys: "⌘K", desc: "Open command palette" },
  { keys: "G then D", desc: "Go to Dashboard" },
  { keys: "G then I", desc: "Go to Import jobs" },
  { keys: "G then E", desc: "Go to Export jobs" },
  { keys: "G then F", desc: "Go to Finance" },
  { keys: "N", desc: "Create new record on the current page" },
];

function Help() {
  const items = [
    {
      icon: BookOpen,
      name: "Documentation",
      desc: "Guides, workflows and best practices.",
      action: () => window.open("https://docs.lovable.dev", "_blank"),
    },
    {
      icon: MessageSquare,
      name: "Contact Support",
      desc: "24/7 live support for enterprise plans.",
      action: () => (window.location.href = "mailto:support@octopus.scm"),
    },
    {
      icon: Keyboard,
      name: "Keyboard Shortcuts",
      desc: "Move faster through the workspace.",
      action: () => {
        const el = document.getElementById("shortcuts");
        el?.scrollIntoView({ behavior: "smooth" });
      },
    },
    {
      icon: LifeBuoy,
      name: "Status & Incidents",
      desc: "Realtime service status across regions.",
      action: () => toast.success("All systems operational"),
    },
  ];
  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Help</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Help & Resources</h1>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {items.map((i) => (
          <button
            key={i.name}
            onClick={i.action}
            className="rounded-xl border border-border bg-card p-5 text-left shadow-soft transition hover:-translate-y-0.5 hover:shadow-card"
          >
            <div className="grid size-10 place-items-center rounded-lg bg-accent text-brand">
              <i.icon className="size-5" />
            </div>
            <h3 className="mt-4 text-sm font-semibold tracking-tight">
              {i.name} <ExternalLink className="ml-1 inline size-3 text-muted-foreground" />
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">{i.desc}</p>
          </button>
        ))}
      </div>

      <div id="shortcuts" className="overflow-hidden rounded-xl border border-border bg-card shadow-soft">
        <div className="border-b border-border px-5 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Keyboard shortcuts
        </div>
        <ul className="divide-y divide-border">
          {SHORTCUTS.map((s) => (
            <li key={s.desc} className="flex items-center justify-between px-5 py-3 text-sm">
              <span className="text-foreground/80">{s.desc}</span>
              <kbd className="rounded border border-border bg-muted px-2 py-0.5 font-mono text-[11px]">
                {s.keys}
              </kbd>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
