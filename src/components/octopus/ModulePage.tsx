import { Link } from "@tanstack/react-router";
import {
  Search,
  SlidersHorizontal,
  FileDown,
  FileUp,
  Plus,
  MoreHorizontal,
  ArrowUpDown,
  Pencil,
  Trash2,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
// import { useQuery } from "@tanstack/react-query"; 

import { apiClient } from "@/lib/api/storage";
import {
  useEntityList,
  useCreateEntity,
  useUpdateEntity,
  useDeleteEntity,
  useBulkDelete,
  useBulkCreate,
  useNextCustomerCode,
  useNextVendorCode,
  useNextImportJobNumber,
} from "@/lib/api/hooks";
import type { EntityKey, EntityMap, ID } from "@/lib/api/types";
import type { EntityConfig } from "@/lib/entities";
import { EntityFormDialog, ConfirmDialog } from "./EntityFormDialog";
import { downloadCSV, pickAndReadCSV, toCSV } from "@/lib/csv";
import { toast } from "sonner";

import {
  getPendingRegistrations,
  removePendingRegistration,
} from "@/lib/pendingRegistration";



// ---------- Pill (kept for back-compat) ----------
export function Pill({
  tone = "default",
  children,
}: {
  tone?: "default" | "blue" | "green" | "amber" | "red";
  children: ReactNode;
}) {
  const tones: Record<string, string> = {
    default: "bg-accent text-foreground/80",
    blue: "bg-brand/10 text-brand",
    green: "bg-success/15 text-success",
    amber: "bg-warning/15 text-[oklch(0.45_0.12_75)] dark:text-warning",
    red: "bg-destructive/12 text-destructive",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

// ---------- Legacy props (static rows) — kept for Reports ----------
interface LegacyProps {
  module: string;
  title: string;
  description: string;
  columns: string[];
  rows: Array<Record<string, ReactNode>>;
  Icon?: unknown;
  tabs?: string[];
  activeTab?: string;
}

// ---------- New CRUD props ----------
interface CrudProps<K extends EntityKey> {
  module: string;
  title?: string;
  description?: string;
  config: EntityConfig<K>;
  extraHeaderActions?: ReactNode;

  /** Additional entries appended to the Export dropdown. */
  extraExports?: { label: string; handler: () => void | Promise<void> }[];

  /** Hide the default export entry and use only extraExports. */
  hideDefaultExport?: boolean;

  tabs?: never;
  activeTab?: never;
}

type Props<K extends EntityKey> = LegacyProps | CrudProps<K>;

function isCrud<K extends EntityKey>(p: Props<K>): p is CrudProps<K> {
  return "config" in p && !!(p as CrudProps<K>).config;
}

export function ModulePage<K extends EntityKey>(props: Props<K>) {
  if (isCrud(props)) return <CrudModulePage {...props} />;
  return <LegacyModulePage {...(props as LegacyProps)} />;
}

// =========== Legacy static page (Reports etc.) ===========
function LegacyModulePage({
  module,
  title,
  description,
  columns,
  rows,
  tabs,
  activeTab,
}: LegacyProps) {
  const [activeTabState, setActiveTabState] = useState(activeTab);
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    if (!query) return rows;
    const q = query.toLowerCase();
    return rows.filter((r) =>
      Object.values(r).some((v) => String(v ?? "").toLowerCase().includes(q)),
    );
  }, [rows, query]);

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <HeaderBar
        module={module}
        title={title}
        description={description}
        onImport={() => toast.info("Connect a backend to import.")}
        onExport={() =>
          downloadCSV(
            `${title.toLowerCase().replace(/\s+/g, "-")}.csv`,
            toCSV(rows.map((r) => Object.fromEntries(columns.map((c) => [c, String(r[c] ?? "")])))),
          )
        }
        onNew={() => toast.info("Read-only view.")}
      />

      {tabs && (
        <div className="-mt-1 flex items-center gap-1 border-b border-border">
          {tabs.map((t) => {
            const active = t === activeTabState;
            return (
              <button
                key={t}
                onClick={() => setActiveTabState(t)}
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
      )}

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-soft">
        <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${title.toLowerCase()}…`}
              className="h-8 w-64 rounded-md border border-border bg-background pl-8 pr-3 text-xs outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
            />
          </div>
          <button className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground/80 hover:bg-accent">
            <SlidersHorizontal className="size-3.5" /> Filter
          </button>
          <button className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground/80 hover:bg-accent">
            <ArrowUpDown className="size-3.5" /> Sort
          </button>
          <span className="ml-auto text-xs text-muted-foreground">
            Showing <span className="font-medium text-foreground">{filtered.length}</span> of {rows.length}
          </span>
        </div>

        <div className="scrollbar-thin overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="w-10 px-3 py-2.5 text-left">
                  <input
                    type="checkbox"
                    className="size-3.5 rounded border-border accent-brand"
                  />
                </th>
                {columns.map((c) => (
                  <th key={c} className="px-3 py-2.5 text-left font-medium">
                    {c}
                  </th>
                ))}
                <th className="w-10 px-3 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, i) => (
                <tr
                  key={i}
                  className="border-t border-border transition-colors hover:bg-accent/40"
                >
                  <td className="px-3 py-3">
                    <input
                      type="checkbox"
                      className="size-3.5 rounded border-border accent-brand"
                    />
                  </td>
                  {columns.map((c) => (
                    <td key={c} className="px-3 py-3 text-foreground/90">
                      {row[c]}
                    </td>
                  ))}
                  <td className="px-3 py-3 text-right">
                    <button className="rounded p-1 text-muted-foreground hover:bg-accent">
                      <MoreHorizontal className="size-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-border px-4 py-2.5 text-xs text-muted-foreground">
          <span>Page 1 of 1</span>
          <div className="flex items-center gap-1">
            <button className="rounded-md border border-border bg-background px-2.5 py-1 hover:bg-accent">
              Prev
            </button>
            <button className="rounded-md border border-border bg-background px-2.5 py-1 hover:bg-accent">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// =========== Crud page (data driven) ===========
function HeaderBar({
  module,
  title,
  description,
  onImport,
  onExport,
  exportLabel = "Export",
  extraExports,
  hideDefaultExport = false,
  onNew,
  newLabel = "New",
  extraActions,
}: {
  module: string;
  title: string;
  description: string;
  onImport: () => void;
  onExport: () => void;
  exportLabel?: string;
  extraExports?: { label: string; handler: () => void | Promise<void> }[];
  hideDefaultExport?: boolean;
  onNew: () => void;
  newLabel?: string;
  extraActions?: ReactNode;
}) {
  const [openExport, setOpenExport] = useState(false);
  const exportRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!openExport) return;
    const onDoc = (e: MouseEvent) => {
      if (!exportRef.current?.contains(e.target as Node)) setOpenExport(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [openExport]);
  const hasExtras = !!extraExports && extraExports.length > 0;

  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Link to="/dashboard" className="hover:text-foreground">
            Workspace
          </Link>
          <span>/</span>
          <span className="text-foreground">{module}</span>
        </nav>
        <h1 className="mt-1.5 text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-1 max-w-xl text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={onImport}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-accent"
        >
          <FileUp className="size-3.5" /> Import
        </button>
        {hasExtras ? (
          <div ref={exportRef} className="relative">
            <button
              onClick={() => setOpenExport((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-accent"
            >
              <FileDown className="size-3.5" /> Export
              <span className="ml-0.5 text-muted-foreground">▾</span>
            </button>
            {openExport && (
              <div className="absolute right-0 z-20 mt-1 w-56 overflow-hidden rounded-lg border border-border bg-card shadow-elevated">
                {/* <button
                  onClick={() => {
                    setOpenExport(false);
                    onExport();
                  }}
                  className="block w-full px-3 py-2 text-left text-xs font-medium hover:bg-accent"
                >
                  {exportLabel}
                </button> */}
              {!hideDefaultExport && (
  <button
    onClick={() => {
      setOpenExport(false);
      onExport();
    }}
    className="block w-full px-3 py-2 text-left text-xs font-medium hover:bg-accent"
  >
    {exportLabel}
  </button>
)}

                {extraExports!.map((opt) => (
                  <button
                    key={opt.label}
                    onClick={() => {
                      setOpenExport(false);
                      void opt.handler();
                    }}
                    className={`block w-full px-3 py-2 text-left text-xs font-medium hover:bg-accent ${
  !hideDefaultExport ? "border-t border-border" : ""
}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={onExport}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-accent"
          >
            <FileDown className="size-3.5" /> Export
          </button>
        )}
        <button
          onClick={onNew}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-soft hover:opacity-95"
        >
          <Plus className="size-3.5" /> {newLabel}
        </button>
        {extraActions}
      </div>
    </div>
  );
}

function nextCode(prefix: string, pad: number, existing: string[]): string {
  let max = 0;
  for (const c of existing) {
    const m = c.match(new RegExp(`^${prefix}(\\d+)`));
    if (m) max = Math.max(max, Number(m[1]));
  }
  return `${prefix}${String(max + 1).padStart(pad, "0")}`;
}


type PendingVerificationItem = {
  registrationId: string;

  entityType:
    | "customer"
    | "vendor";

  entityName: string;

  expiresAt: string;

  verificationFields: {
    key: string;
    label: string;
    email: string;
    verified: boolean;
  }[];
};

function CrudModulePage<K extends EntityKey>({
  module,
  title,
  description,
  config,
  extraHeaderActions,
  extraExports,
  hideDefaultExport,
}: CrudProps<K>) {
  const heading = title ?? config.plural;
  const desc = description ?? config.description;

  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<string | undefined>();
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [tab, setTab] = useState<string>(config.tabs?.[0]?.value ?? "all");
  const [selected, setSelected] = useState<Set<ID>>(new Set());
  const [openMenu, setOpenMenu] = useState<ID | null>(null);
  const [showFilter, setShowFilter] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [createDefaults, setCreateDefaults] =
  useState<Partial<EntityMap[K]>>();
  const [editRow, setEditRow] = useState<EntityMap[K] | null>(null);
  const [deleteRow, setDeleteRow] = useState<EntityMap[K] | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

 const [
  pendingVerificationItems,
  setPendingVerificationItems,
] = useState<
  PendingVerificationItem[]
>([]);

const [
  pendingListOpen,
  setPendingListOpen,
] = useState(false);


const [
  selectedPendingRegistrationId,
  setSelectedPendingRegistrationId,
] = useState<string | null>(null);

const [
  deleteBlockedOpen,
  setDeleteBlockedOpen,
] = useState(false);

const [
  deleteBlockedTitle,
  setDeleteBlockedTitle,
] = useState("");

const [
  deleteBlockedMessage,
  setDeleteBlockedMessage,
] = useState("");


const loadPendingVerifications =
  async () => {
    if (
      config.key !== "customers" &&
      config.key !== "vendors"
    ) {
      setPendingVerificationItems([]);
      return;
    }

    const entityType =
      config.key === "customers"
        ? "customer"
        : "vendor";

    const localPending =
      getPendingRegistrations(
        entityType,
      );

    const loaded:
      PendingVerificationItem[] = [];

    for (
      const pending of localPending
    ) {
      try {
        const registration =
          entityType === "customer"
            ? await apiClient
                .getPendingCustomerRegistration(
                  pending.registrationId,
                )
            : await apiClient
                .getPendingVendorRegistration(
                  pending.registrationId,
                );

       const registrationData =
  registration as typeof registration & {
    entity_name?: string;

    form_data?: {
      customer_name?: string;
      vendor_name?: string;
    };

    verification_fields?: {
      key: string;
      label: string;
      email: string;
      verified: boolean;
    }[];
  };

loaded.push({
  registrationId:
    registrationData.registration_id,

  entityType:
    registrationData.entity_type,

  entityName:
    registrationData.entity_name ||
    registrationData.form_data
      ?.customer_name ||
    registrationData.form_data
      ?.vendor_name ||
    (
      entityType === "customer"
        ? "Customer"
        : "Vendor"
    ),

  expiresAt:
    registrationData.expires_at,

  verificationFields:
    registrationData
      .verification_fields ?? [],
});
      } catch {
        /*
         * Registration may already be completed,
         * expired or deleted.
         *
         * Remove only that stale local entry.
         */
        removePendingRegistration(
          pending.registrationId,
        );
      }
    }

    setPendingVerificationItems(
      loaded,
    );
  };


const showDeleteBlockedDialog = (
  error: unknown,
) => {
  const message =
    error instanceof Error
      ? error.message
      : `Unable to delete ${config.singular}.`;

  let title = `Cannot Delete ${config.singular}`;

  if (config.key === "importJobs") {
    title = "Cannot Delete Import Job";
  } else if (config.key === "customers") {
    title = "Cannot Delete Customer";
  } else if (config.key === "vendors") {
    title = "Cannot Delete Vendor";
  }

  setDeleteBlockedTitle(title);
  setDeleteBlockedMessage(message);
  setDeleteBlockedOpen(true);
};


  const filter: Record<string, string | undefined> = {};
  if (config.tabFilterKey && tab !== "all") filter[config.tabFilterKey] = tab;

  const listQuery = useEntityList(config.key, {
    search,
    sortKey,
    sortDir,
    page,
    pageSize,
    filter,
  });
  const nextCustomerCode = useNextCustomerCode();
  const nextVendorCode = useNextVendorCode();
  const nextImportJobNumber = useNextImportJobNumber();
  

useEffect(() => {
  if (
    config.key !== "customers" &&
    config.key !== "vendors"
  ) {
    return;
  }

  void loadPendingVerifications();
}, [config.key]);

  
  // const nextCustomerCode =
  // config.key === "customers"
  //   ? useNextCustomerCode()
  //   : null;
  const create = useCreateEntity(config.key, config.singular);
  const update = useUpdateEntity(config.key, config.singular);
  const remove = useDeleteEntity(config.key, config.singular);
  const bulkDelete = useBulkDelete(config.key, config.plural);
  const bulkCreate = useBulkCreate(config.key, config.plural);

  const rows = (listQuery.data?.rows ?? []) as EntityMap[K][];
  const total = listQuery.data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  const allSelectedOnPage = rows.length > 0 && rows.every((r) => selected.has((r as { id: ID }).id));

  function toggleSort(key: string) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  async function handleExport() {
    const flat = rows.map((r) => {
      const o = r as unknown as Record<string, unknown>;
      const out: Record<string, unknown> = {};
      for (const c of config.columns) {
        out[c.label] = c.render ? "" : String(o[c.key] ?? "");
      }
      // also include all native fields for round-trip
      Object.assign(out, o);
      return out;
    });
    downloadCSV(`${config.key}-${Date.now()}.csv`, toCSV(flat));
    toast.success(`Exported ${flat.length} rows`);
  }

  async function handleImport() {
    try {
      const parsed = await pickAndReadCSV();
      if (!parsed.length) {
        toast.info("No rows found in file.");
        return;
      }
      const fieldNames = new Set(config.fields.map((f) => f.name));
      const cleaned = parsed.map((row) => {
        const out: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(row)) {
          if (!fieldNames.has(k)) continue;
          const fd = config.fields.find((f) => f.name === k);
          if (fd?.type === "number") out[k] = v === "" ? undefined : Number(v);
          else if (fd?.type === "switch") out[k] = v === "true" || v === "1";
          else out[k] = v;
        }
        return out as Partial<EntityMap[K]>;
      });
      await bulkCreate.mutateAsync(cleaned);
    } catch (e) {
      toast.error((e as Error).message || "Import failed");
    }
  }

function buildCreateDefaults(): Partial<EntityMap[K]> {
  const init: Record<string, unknown> = {
    ...(config.initial as object),
  };

  if (config.codePrefix) {
    if (config.key === "customers") {
      init["customer_code"] =
        nextCustomerCode.data?.customer_code ?? "";
    } else if (config.key === "vendors") {
      init["vendor_code"] =
        nextVendorCode.data?.vendor_code ?? "";
    } else if (config.key === "importJobs") {
      init["jobNo"] =
        nextImportJobNumber.data ?? "";
    } else {
      const existing = (listQuery.data?.rows ?? []).map(
        (r) =>
          (r as unknown as Record<string, string>)[
            config.codePrefix!.field
          ] ?? "",
      );

      init[config.codePrefix.field] = nextCode(
        config.codePrefix.prefix,
        config.codePrefix.pad ?? 4,
        existing,
      );
    }
  }

  return init as Partial<EntityMap[K]>;
}

function openCreate() {


  setSelectedPendingRegistrationId(null);
  setCreateDefaults(buildCreateDefaults());
  setCreateOpen(true);
}

  // const initialForCreate = (() => {
  //   const init: Record<string, unknown> = { ...(config.initial as object) };
  //   if (config.codePrefix && config.entity !== "importJobs") {
  //     const existing = (listQuery.data?.rows ?? []).map(
  //       (r) => (r as unknown as Record<string, string>)[config.codePrefix!.field] ?? "",
  //     );
  //     init[config.codePrefix.field] = nextCode(
  //       config.codePrefix.prefix,
  //       config.codePrefix.pad ?? 4,
  //       existing,
  //     );
  //   }
  //   return init as Partial<EntityMap[K]>;
  // })();  
//   const initialForCreate = (() => {
//   const init: Record<string, unknown> = { ...(config.initial as object) };

//   if (config.codePrefix) {
    
//     if (config.key === "customers") {
//     (init as Record<string, unknown>)["customer_code"] =
//   nextCustomerCode?.data?.customer_code ?? "";
// }else if (config.key === "importJobs") {
//       init.jobNo = "";
//     } else {
//       const existing = (listQuery.data?.rows ?? []).map(
//         (r) =>
//           (r as unknown as Record<string, string>)[config.codePrefix!.field] ?? "",
//       );

//       init[config.codePrefix.field] = nextCode(
//         config.codePrefix.prefix,
//         config.codePrefix.pad ?? 4,
//         existing,
//       );
//     }
//   }

//   return init as Partial<EntityMap[K]>;
// })();

  return (
    <div className="space-y-6 p-6 lg:p-8" onClick={() => setOpenMenu(null)}>
      <HeaderBar
        module={module}
        title={heading}
        description={desc}
        onImport={handleImport}
        onExport={handleExport}
        exportLabel={`Export ${config.plural}`}
        extraExports={extraExports}
         hideDefaultExport={hideDefaultExport}
        onNew={openCreate}
        newLabel={`New ${config.singular}`}
        extraActions={
  <>
   {(
  config.key === "customers" ||
  config.key === "vendors"
) &&
  pendingVerificationItems.length > 0 && (
    <button
      type="button"
      onClick={async () => {
        await loadPendingVerifications();

        setPendingListOpen(true);
      }}
      className="
        inline-flex
        items-center
        gap-1.5
        rounded-lg
        border
        border-border
        bg-card
        px-3
        py-1.5
        text-xs
        font-medium
        hover:bg-accent
      "
    >
      Pending Verifications

      <span
        className="
          rounded-full
          bg-primary
          px-1.5
          py-0.5
          text-[10px]
          font-semibold
          text-primary-foreground
        "
      >
        {pendingVerificationItems.length}
      </span>
    </button>
  )}

    {extraHeaderActions}
  </>
}
      />

      {config.tabs && (
        <div className="-mt-1 flex items-center gap-1 border-b border-border">
          {config.tabs.map((t) => {
            const active = t.value === tab;
            return (
              <button
                key={t.value}
                onClick={() => {
                  setTab(t.value);
                  setPage(1);
                }}
                className={`relative px-3 py-2 text-xs font-medium transition-colors ${
                  active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.label}
                {active && (
                  <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand" />
                )}
              </button>
            );
          })}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-soft">
        <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder={config.searchPlaceholder ?? `Search ${heading.toLowerCase()}…`}
              className="h-8 w-64 rounded-md border border-border bg-background pl-8 pr-3 text-xs outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
            />
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowFilter((v) => !v);
            }}
            className={`inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground/80 hover:bg-accent ${
              showFilter ? "ring-2 ring-ring/30" : ""
            }`}
          >
            <SlidersHorizontal className="size-3.5" /> Filter
          </button>
          <button
            onClick={() => {
              // toggle sort direction of the first sortable column
              const firstSortable = config.columns.find((c) => c.sortable);
              if (firstSortable) toggleSort(firstSortable.key);
            }}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground/80 hover:bg-accent"
          >
            <ArrowUpDown className="size-3.5" /> Sort
          </button>

          {selected.size > 0 && (
            <button
              onClick={() => setBulkDeleteOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-md border border-destructive/40 bg-destructive/10 px-2.5 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/15"
            >
              <Trash2 className="size-3.5" /> Delete {selected.size}
            </button>
          )}

          <span className="ml-auto text-xs text-muted-foreground">
            Showing <span className="font-medium text-foreground">{rows.length}</span> of {total}
          </span>
        </div>

        {showFilter && config.tabFilterKey && (
          <div className="flex flex-wrap items-center gap-2 border-b border-border bg-muted/30 px-3 py-2">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
              {config.tabFilterKey}
            </span>
            {(config.tabs ?? []).map((t) => (
              <button
                key={t.value}
                onClick={() => {
                  setTab(t.value);
                  setPage(1);
                }}
                className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${
                  t.value === tab
                    ? "border-brand bg-brand/10 text-brand"
                    : "border-border bg-background text-muted-foreground hover:bg-accent"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}

        <div className="scrollbar-thin overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="w-10 px-3 py-2.5 text-left">
                  <input
                    type="checkbox"
                    className="size-3.5 rounded border-border accent-brand"
                    checked={allSelectedOnPage}
                    onChange={(e) => {
                      const next = new Set(selected);
                      if (e.target.checked) rows.forEach((r) => next.add((r as { id: ID }).id));
                      else rows.forEach((r) => next.delete((r as { id: ID }).id));
                      setSelected(next);
                    }}
                  />
                </th>
                {config.columns.map((c) => {
                  const active = sortKey === c.key;
                  return (
                    <th
                      key={c.key}
                      className={`px-3 py-2.5 text-left font-medium ${c.className ?? ""}`}
                    >
                      {c.sortable ? (
                        <button
                          onClick={() => toggleSort(c.key)}
                          className="inline-flex items-center gap-1 hover:text-foreground"
                        >
                          {c.label}
                          {active &&
                            (sortDir === "asc" ? (
                              <ArrowUp className="size-3" />
                            ) : (
                              <ArrowDown className="size-3" />
                            ))}
                        </button>
                      ) : (
                        c.label
                      )}
                    </th>
                  );
                })}
                <th className="w-10 px-3 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {listQuery.isLoading && rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={config.columns.length + 2}
                    className="px-3 py-10 text-center text-xs text-muted-foreground"
                  >
                    Loading…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={config.columns.length + 2}
                    className="px-3 py-12 text-center text-xs text-muted-foreground"
                  >
                    No {config.plural.toLowerCase()} found.
                    <button
                      onClick={openCreate}
                      className="ml-2 font-medium text-brand hover:underline"
                    >
                      Create one →
                    </button>
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const id = (row as { id: ID }).id;
                  const o = row as unknown as Record<string, unknown>;
                  return (
                    <tr
                      key={id}
                      className="border-t border-border transition-colors hover:bg-accent/40"
                    >
                      <td className="px-3 py-3">
                        <input
                          type="checkbox"
                          className="size-3.5 rounded border-border accent-brand"
                          checked={selected.has(id)}
                          onChange={(e) => {
                            const next = new Set(selected);
                            if (e.target.checked) next.add(id);
                            else next.delete(id);
                            setSelected(next);
                          }}
                        />
                      </td>
                      {config.columns.map((c) => (
                        <td key={c.key} className="px-3 py-3 text-foreground/90">
                          {(() => {
  const value = o[c.key];

  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    return Object.values(value)
      .filter(Boolean)
      .join(", ");
  }

  return (value as ReactNode) ?? "—";
})()}
                        </td>
                      ))}
                      <td className="relative px-3 py-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenu(openMenu === id ? null : id);
                          }}
                          className="rounded p-1 text-muted-foreground hover:bg-accent"
                          aria-label="Row actions"
                        >
                          <MoreHorizontal className="size-4" />
                        </button>
                        {openMenu === id && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="absolute right-3 top-9 z-20 w-36 overflow-hidden rounded-lg border border-border bg-popover text-left text-xs shadow-elevated"
                          >
                            <button
                              onClick={() => {
                                setEditRow(row);
                                setOpenMenu(null);
                              }}
                              className="flex w-full items-center gap-2 px-3 py-2 hover:bg-accent"
                            >
                              <Pencil className="size-3.5" /> Edit
                            </button>
                            <button
                              onClick={() => {
                                setDeleteRow(row);
                                setOpenMenu(null);
                              }}
                              className="flex w-full items-center gap-2 px-3 py-2 text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="size-3.5" /> Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-border px-4 py-2.5 text-xs text-muted-foreground">
          <span>
            Page {page} of {pageCount}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-md border border-border bg-background px-2.5 py-1 hover:bg-accent disabled:opacity-50"
            >
              Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              disabled={page >= pageCount}
              className="rounded-md border border-border bg-background px-2.5 py-1 hover:bg-accent disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>



{(
  config.key === "customers" ||
  config.key === "vendors"
) &&
  pendingListOpen && (
    <div
      className="
        fixed
        inset-0
        z-[100]
        flex
        items-center
        justify-center
        bg-black/50
        p-4
      "
      onClick={() =>
        setPendingListOpen(false)
      }
    >
      <div
        className="
          w-full
          max-w-2xl
          overflow-hidden
          rounded-xl
          border
          border-border
          bg-card
          shadow-elevated
        "
        onClick={(e) =>
          e.stopPropagation()
        }
      >
        <div
          className="
            border-b
            border-border
            px-5
            py-4
          "
        >
          <h2
            className="
              text-base
              font-semibold
            "
          >
            Pending{" "}
            {config.key === "customers"
              ? "Customer"
              : "Vendor"}{" "}
            Verifications
          </h2>

          <p
            className="
              mt-1
              text-xs
              text-muted-foreground
            "
          >
            Continue OTP verification for
            a pending{" "}
            {config.key === "customers"
              ? "Customer"
              : "Vendor"}.
          </p>
        </div>

        <div
          className="
            max-h-[60vh]
            space-y-3
            overflow-y-auto
            p-4
          "
        >
          {pendingVerificationItems.length ===
          0 ? (
            <div
              className="
                py-8
                text-center
                text-sm
                text-muted-foreground
              "
            >
              No pending verifications.
            </div>
          ) : (
            pendingVerificationItems.map(
              (registration) => {
                const total =
                  registration
                    .verificationFields
                    .length;

                const verified =
                  registration
                    .verificationFields
                    .filter(
                      (field) =>
                        field.verified,
                    ).length;

                const remaining =
                  total - verified;

                return (
                  <div
                    key={
                      registration
                        .registrationId
                    }
                    className="
                      rounded-lg
                      border
                      border-border
                      bg-background
                      p-4
                    "
                  >
                    <div
                      className="
                        flex
                        items-start
                        justify-between
                        gap-4
                      "
                    >
                      <div>
                        <div
                          className="
                            text-sm
                            font-semibold
                          "
                        >
                          {
                            registration
                              .entityName
                          }
                        </div>

                        <div
                          className="
                            mt-1
                            text-xs
                            text-muted-foreground
                          "
                        >
                          {verified} of{" "}
                          {total} verified
                          {" • "}
                          {remaining} remaining
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPendingRegistrationId(
                            registration
                              .registrationId,
                          );

                          setPendingListOpen(
                            false,
                          );
                        }}
                        className="
                          shrink-0
                          rounded-lg
                          bg-primary
                          px-3
                          py-2
                          text-xs
                          font-medium
                          text-primary-foreground
                          hover:opacity-95
                        "
                      >
                        Continue Verification
                      </button>
                    </div>

                    <div
                      className="
                        mt-4
                        space-y-2
                        border-t
                        border-border
                        pt-3
                      "
                    >
                      {registration
                        .verificationFields
                        .map((field) => (
                          <div
                            key={field.key}
                            className="
                              flex
                              items-center
                              justify-between
                              gap-4
                              text-xs
                            "
                          >
                            <div
                              className="
                                min-w-0
                              "
                            >
                              <div
                                className="
                                  font-medium
                                "
                              >
                                {field.label}
                              </div>

                              <div
                                className="
                                  truncate
                                  text-muted-foreground
                                "
                              >
                                {field.email}
                              </div>
                            </div>

                            <span
                              className={
                                field.verified
                                  ? "shrink-0 font-medium text-green-600"
                                  : "shrink-0 font-medium text-amber-600"
                              }
                            >
                              {field.verified
                                ? "✓ Verified"
                                : "Pending"}
                            </span>
                          </div>
                        ))}
                    </div>

                    <div
                      className="
                        mt-3
                        text-xs
                        text-muted-foreground
                      "
                    >
                      Expires:{" "}
                      {new Date(
                        registration
                          .expiresAt,
                      ).toLocaleString()}
                    </div>
                  </div>
                );
              },
            )
          )}
        </div>

        <div
          className="
            flex
            justify-end
            border-t
            border-border
            px-4
            py-3
          "
        >
          <button
            type="button"
            onClick={() =>
              setPendingListOpen(false)
            }
            className="
              rounded-lg
              border
              border-border
              bg-background
              px-3
              py-1.5
              text-xs
              font-medium
              hover:bg-accent
            "
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )}


    <EntityFormDialog<EntityMap[K]>
  open={
    createOpen ||
    Boolean(
      selectedPendingRegistrationId,
    )
  }

  onOpenChange={(open) => {
    setCreateOpen(open);

    if (!open) {
      setCreateDefaults(undefined);

      setSelectedPendingRegistrationId(
        null,
      );
    }
  }}

  pendingRegistrationId={
  config.key === "customers" ||
  config.key === "vendors"
    ? selectedPendingRegistrationId
    : null
}

 onPendingRegistrationHandled={() => {
  setSelectedPendingRegistrationId(
    null,
  );

  setCreateDefaults(undefined);

  void loadPendingVerifications();

  void listQuery.refetch();
}}
        title={`New ${config.singular}`}
        fields={config.fields}
        defaultValues={createDefaults}
        submitLabel={`Create ${config.singular}`}
        onSubmit={async (vals) => {
  try {
    return await create.mutateAsync(vals);
  } catch (error: any) {
    toast.error(
      error?.message || "Unable to create record."
    );

    throw error;
  }
}}
      />

      <EntityFormDialog<EntityMap[K]>
        open={!!editRow}
        onOpenChange={(o) => !o && setEditRow(null)}
        title={`Edit ${config.singular}`}
        fields={config.fields}
        defaultValues={editRow ?? undefined}
        submitLabel="Save changes"  
        onSubmit={async (vals) => {
  if (!editRow) {
    return {} as Partial<EntityMap[K]>;
  }

  return await update.mutateAsync({
    id: (editRow as { id: ID }).id,
    patch: vals,
  });
}}
      />

     <ConfirmDialog
  open={!!deleteRow}
  onOpenChange={(open) => {
    if (!open) {
      setDeleteRow(null);
    }
  }}
  title={`Delete ${config.singular}?`}
  description="This action cannot be undone."
  destructive
  confirmLabel="Delete"
  onConfirm={async () => {
    if (!deleteRow) return;

    try {
      await remove.mutateAsync(
        (deleteRow as { id: ID }).id,
      );

      setDeleteRow(null);

    } catch (error) {
      setDeleteRow(null);

      if (
        config.key === "importJobs" ||
        config.key === "customers" ||
        config.key === "vendors"
      ) {
        const title =
          config.key === "importJobs"
            ? "Cannot Delete Import Job"
            : config.key === "customers"
              ? "Cannot Delete Customer"
              : "Cannot Delete Vendor";

        setDeleteBlockedTitle(title);

        setDeleteBlockedMessage(
          error instanceof Error
            ? error.message
            : `Unable to delete ${config.singular}.`,
        );

        setDeleteBlockedOpen(true);
      }
    }
  }}
/>

<ConfirmDialog
  open={bulkDeleteOpen}
  onOpenChange={setBulkDeleteOpen}
  title={`Delete ${selected.size} ${config.plural.toLowerCase()}?`}
  description={
    config.key === "importJobs"
      ? "The selected Import Job(s) will be removed from active records."
      : "The selected records will be permanently removed."
  }
  destructive
  confirmLabel="Delete selected"
  onConfirm={async () => {
    try {
      await bulkDelete.mutateAsync(
        Array.from(selected),
      );

      setSelected(new Set());
      setBulkDeleteOpen(false);

    } catch (error) {
      setBulkDeleteOpen(false);

      if (
        config.key === "importJobs" ||
        config.key === "customers" ||
        config.key === "vendors"
      ) {
        const title =
          config.key === "importJobs"
            ? "Cannot Delete Import Job"
            : config.key === "customers"
              ? "Cannot Delete Customer"
              : "Cannot Delete Vendor";

        setDeleteBlockedTitle(title);

        setDeleteBlockedMessage(
          error instanceof Error
            ? error.message
            : `Unable to delete the selected ${config.plural}.`,
        );

        setDeleteBlockedOpen(true);
      }
    }
  }}
/>

<ConfirmDialog
  open={deleteBlockedOpen}
  onOpenChange={setDeleteBlockedOpen}
  title={deleteBlockedTitle}
  description={deleteBlockedMessage}
  confirmLabel="OK"
  onConfirm={() => {
    setDeleteBlockedOpen(false);
  }}
/>

    </div>
  );
}
