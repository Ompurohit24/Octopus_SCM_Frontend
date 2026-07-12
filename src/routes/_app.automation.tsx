import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, MessageCircle, Bell, Plus, Zap, Pencil, Trash2 } from "lucide-react";
import {
  useEntityList,
  useCreateEntity,
  useUpdateEntity,
  useDeleteEntity,
} from "@/lib/api/hooks";
import { rulesConfig } from "@/lib/entities";
import { EntityFormDialog, ConfirmDialog } from "@/components/octopus/EntityFormDialog";
import type { AutomationRule } from "@/lib/api/types";

export const Route = createFileRoute("/_app/automation")({
  head: () => ({ meta: [{ title: "Automation — Octopus SCM" }] }),
  component: Automation,
});

function Automation() {
  const rulesQuery = useEntityList("rules", { pageSize: 100 });
  const create = useCreateEntity("rules", "Rule");
  const update = useUpdateEntity("rules", "Rule");
  const remove = useDeleteEntity("rules", "Rule");
  const rules = rulesQuery.data?.rows ?? [];

  const [createOpen, setCreateOpen] = useState(false);
  const [editRow, setEditRow] = useState<AutomationRule | null>(null);
  const [deleteRow, setDeleteRow] = useState<AutomationRule | null>(null);

  const stats = {
    active: rules.filter((r) => r.enabled).length,
    runs: rules.reduce((s, r) => s + r.runs, 0),
    email: rules.filter((r) => r.channel.includes("Email")).reduce((s, r) => s + r.runs, 0),
    whatsapp: rules.filter((r) => r.channel.includes("WhatsApp")).reduce((s, r) => s + r.runs, 0),
  };

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Automation
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Notification Rules</h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Trigger emails, WhatsApp messages and in-app alerts automatically from any shipment event.
          </p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
        >
          <Plus className="size-3.5" /> New Rule
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
        {[
          { label: "Active Rules", value: String(stats.active), icon: Zap },
          { label: "Total runs", value: stats.runs.toLocaleString("en-IN"), icon: Bell },
          { label: "Email", value: stats.email.toLocaleString("en-IN"), icon: Mail },
          { label: "WhatsApp", value: stats.whatsapp.toLocaleString("en-IN"), icon: MessageCircle },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4 shadow-soft">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-medium uppercase tracking-wider">{s.label}</span>
              <s.icon className="size-4" />
            </div>
            <p className="mt-3 text-2xl font-semibold tracking-tight">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-soft">
        <div className="border-b border-border px-5 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Rules
        </div>
        <ul className="divide-y divide-border">
          {rules.length === 0 ? (
            <li className="px-5 py-10 text-center text-xs text-muted-foreground">
              No rules yet.
              <button
                onClick={() => setCreateOpen(true)}
                className="ml-2 font-medium text-brand hover:underline"
              >
                Create your first rule →
              </button>
            </li>
          ) : (
            rules.map((r) => (
              <li key={r.id} className="flex items-center gap-4 px-5 py-4 hover:bg-accent/40">
                <div className="grid size-9 place-items-center rounded-lg bg-accent text-brand">
                  <Zap className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{r.name}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {r.channel} · {r.trigger} · {r.runs.toLocaleString("en-IN")} runs
                  </p>
                </div>
                <label className="inline-flex cursor-pointer items-center gap-2 text-[11px] text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={r.enabled}
                    onChange={(e) => update.mutate({ id: r.id, patch: { enabled: e.target.checked } })}
                    className="size-4 rounded border-border accent-brand"
                  />
                  {r.enabled ? "Enabled" : "Disabled"}
                </label>
                <button
                  onClick={() => setEditRow(r)}
                  className="rounded p-1.5 text-muted-foreground hover:bg-accent"
                  aria-label="Edit rule"
                >
                  <Pencil className="size-3.5" />
                </button>
                <button
                  onClick={() => setDeleteRow(r)}
                  className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  aria-label="Delete rule"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </li>
            ))
          )}
        </ul>
      </div>

      <EntityFormDialog<AutomationRule>
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="New Automation Rule"
        fields={rulesConfig.fields}
        submitLabel="Create rule"
        onSubmit={async (vals) => {
          await create.mutateAsync(vals);
        }}
      />
      <EntityFormDialog<AutomationRule>
        open={!!editRow}
        onOpenChange={(o) => !o && setEditRow(null)}
        title="Edit Rule"
        fields={rulesConfig.fields}
        defaultValues={editRow ?? undefined}
        submitLabel="Save changes"
        onSubmit={async (vals) => {
          if (!editRow) return;
          await update.mutateAsync({ id: editRow.id, patch: vals });
        }}
      />
      <ConfirmDialog
        open={!!deleteRow}
        onOpenChange={(o) => !o && setDeleteRow(null)}
        title="Delete rule?"
        description="This automation will stop firing immediately."
        destructive
        confirmLabel="Delete"
        onConfirm={async () => {
          if (deleteRow) await remove.mutateAsync(deleteRow.id);
          setDeleteRow(null);
        }}
      />
    </div>
  );
}
