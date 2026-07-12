import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useWorkspace, BRANCHES, FYS } from "@/lib/workspace";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({ meta: [{ title: "Settings — Octopus SCM" }] }),
  component: Settings,
});

const SECTIONS = [
  { id: "org", name: "Organization", desc: "Branches, financial year, currency, time zone." },
  { id: "users", name: "Users & Roles", desc: "Team members, permissions and SSO." },
  { id: "numbering", name: "Numbering Series", desc: "Job, invoice and BL numbering schemes." },
  { id: "tax", name: "Tax & GST", desc: "GST rates, HSN codes and place-of-supply rules." },
  { id: "templates", name: "Document Templates", desc: "Invoice, BL, packing list and DO templates." },
  { id: "integrations", name: "Integrations", desc: "Customs portals, shipping line APIs, email & WhatsApp." },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

function Settings() {
  const ws = useWorkspace();
  const [active, setActive] = useState<SectionId | null>(null);

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Settings</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Workspace Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Configure your Octopus SCM workspace.</p>
      </div>

      {!active ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => setActive(s.id)}
              className="rounded-xl border border-border bg-card p-5 text-left shadow-soft transition hover:-translate-y-0.5 hover:shadow-card"
            >
              <h3 className="text-sm font-semibold tracking-tight">{s.name}</h3>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{s.desc}</p>
              <span className="mt-4 inline-block text-[11px] font-medium text-brand">Configure →</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <button
            onClick={() => setActive(null)}
            className="text-xs font-medium text-brand hover:underline"
          >
            ← Back to settings
          </button>
          <div className="rounded-xl border border-border bg-card p-6 shadow-soft">
            <h2 className="text-base font-semibold tracking-tight">
              {SECTIONS.find((s) => s.id === active)?.name}
            </h2>
            <div className="mt-4 space-y-4">
              {active === "org" && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    toast.success("Organization settings saved");
                  }}
                  className="space-y-4"
                >
                  <Field label="Default Branch">
                    <select
                      value={ws.branch}
                      onChange={(e) => ws.setBranch(e.target.value)}
                      className="select"
                    >
                      {BRANCHES.map((b) => (
                        <option key={b}>{b}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Financial Year">
                    <select
                      value={ws.fy}
                      onChange={(e) => ws.setFy(e.target.value)}
                      className="select"
                    >
                      {FYS.map((f) => (
                        <option key={f}>{f}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Currency">
                    <input defaultValue="INR" className="input" />
                  </Field>
                  <button
                    type="submit"
                    className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
                  >
                    Save changes
                  </button>
                </form>
              )}

              {active !== "org" && (
                <p className="text-xs text-muted-foreground">
                  This area is wired and ready for FastAPI endpoints. Use the API client at{" "}
                  <code className="rounded bg-muted px-1.5 py-0.5 text-[11px]">
                    src/lib/api/storage.ts
                  </code>{" "}
                  to plug live data.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .input,.select{height:40px;width:100%;border:1px solid var(--color-border);background:var(--color-background);border-radius:8px;padding:0 12px;font-size:14px;outline:none}
        .input:focus,.select:focus{border-color:var(--color-ring);box-shadow:0 0 0 2px color-mix(in oklch, var(--color-ring) 20%, transparent)}
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium">{label}</span>
      {children}
    </label>
  );
}
