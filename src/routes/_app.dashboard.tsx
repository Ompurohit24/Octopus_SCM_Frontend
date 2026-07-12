import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useEntityAll } from "@/lib/api/hooks";
import { useWorkspace } from "@/lib/workspace";
import {
  Package,
  Ship,
  FileCheck2,
  Container,
  Anchor,
  Clock4,
  Receipt,
  Wallet,
  TrendingUp,
  CircleDollarSign,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Logo } from "@/components/octopus/Logo";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Octopus SCM" },
      { name: "description", content: "Operations overview, shipments, finance and timelines." },
    ],
  }),
  component: Dashboard,
});

const stats = [
  { label: "Today's Bookings", value: "42", delta: "+12%", up: true, icon: Package },
  { label: "Active Jobs", value: "318", delta: "+4.2%", up: true, icon: Ship },
  { label: "Pending Customs", value: "27", delta: "-8%", up: false, icon: FileCheck2 },
  { label: "Containers Ready", value: "64", delta: "+6", up: true, icon: Container },
  { label: "Vessels Departed", value: "18", delta: "Today", up: true, icon: Anchor },
  { label: "ETA Today", value: "9", delta: "Live", up: true, icon: Clock4 },
  { label: "Invoices Pending", value: "₹48.2L", delta: "32 inv.", up: false, icon: Receipt },
  { label: "Outstanding", value: "₹1.24Cr", delta: "-2.1%", up: false, icon: Wallet },
];

const revenue = [
  { m: "Apr", rev: 82, prof: 22 },
  { m: "May", rev: 94, prof: 28 },
  { m: "Jun", rev: 88, prof: 25 },
  { m: "Jul", rev: 110, prof: 34 },
  { m: "Aug", rev: 124, prof: 39 },
  { m: "Sep", rev: 118, prof: 36 },
  { m: "Oct", rev: 142, prof: 48 },
  { m: "Nov", rev: 156, prof: 54 },
];

const lanes = [
  { name: "Nhava Sheva", v: 124 },
  { name: "Mundra", v: 98 },
  { name: "Chennai", v: 86 },
  { name: "Kolkata", v: 64 },
  { name: "Cochin", v: 42 },
];

const mix = [
  { name: "FCL", value: 58, color: "var(--color-chart-1)" },
  { name: "LCL", value: 22, color: "var(--color-chart-2)" },
  { name: "Air", value: 14, color: "var(--color-chart-3)" },
  { name: "Road", value: 6, color: "var(--color-chart-4)" },
];

const timeline = [
  { code: "JOB-24819", title: "MSC ARUSHI · 40' HC × 4", status: "At Sea", time: "12 min ago", tone: "blue" },
  { code: "JOB-24811", title: "Customs cleared at Nhava Sheva", status: "Cleared", time: "1 h ago", tone: "green" },
  { code: "JOB-24802", title: "BL #BL-90021 issued — Maersk", status: "Documented", time: "3 h ago", tone: "blue" },
  { code: "JOB-24788", title: "Container loaded — ICD Tughlakabad", status: "Loaded", time: "5 h ago", tone: "amber" },
  { code: "JOB-24772", title: "Invoice INV-1042 generated · ₹3.42L", status: "Invoiced", time: "8 h ago", tone: "green" },
];

const eta = [
  { day: "Tue 02", vessel: "MSC Arushi", port: "JNPT", count: 4 },
  { day: "Wed 03", vessel: "Maersk Helsinki", port: "Mundra", count: 2 },
  { day: "Thu 04", vessel: "OOCL Singapore", port: "Chennai", count: 6 },
  { day: "Fri 05", vessel: "CMA CGM Marco", port: "JNPT", count: 3 },
];

