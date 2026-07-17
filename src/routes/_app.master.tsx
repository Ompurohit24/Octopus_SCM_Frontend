import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { ModulePage } from "@/components/octopus/ModulePage";
import { customersConfig, vendorsConfig } from "@/lib/entities";

type Tab =
  | "Customers"
  | "Vendors"
  | "Shipping Lines"
  | "Ports"
  | "Containers"
  | "HS Codes";

const TABS: Tab[] = [
  "Customers",
  "Vendors",
];

export const Route = createFileRoute("/_app/master")({
  head: () => ({ meta: [{ title: "Master — Octopus SCM" }] }),
  validateSearch: (search: Record<string, unknown>) => ({
    tab: (search.tab as Tab) ?? undefined,
  }),
  component: MasterRoute,
});

function MasterRoute() {
  const navigate = useNavigate();
  const { tab } = useSearch({ from: "/_app/master" });

  const [active, setActive] = useState<Tab>(tab ?? "Customers");

  function go(t: Tab) {
    setActive(t);
    navigate({ to: "/master", search: { tab: t } });
  }

  return (
    <div className="space-y-2 p-6 pb-0 lg:p-8 lg:pb-0">
      <div className="-mt-1 flex items-center gap-1 border-b border-border">
        {TABS.map((t) => {
          const isActive = t === active;

          return (
            <button
              key={t}
              onClick={() => go(t)}
              className={`relative px-3 py-2 text-xs font-medium transition-colors ${
                isActive
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t}
              {isActive && (
                <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand" />
              )}
            </button>
          );
        })}
      </div>

      <div className="-mx-6 lg:-mx-8">
        <ModulePage
          module="Master"
          config={
            active === "Customers"
              ? customersConfig
              : vendorsConfig
          }
        />
      </div>
    </div>
  );
}