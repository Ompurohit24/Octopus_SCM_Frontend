import { createFileRoute } from "@tanstack/react-router";
import {
  Ship,
  Globe2,
  Users,
  Target,
  Award,
  TrendingUp,
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Twitter,
  Github,
} from "lucide-react";

export const Route = createFileRoute("/_app/about")({
  head: () => ({ meta: [{ title: "About — Octopus SCM" }] }),
  component: About,
});

const STATS = [
  { label: "Shipments / year", value: "180K+", icon: Ship },
  { label: "Countries served", value: "92", icon: Globe2 },
  { label: "Enterprise clients", value: "1,400+", icon: Users },
  { label: "On-time delivery", value: "99.4%", icon: TrendingUp },
];

const VALUES = [
  {
    icon: Target,
    title: "Precision at scale",
    desc: "Every shipment, document and invoice is tracked to the minute — across branches, carriers and currencies.",
  },
  {
    icon: Award,
    title: "Built for compliance",
    desc: "GST, customs, EDI and audit trails baked into the workflow — not bolted on as an afterthought.",
  },
  {
    icon: Users,
    title: "Customer obsessed",
    desc: "Designed with forwarders, CHAs and finance teams in 14 countries — the workflows match how you already operate.",
  },
];

const TEAM = [
  { name: "Aarav Kapoor", role: "Chief Executive Officer", initials: "AK" },
  { name: "Priya Mehta", role: "Chief Operating Officer", initials: "PM" },
  { name: "Rohan Iyer", role: "VP, Engineering", initials: "RI" },
  { name: "Sara Khan", role: "Head of Customer Success", initials: "SK" },
];

const MILESTONES = [
  { year: "2018", title: "Founded in Mumbai", desc: "Started with one mission: replace spreadsheets for freight forwarders." },
  { year: "2020", title: "100 customers", desc: "Crossed 100 enterprise customers across India and the UAE." },
  { year: "2022", title: "Global expansion", desc: "Opened operations across Singapore, Rotterdam and Houston." },
  { year: "2024", title: "AI Automation", desc: "Launched rule-based automation and document AI across the suite." },
  { year: "2026", title: "Octopus SCM 4.0", desc: "Unified Master, Operations, Finance and Compliance in one workspace." },
];

function About() {
  return (
    <div className="space-y-8 p-6 lg:p-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">About</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">About Octopus SCM</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Octopus SCM is the operating system for modern freight forwarders. We bring together
          shipments, customs, transport, finance and compliance into a single, beautifully designed
          workspace — so your team can move cargo faster, with less paperwork and zero surprises.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {STATS.map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-border bg-card p-4 shadow-soft"
          >
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                {s.label}
              </p>
              <s.icon className="size-4 text-brand" />
            </div>
            <p className="mt-3 text-2xl font-semibold tracking-tight">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-soft">
        <div className="grid gap-0 md:grid-cols-2">
          <div className="border-b border-border p-6 md:border-b-0 md:border-r">
            <p className="text-[11px] font-medium uppercase tracking-wider text-brand">Our mission</p>
            <h2 className="mt-2 text-lg font-semibold tracking-tight">
              Move global trade forward, one shipment at a time.
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              We believe freight forwarding deserves software that is as fast, reliable and elegant
              as the businesses that depend on it. Octopus SCM is built end-to-end for the people
              who actually run operations — not just executives reading reports.
            </p>
          </div>
          <div className="p-6">
            <p className="text-[11px] font-medium uppercase tracking-wider text-brand">Our vision</p>
            <h2 className="mt-2 text-lg font-semibold tracking-tight">
              A single source of truth for every cargo movement on earth.
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              From the smallest CHA to a multi-branch global forwarder — every team, on every
              continent, working from the same connected data, with automation handling the
              repetitive work.
            </p>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold tracking-tight">What we stand for</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {VALUES.map((v) => (
            <div key={v.title} className="rounded-xl border border-border bg-card p-5 shadow-soft">
              <div className="grid size-10 place-items-center rounded-lg bg-accent text-brand">
                <v.icon className="size-5" />
              </div>
              <h3 className="mt-4 text-sm font-semibold tracking-tight">{v.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{v.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-soft">
        <div className="border-b border-border px-5 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Our journey
        </div>
        <ol className="divide-y divide-border">
          {MILESTONES.map((m) => (
            <li key={m.year} className="flex items-start gap-5 px-5 py-4">
              <div className="w-16 shrink-0 text-sm font-semibold text-brand">{m.year}</div>
              <div className="min-w-0">
                <p className="text-sm font-semibold tracking-tight">{m.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{m.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div>
        <h2 className="text-sm font-semibold tracking-tight">Leadership</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {TEAM.map((p) => (
            <div key={p.name} className="rounded-xl border border-border bg-card p-5 shadow-soft">
              <div className="grid size-12 place-items-center rounded-full bg-gradient-to-br from-brand to-brand-blue text-sm font-semibold text-white">
                {p.initials}
              </div>
              <p className="mt-4 text-sm font-semibold tracking-tight">{p.name}</p>
              <p className="text-xs text-muted-foreground">{p.role}</p>
              <div className="mt-3 flex gap-2 text-muted-foreground">
                <Linkedin className="size-3.5 hover:text-brand" />
                <Twitter className="size-3.5 hover:text-brand" />
                <Github className="size-3.5 hover:text-brand" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
          <Mail className="size-4 text-brand" />
          <p className="mt-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Email
          </p>
          <a href="mailto:hello@octopus.scm" className="mt-1 block text-sm font-semibold hover:text-brand">
            hello@octopus.scm
          </a>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
          <Phone className="size-4 text-brand" />
          <p className="mt-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Phone
          </p>
          <a href="tel:+912240000000" className="mt-1 block text-sm font-semibold hover:text-brand">
            +91 22 4000 0000
          </a>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
          <MapPin className="size-4 text-brand" />
          <p className="mt-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Headquarters
          </p>
          <p className="mt-1 text-sm font-semibold">
            Lower Parel, Mumbai 400013, India
          </p>
        </div>
      </div>

      <p className="pt-2 text-center text-[11px] text-muted-foreground">
        © {new Date().getFullYear()} Octopus SCM. Crafted with care for global trade teams.
      </p>
    </div>
  );
}