function Dashboard() {
  const navigate = useNavigate();
  const ws = useWorkspace();
  const [timeframe, setTimeframe] = useState<"Today" | "7 days" | "30 days">("30 days");

  const customers = useEntityAll("customers");
  const importJobs = useEntityAll("importJobs");
  const exportJobs = useEntityAll("exportJobs");
  const invoices = useEntityAll("invoices");
  const trips = useEntityAll("trips");

  const liveStats = useMemo(() => {
    const imp = importJobs.data ?? [];
    const exp = exportJobs.data ?? [];
    const inv = invoices.data ?? [];
    const allJobs = [...imp, ...exp];
    const customsPending = imp.filter((j) => j.status === "Customs").length;
    const containersReady = (trips.data ?? []).filter(
      (t) => t.status === "Loading" || t.status === "Planned",
    ).length;
    const vesselsDeparted = exp.filter((j) => j.status === "Sailed").length;
    const todayKey = new Date().toISOString().slice(0, 10);
    const etaToday = imp.filter((j) => (j.eta ?? "") <= todayKey).length;
    const pendingInv = inv.filter((i) => i.status !== "Paid").length;
    const outstanding = inv
      .filter((i) => i.status !== "Paid")
      .reduce((s, i) => s + i.amount, 0);
    return [
      { label: "Today's Bookings", value: String(allJobs.filter((j) => j.status === "Booking").length), delta: `${customers.data?.length ?? 0} cust.`, up: true, icon: Package },
      { label: "Active Jobs", value: String(allJobs.filter((j) => j.status !== "Closed").length), delta: `${imp.length}+${exp.length}`, up: true, icon: Ship },
      { label: "Pending Customs", value: String(customsPending), delta: customsPending > 0 ? "Action" : "Clear", up: customsPending === 0, icon: FileCheck2 },
      { label: "Containers Ready", value: String(containersReady), delta: "Live", up: true, icon: Container },
      { label: "Vessels Departed", value: String(vesselsDeparted), delta: "Today", up: true, icon: Anchor },
      { label: "ETA Today", value: String(etaToday), delta: "Live", up: true, icon: Clock4 },
      { label: "Invoices Pending", value: String(pendingInv), delta: `${inv.length} total`, up: false, icon: Receipt },
      { label: "Outstanding", value: outstanding >= 100000 ? `₹${(outstanding / 100000).toFixed(1)}L` : `₹${outstanding.toLocaleString("en-IN")}`, delta: "Open", up: false, icon: Wallet },
    ];
  }, [customers.data, importJobs.data, exportJobs.data, invoices.data, trips.data]);

  return (
    <div className="relative">
      {/* watermark */}
      <div className="pointer-events-none absolute right-12 top-24 opacity-[0.04]">
        <Logo size={420} />
      </div>

      <div className="relative space-y-6 p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Operations · {ws.branch}
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
              Good morning, {ws.user?.name?.split(" ")[0] ?? "Aarav"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Here's what's moving across your shipments today.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {(["Today", "7 days", "30 days"] as const).map((label) => {
              const active = timeframe === label;
              return (
                <button
                  key={label}
                  onClick={() => setTimeframe(label)}
                  className={
                    active
                      ? "rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
                      : "rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-accent"
                  }
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Stat grid */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {liveStats.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.label}
                className="group rounded-xl border border-border bg-card p-4 shadow-soft transition hover:shadow-card"
              >
                <div className="flex items-center justify-between">
                  <div className="grid size-9 place-items-center rounded-lg bg-accent text-brand">
                    <Icon className="size-4" strokeWidth={1.75} />
                  </div>
                  <span
                    className={`inline-flex items-center gap-0.5 text-[11px] font-medium ${
                      s.up ? "text-success" : "text-destructive"
                    }`}
                  >
                    {s.up ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                    {s.delta}
                  </span>
                </div>
                <p className="mt-4 text-2xl font-semibold tracking-tight">{s.value}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{s.label}</p>
              </div>
            );
          })}
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-5 shadow-soft lg:col-span-2">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Revenue vs Profit
                </p>
                <h3 className="mt-1 flex items-baseline gap-2 text-xl font-semibold tracking-tight">
                  ₹1.56 Cr
                  <span className="inline-flex items-center gap-0.5 text-xs font-medium text-success">
                    <TrendingUp className="size-3" /> +18.4%
                  </span>
                </h3>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-[var(--color-chart-1)]" /> Revenue
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-[var(--color-chart-2)]" /> Profit
                </span>
              </div>
            </div>
            <div className="mt-5 h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenue} margin={{ top: 5, right: 8, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="r1" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="r2" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-chart-2)" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="var(--color-chart-2)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="m" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-card)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 10,
                      fontSize: 12,
                    }}
                  />
                  <Area type="monotone" dataKey="rev" stroke="var(--color-chart-1)" strokeWidth={2} fill="url(#r1)" />
                  <Area type="monotone" dataKey="prof" stroke="var(--color-chart-2)" strokeWidth={2} fill="url(#r2)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Shipment Mix</p>
            <h3 className="mt-1 text-xl font-semibold tracking-tight">432 active</h3>
            <div className="mt-2 grid grid-cols-2 items-center">
              <div className="h-[180px]">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={mix} dataKey="value" innerRadius={42} outerRadius={68} stroke="none" paddingAngle={2}>
                      {mix.map((d) => (
                        <Cell key={d.name} fill={d.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="space-y-2 text-xs">
                {mix.map((m) => (
                  <li key={m.name} className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 text-foreground">
                      <span className="size-2 rounded-full" style={{ background: m.color }} />
                      {m.name}
                    </span>
                    <span className="font-medium text-muted-foreground">{m.value}%</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Top Lanes</p>
              <CircleDollarSign className="size-4 text-muted-foreground" />
            </div>
            <div className="mt-4 h-[200px]">
              <ResponsiveContainer>
                <BarChart data={lanes} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 10, fontSize: 12 }} />
                  <Bar dataKey="v" fill="var(--color-chart-1)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Shipment Timeline */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Shipment Timeline
              </p>
              <button onClick={() => navigate({ to: "/import" })} className="text-[11px] font-medium text-brand hover:underline">View all</button>
            </div>
            <ol className="mt-4 space-y-3.5">
              {timeline.map((t, i) => (
                <li key={t.code} className="flex gap-3">
                  <div className="relative flex flex-col items-center">
                    <span
                      className={`mt-1 size-2 rounded-full ${
                        t.tone === "green"
                          ? "bg-success"
                          : t.tone === "amber"
                            ? "bg-brand-orange"
                            : "bg-brand-blue"
                      }`}
                    />
                    {i < timeline.length - 1 && <span className="mt-1 h-full w-px bg-border" />}
                  </div>
                  <div className="min-w-0 flex-1 pb-2">
                    <p className="truncate text-sm font-medium">{t.title}</p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <span className="font-mono">{t.code}</span> · {t.status} · {t.time}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* Upcoming ETA */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Upcoming ETA</p>
              <button onClick={() => navigate({ to: "/import" })} className="text-[11px] font-medium text-brand hover:underline">Calendar</button>
            </div>
            <ul className="mt-4 space-y-2.5">
              {eta.map((e) => (
                <li
                  key={e.day}
                  className="flex items-center justify-between rounded-lg border border-border/70 bg-background/40 p-3 hover:bg-accent/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="grid size-10 place-items-center rounded-lg bg-accent text-[11px] font-semibold uppercase tracking-wider text-brand">
                      {e.day.split(" ")[0]}
                      <span className="sr-only">{e.day}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{e.vessel}</p>
                      <p className="text-[11px] text-muted-foreground">{e.port} · {e.count} containers</p>
                    </div>
                  </div>
                  <button onClick={() => navigate({ to: "/import" })} className="rounded-md border border-border px-2 py-1 text-[11px] font-medium hover:bg-accent">
                    Track
                  </button>
                </li>
              ))}
            </ul>

            <div className="mt-4 flex items-center gap-3 rounded-lg bg-accent/60 p-3 text-xs">
              <CheckCircle2 className="size-4 shrink-0 text-success" />
              <p className="text-foreground/80">
                All systems normal. <span className="text-muted-foreground">Last sync 2 min ago.</span>
              </p>
            </div>
          </div>
        </div>

        {/* Alerts strip */}
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-soft">
          <div className="inline-flex items-center gap-2 rounded-full bg-warning/15 px-2.5 py-1 text-[11px] font-medium text-warning-foreground">
            <AlertCircle className="size-3.5" /> 3 invoices overdue
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-accent px-2.5 py-1 text-[11px] font-medium text-foreground/80">
            ETA changed · MSC Arushi delayed 6h
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-accent px-2.5 py-1 text-[11px] font-medium text-foreground/80">
            12 customs filings ready for submission
          </div>
        </div>
      </div>
    </div>
  );
}
