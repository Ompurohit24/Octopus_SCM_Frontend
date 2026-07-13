import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Logo } from "@/components/octopus/Logo";
import { isAuthenticated } from "@/lib/workspace";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Octopus SCM — Freight Forwarding ERP" },
      {
        name: "description",
        content: "Premium freight forwarding ERP for global logistics teams.",
      },
    ],
  }),
  component: Splash,
});

const STEPS = [
  "Preparing workspace…",
  "Loading customers…",
  "Loading shipments…",
  "Connecting to database…",
];

function Splash() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  useEffect(() => {
    const intervals: ReturnType<typeof setTimeout>[] = [];
    STEPS.forEach((_, i) => {
      intervals.push(setTimeout(() => setStep(i), i * 600));
    });
    const goto = setTimeout(() => {
      navigate({ to: isAuthenticated() ? "/dashboard" : "/login" });
    }, 2800);
    return () => {
      intervals.forEach(clearTimeout);
      clearTimeout(goto);
    };
  }, [navigate]);

  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 size-[640px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand/5 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 size-[280px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-orange/10 blur-2xl" />
      </div>

      <div className="relative flex flex-col items-center gap-8 animate-fade-up">
        <div className="relative">
          <div className="absolute inset-0 grid place-items-center">
            <div className="size-24 rounded-full pulse-ring" />
          </div>
          <Logo size={96} />
        </div>

        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Octopus<span className="text-brand-orange">.</span>SCM
          </h1>
          <p className="mt-1 text-xs uppercase tracking-[0.22em] text-muted-foreground">
            Freight Forwarding ERP
          </p>
        </div>

        <div className="w-72 space-y-2.5">
          <div className="h-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-gradient-to-r from-brand to-brand-blue transition-all duration-500 ease-out"
              style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            />
          </div>
          <p className="text-center text-xs text-muted-foreground transition-opacity">
            {STEPS[step]}
          </p>
        </div>
      </div>

      <p className="absolute bottom-6 text-[11px] text-muted-foreground">
        v1.0.0 · © {new Date().getFullYear()} Octopus SCM
      </p>
    </main>
  );
}
