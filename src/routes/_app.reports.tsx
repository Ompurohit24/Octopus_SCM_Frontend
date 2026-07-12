import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, FileText, Download } from "lucide-react";
import { useEntityAll, useCreateEntity } from "@/lib/api/hooks";
import { downloadCSV, toCSV, formatDate } from "@/lib/csv";
import { toast } from "sonner";
import type { EntityKey } from "@/lib/api/types";
import { apiClient } from "@/lib/api/storage";

export const Route = createFileRoute("/_app/reports")({
  head: () => ({ meta: [{ title: "Reports — Octopus SCM" }] }),
  component: Reports,
});

interface ReportDef {
  name: string;
  desc: string;
  metrics: number;
  source: EntityKey;
}

const REPORTS: ReportDef[] = [
  { name: "Shipment Performance", desc: "On-time delivery, dwell time, transit performance by lane.", metrics: 32, source: "importJobs" },
  { name: "Revenue & Profit", desc: "Branch-wise P&L with FX adjustments and customer mix.", metrics: 18, source: "invoices" },
  { name: "Customer Outstanding", desc: "Aging buckets, credit utilization and collection forecast.", metrics: 11, source: "invoices" },
  { name: "Vendor Spend", desc: "Carrier, CHA and trucker spend with variance vs budget.", metrics: 9, source: "vendorBills" },
  { name: "Container Utilization", desc: "FCL/LCL mix, idle days, demurrage and detention exposure.", metrics: 14, source: "containers" },
  { name: "Customs Compliance", desc: "Shipping bills, bills of entry, duty paid and pending filings.", metrics: 21, source: "exportJobs" },
];

function Reports() {
  const runs = useEntityAll("reportRuns");
  const createRun = useCreateEntity("reportRuns", "Report");

  async function runReport(r: ReportDef, format: "PDF" | "XLSX" | "CSV" = "CSV") {
    const list = await apiClient.list(r.source, { pageSize: 1000 });
    const rows = list.rows as unknown as Record<string, unknown>[];
    const filename = `${r.name.toLowerCase().replace(/\s+/g, "-")}.csv`;
    downloadCSV(filename, toCSV(rows));
    await createRun.mutateAsync({
      report: r.name,
      range: "Custom",
      generatedBy: "Aarav Kapoor",
      format,
    });
    toast.success(`${r.name} generated`);
  }

  async function downloadAll() {
    for (const r of REPORTS) {
      const list = await apiClient.list(r.source, { pageSize: 1000 });
      downloadCSV(
        `${r.name.toLowerCase().replace(/\s+/g, "-")}.csv`,
        toCSV(list.rows as unknown as Record<string, unknown>[]),
      );
    }
    toast.success("All reports downloaded");
  }

  const runRows = (runs.data ?? []).slice(0, 10);

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Reports
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Analytics & Reports</h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Interactive, filterable reports with Excel, PDF and print exports.
          </p>
        </div>
        <button
          onClick={downloadAll}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
        >
          <Download className="size-3.5" /> Download all (XLSX)
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {REPORTS.map((r) => (
          <button
            key={r.name}
            onClick={() => runReport(r)}
            className="group cursor-pointer rounded-xl border border-border bg-card p-5 text-left shadow-soft transition hover:-translate-y-0.5 hover:shadow-card"
          >
            <div className="flex items-center justify-between">
              <div className="grid size-9 place-items-center rounded-lg bg-accent text-brand">
                <BarChart3 className="size-4" />
              </div>
              <span className="text-[11px] text-muted-foreground">{r.metrics} metrics</span>
            </div>
            <h3 className="mt-4 text-sm font-semibold tracking-tight">{r.name}</h3>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{r.desc}</p>
            <div className="mt-4 flex items-center gap-2 text-[11px] text-brand opacity-0 transition-opacity group-hover:opacity-100">
              <FileText className="size-3" /> Generate report →
            </div>
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-soft">
        <div className="border-b border-border px-5 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Recently generated
        </div>
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-2 text-left">Report</th>
              <th className="px-4 py-2 text-left">Range</th>
              <th className="px-4 py-2 text-left">Generated by</th>
              <th className="px-4 py-2 text-left">Created</th>
              <th className="px-4 py-2 text-left">Format</th>
            </tr>
          </thead>
          <tbody>
            {runRows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-xs text-muted-foreground">
                  Generate a report above to see history.
                </td>
              </tr>
            ) : (
              runRows.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="px-4 py-2.5">{r.report}</td>
                  <td className="px-4 py-2.5">{r.range}</td>
                  <td className="px-4 py-2.5">{r.generatedBy}</td>
                  <td className="px-4 py-2.5">{formatDate(r.createdAt)}</td>
                  <td className="px-4 py-2.5">{r.format}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
