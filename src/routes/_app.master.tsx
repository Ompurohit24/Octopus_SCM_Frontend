import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { ModulePage } from "@/components/octopus/ModulePage";
import {
  customersConfig,
  vendorsConfig,
  pubOperationsConfig,
  importOperationsConfig,
} from "@/lib/entities";

type Tab =
  | "Customers"
  | "Vendors"
  | "Operations"
  | "Shipping Lines"
  | "Ports"
  | "Containers"
  | "HS Codes";

type OperationMenu =
  | "Pub Operations"
  | "Import Operations"
  | null;

const TABS: Tab[] = [
  "Customers",
  "Vendors",
  "Operations",
];

export const Route = createFileRoute("/_app/master")({
  head: () => ({
    meta: [{ title: "Master — Octopus SCM" }],
  }),

  validateSearch: (search: Record<string, unknown>) => ({
    tab: (search.tab as Tab) ?? undefined,
  }),

  component: MasterRoute,
});

function MasterRoute() {
  const navigate = useNavigate();
  const { tab } = useSearch({ from: "/_app/master" });

  const [active, setActive] = useState<Tab>(
    tab ?? "Customers",
  );

  const [operationMenu, setOperationMenu] =
    useState<OperationMenu>(null);

  function go(t: Tab) {
    setActive(t);

    // Reset Operations sub-page when switching Master tabs.
    setOperationMenu(null);

    navigate({
      to: "/master",
      search: { tab: t },
    });
  }

  return (
    <div className="space-y-2 p-6 pb-0 lg:p-8 lg:pb-0">
      {/* Master tabs */}
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
        {/* Customers */}
        {active === "Customers" && (
          <ModulePage
            module="Master"
            config={customersConfig}
          />
        )}

        {/* Vendors */}
        {active === "Vendors" && (
          <ModulePage
            module="Master"
            config={vendorsConfig}
          />
        )}

        {/* Operations */}
        {active === "Operations" && (
          <OperationsMenu
            selected={operationMenu}
            onSelect={setOperationMenu}
          />
        )}
      </div>
    </div>
  );
}

function OperationsMenu({
  selected,
  onSelect,
}: {
  selected: OperationMenu;
  onSelect: (value: OperationMenu) => void;
}) {
  // ---------------- Pub Operations ----------------

  if (selected === "Pub Operations") {
    return (
      <div>
        <div className="px-6 pt-5 lg:px-8">
          <button
            type="button"
            onClick={() => onSelect(null)}
            className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            ← Back to Operations
          </button>
        </div>

        <ModulePage
          module="Master"
          config={pubOperationsConfig}
        />
      </div>
    );
  }

  // ---------------- Import Operations ----------------

  if (selected === "Import Operations") {
    return (
      <div>
        <div className="px-6 pt-5 lg:px-8">
          <button
            type="button"
            onClick={() => onSelect(null)}
            className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            ← Back to Operations
          </button>
        </div>

        <ModulePage
          module="Master"
          config={importOperationsConfig}
        />
      </div>
    );
  }

  // ---------------- Operations Landing ----------------

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Operations
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Select the operation master you want to manage.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => onSelect("Pub Operations")}
          className="min-w-48 rounded-lg border border-border bg-card px-6 py-4 text-left shadow-soft transition-colors hover:bg-accent"
        >
          <div className="text-sm font-semibold">
            Pub Operations
          </div>

          <div className="mt-1 text-xs text-muted-foreground">
            Manage Pub Operations contacts
          </div>
        </button>

        <button
          type="button"
          onClick={() => onSelect("Import Operations")}
          className="min-w-48 rounded-lg border border-border bg-card px-6 py-4 text-left shadow-soft transition-colors hover:bg-accent"
        >
          <div className="text-sm font-semibold">
            Import Operations
          </div>

          <div className="mt-1 text-xs text-muted-foreground">
            Manage Import Operations contacts
          </div>
        </button>
      </div>
    </div>
  );
}