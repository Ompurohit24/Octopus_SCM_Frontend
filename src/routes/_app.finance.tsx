import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ModulePage } from "@/components/octopus/ModulePage";
import {
  invoicesConfig,
  vendorBillsConfig,
  paymentsConfig,
  expensesConfig,
} from "@/lib/entities";
import { useEntityAll } from "@/lib/api/hooks";
import { formatINR } from "@/lib/csv";
import { Wallet, Receipt, AlertCircle, TrendingUp } from "lucide-react";

type Tab = "Invoices" | "Vendor Bills" | "Payments" | "Expenses" | "Outstanding" | "GST";
const TABS: Tab[] = ["Invoices", "Vendor Bills", "Payments", "Expenses", "Outstanding", "GST"];

export const Route = createFileRoute("/_app/finance")({
  head: () => ({ meta: [{ title: "Finance — Octopus SCM" }] }),
  component: Finance,
});

function Finance() {
  const [tab, setTab] = useState<Tab>("Invoices");
  return (
    <div className="space-y-2 p-6 pb-0 lg:p-8 lg:pb-0">
      <div className="-mt-1 flex items-center gap-1 border-b border-border">
        {TABS.map((t) => {
          const active = t === tab;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`relative px-3 py-2 text-xs font-medium transition-colors ${
                active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t}
              {active && (
                <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand" />
              )}
            </button>
          );
        })}
      </div>
      <div className="-mx-6 lg:-mx-8">
        {tab === "Invoices" && <ModulePage module="Finance" config={invoicesConfig} />}
        {tab === "Vendor Bills" && <ModulePage module="Finance" config={vendorBillsConfig} />}
        {tab === "Payments" && <ModulePage module="Finance" config={paymentsConfig} />}
        {tab === "Expenses" && <ModulePage module="Finance" config={expensesConfig} />}
        {tab === "Outstanding" && <Outstanding />}
        {tab === "GST" && <GST />}
      </div>
    </div>
  );
}

function Outstanding() {
  const invoices = useEntityAll("invoices");
  const data = invoices.data ?? [];
  const totals = {
    overdue: data.filter((i) => i.status === "Overdue").reduce((s, i) => s + i.amount, 0),
    pending: data.filter((i) => i.status === "Pending").reduce((s, i) => s + i.amount, 0),
    issued: data.filter((i) => i.status === "Issued").reduce((s, i) => s + i.amount, 0),
    paid: data.filter((i) => i.status === "Paid").reduce((s, i) => s + i.amount, 0),
  };
  const cards = [
    { label: "Overdue", value: totals.overdue, icon: AlertCircle, tone: "text-destructive" },
    { label: "Pending", value: totals.pending, icon: Receipt, tone: "text-warning-foreground" },
    { label: "Issued", value: totals.issued, icon: Wallet, tone: "text-brand" },
    { label: "Collected", value: totals.paid, icon: TrendingUp, tone: "text-success" },
  ];
  const open = data.filter((i) => i.status !== "Paid").sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-border bg-card p-4 shadow-soft">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-medium uppercase tracking-wider">{c.label}</span>
              <c.icon className={`size-4 ${c.tone}`} />
            </div>
            <p className="mt-3 text-2xl font-semibold tracking-tight">{formatINR(c.value)}</p>
          </div>
        ))}
      </div>
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-soft">
        <div className="border-b border-border px-5 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Open invoices
        </div>
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-2 text-left">Invoice</th>
              <th className="px-4 py-2 text-left">Customer</th>
              <th className="px-4 py-2 text-left">Due</th>
              <th className="px-4 py-2 text-right">Amount</th>
              <th className="px-4 py-2 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {open.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-xs text-muted-foreground">
                  No open invoices.
                </td>
              </tr>
            ) : (
              open.map((i) => (
                <tr key={i.id} className="border-t border-border">
                  <td className="px-4 py-2.5">{i.invoiceNo}</td>
                  <td className="px-4 py-2.5">{i.customer}</td>
                  <td className="px-4 py-2.5">{i.dueDate}</td>
                  <td className="px-4 py-2.5 text-right font-medium">{formatINR(i.amount)}</td>
                  <td className="px-4 py-2.5">{i.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function GST() {
  const invoices = useEntityAll("invoices");
  const data = invoices.data ?? [];
  const buckets = new Map<number, { taxable: number; tax: number }>();
  for (const i of data) {
    const b = buckets.get(i.gst) ?? { taxable: 0, tax: 0 };
    b.taxable += i.amount;
    b.tax += (i.amount * i.gst) / 100;
    buckets.set(i.gst, b);
  }
  const rows = Array.from(buckets.entries()).sort((a, b) => a[0] - b[0]);
  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-soft">
        <div className="border-b border-border px-5 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          GST summary
        </div>
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-2 text-left">Rate</th>
              <th className="px-4 py-2 text-right">Taxable Value</th>
              <th className="px-4 py-2 text-right">Tax</th>
              <th className="px-4 py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-xs text-muted-foreground">
                  No GST data.
                </td>
              </tr>
            ) : (
              rows.map(([rate, b]) => (
                <tr key={rate} className="border-t border-border">
                  <td className="px-4 py-2.5">{rate}%</td>
                  <td className="px-4 py-2.5 text-right">{formatINR(b.taxable)}</td>
                  <td className="px-4 py-2.5 text-right">{formatINR(b.tax)}</td>
                  <td className="px-4 py-2.5 text-right font-medium">{formatINR(b.taxable + b.tax)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
