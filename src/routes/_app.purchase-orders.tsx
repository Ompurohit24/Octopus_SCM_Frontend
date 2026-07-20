import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ClipboardList, Search } from "lucide-react";

import { useCreateEntity, useEntityAll } from "@/lib/api/hooks";
import type {
  ImportChecklist,
  ImportJob,
  ServiceItem,
  Vendor,
} from "@/lib/api/types";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/purchase-orders")({
  head: () => ({
    meta: [{ title: "Purchase Orders — Octopus SCM" }],
  }),
  component: PurchaseOrdersRoute,
});

type PurchaseOrderServiceRow = {
  id: string;
  jobId: string;
  jobNo: string;
  consigneeName: string;
  category: "Other Gov Agency" | "Other Services";
  serviceName: string;
  status: string;
  unit: string;

  tariff?: number;
  tariff20?: number;
  tariff40?: number;

  enable20?: boolean;
  enable40?: boolean;
};

function PurchaseOrdersRoute() {


    const [selectedRow, setSelectedRow] =
  useState<PurchaseOrderServiceRow | null>(null);

const [selectedVendorId, setSelectedVendorId] =
  useState("");

const { data: vendors = [] } =
  useEntityAll("vendors");

const { data: purchaseOrders = [] } =
  useEntityAll("purchaseOrders");

const createPurchaseOrder =
  useCreateEntity(
    "purchaseOrders",
    "Purchase Order",
  );
  const [search, setSearch] = useState("");

  const {
    data: jobs = [],
    isLoading: jobsLoading,
  } = useEntityAll("importJobs");

  const {
    data: workflows = [],
    isLoading: workflowsLoading,
  } = useEntityAll("importChecklists");

  const rows = useMemo<PurchaseOrderServiceRow[]>(() => {
    const jobMap = new Map<string, ImportJob>();

    jobs.forEach((job) => {
      if (job.id) {
        jobMap.set(String(job.id), job);
      }

      if (job.job_id) {
        jobMap.set(String(job.job_id), job);
      }

      if (job.job_number) {
        jobMap.set(String(job.job_number), job);
      }

      if (job.jobNo) {
        jobMap.set(String(job.jobNo), job);
      }
    });

    const result: PurchaseOrderServiceRow[] = [];

    workflows.forEach((workflow) => {
      const wf = workflow as ImportChecklist & {
        otherGovAgencyType?: Record<string, ServiceItem>;
        otherServices?: Record<string, ServiceItem>;
      };

      const job =
        jobMap.get(String(wf.job_id ?? "")) ??
        jobMap.get(String(wf.job_number ?? "")) ??
        jobMap.get(String(wf.jobNo ?? ""));

      const jobNo =
        job?.jobNo ??
        job?.job_number ??
        wf.jobNo ??
        wf.job_number ??
        "";

      const jobId =
        job?.id ??
        job?.job_id ??
        wf.job_id ??
        "";

      const consigneeName =
        job?.consigneeName ??
        "";

      addServices(
        result,
        wf.otherGovAgencyType,
        "Other Gov Agency",
        String(jobId),
        String(jobNo),
        consigneeName,
      );

      addServices(
        result,
        wf.otherServices,
        "Other Services",
        String(jobId),
        String(jobNo),
        consigneeName,
      );
    });

    return result;
  }, [jobs, workflows]);

  const filteredRows = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return rows;
    }

    return rows.filter((row) =>
      [
        row.jobNo,
        row.consigneeName,
        row.category,
        row.serviceName,
        row.status,
        row.unit,
      ].some((field) =>
        String(field ?? "")
          .toLowerCase()
          .includes(value),
      ),
    );
  }, [rows, search]);

  const loading = jobsLoading || workflowsLoading;

  const existingPOMap = useMemo(() => {
  const map = new Map<string, string>();

  purchaseOrders.forEach((po) => {
    if (po.status === "Cancelled") return;

    const key = [
      po.job_id || po.job_number,
      po.category,
      po.service_name,
    ].join("|");

    map.set(key, po.po_number);
  });

  return map;
}, [purchaseOrders]);

function getExistingPO(
  row: PurchaseOrderServiceRow,
) {
  return (
    existingPOMap.get(
      [
        row.jobId || row.jobNo,
        row.category,
        row.serviceName,
      ].join("|"),
    ) ?? null
  );
}

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardList className="h-6 w-6" />

            <h1 className="text-2xl font-semibold tracking-tight">
              Purchase Orders
            </h1>
          </div>

          <p className="mt-1 text-sm text-muted-foreground">
            Services selected in Import Job workflows.
          </p>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search job, consignee or service..."
            className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/40">
              <tr>
                <TableHead>Job No</TableHead>

                <TableHead>
                  Consignee
                </TableHead>

                <TableHead>
                  Category
                </TableHead>

                <TableHead>
                  Service
                </TableHead>

                <TableHead>
                  Job Status
                </TableHead>

                <TableHead>
                  Tariff Unit
                </TableHead>

                <TableHead>
                  Tariff
                </TableHead>

                <TableHead>
                  Vendor
                </TableHead>

                <TableHead className="text-right">
                  Action
                </TableHead>
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-12 text-center text-sm text-muted-foreground"
                  >
                    Loading services...
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-12 text-center"
                  >
                    <ClipboardList className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />

                    <p className="font-medium">
                      No services found
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      Select Other Gov Agency or Other Services in Update Job.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => (
                  <tr
                    key={row.id}
                    className="transition-colors hover:bg-muted/30"
                  >
                    <TableCell className="font-medium">
                      {row.jobNo || "—"}
                    </TableCell>

                    <TableCell>
                      {row.consigneeName || "—"}
                    </TableCell>

                    <TableCell>
                      <span className="rounded-full border border-border bg-muted px-2 py-1 text-xs font-medium">
                        {row.category}
                      </span>
                    </TableCell>

                    <TableCell className="font-medium">
                      {row.serviceName}
                    </TableCell>

                    <TableCell>
                      <StatusBadge status={row.status} />
                    </TableCell>

                    <TableCell>
                      {row.unit || "—"}
                    </TableCell>

                    <TableCell>
                      <TariffDisplay row={row} />
                    </TableCell>

                    <TableCell>
                      <span className="text-muted-foreground">
                        Not Assigned
                      </span>
                    </TableCell>

                    <TableCell className="text-right">
                      {getExistingPO(row) ? (
  <span className="inline-flex rounded-lg bg-green-100 px-3 py-1.5 text-xs font-semibold text-green-700">
    {getExistingPO(row)}
  </span>
) : (
  <button
    type="button"
    disabled={row.status !== "Done"}
    onClick={() => {
      setSelectedRow(row);
      setSelectedVendorId("");
    }}
    className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40"
  >
    Create PO
  </button>
)}
                    </TableCell>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

                {!loading && filteredRows.length > 0 && (
          <div className="border-t border-border bg-muted/20 px-4 py-3 text-xs text-muted-foreground">
            {filteredRows.length} service
            {filteredRows.length === 1 ? "" : "s"} found
          </div>
        )}
      </div>

      {/* CREATE PURCHASE ORDER DIALOG */}
      {selectedRow && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/40 backdrop-blur-sm"
          onClick={() => {
            if (!createPurchaseOrder.isPending) {
              setSelectedRow(null);
            }
          }}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="text-lg font-semibold">
              Create Purchase Order
            </h2>

            <div className="mt-5 grid grid-cols-2 gap-4 rounded-xl border border-border bg-muted/30 p-4 text-sm">
              <Info
                label="Job No"
                value={selectedRow.jobNo}
              />

              <Info
                label="Consignee"
                value={selectedRow.consigneeName}
              />

              <Info
                label="Category"
                value={selectedRow.category}
              />

              <Info
                label="Service"
                value={selectedRow.serviceName}
              />

              <Info
                label="Job Status"
                value={selectedRow.status}
              />

              <Info
                label="Tariff Unit"
                value={selectedRow.unit || "—"}
              />

              <div className="col-span-2">
                <p className="text-xs text-muted-foreground">
                  Tariff
                </p>

                <div className="mt-1">
                  <TariffDisplay row={selectedRow} />
                </div>
              </div>
            </div>

            {/* Vendor */}
            <div className="mt-5">
              <label className="mb-1.5 block text-xs font-medium">
                Vendor{" "}
                <span className="text-destructive">*</span>
              </label>

              <select
                value={selectedVendorId}
                onChange={(event) =>
                  setSelectedVendorId(event.target.value)
                }
                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
              >
                <option value="">
                  Select Vendor...
                </option>

                {vendors
                  .filter(
                    (vendor) =>
                      vendor.is_active !== false &&
                      vendor.is_deleted !== true,
                  )
                  .map((vendor) => (
                    <option
                      key={vendor.id}
                      value={vendor.id}
                    >
                      {vendor.vendor_name}
                      {vendor.type_of_service
                        ? ` — ${vendor.type_of_service}`
                        : ""}
                    </option>
                  ))}
              </select>
            </div>

            {/* Actions */}
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                disabled={createPurchaseOrder.isPending}
                onClick={() => {
                  setSelectedRow(null);
                  setSelectedVendorId("");
                }}
                className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={
                  !selectedVendorId ||
                  createPurchaseOrder.isPending
                }
                onClick={async () => {
                  const vendor = vendors.find(
                    (item) =>
                      item.id === selectedVendorId,
                  );

                  if (!vendor) {
                    toast.error(
                      "Please select a vendor.",
                    );
                    return;
                  }

                  try {
                    await createPurchaseOrder.mutateAsync({
                      job_id: selectedRow.jobId,
                      job_number: selectedRow.jobNo,

                      consignee_name:
                        selectedRow.consigneeName,

                      category:
                        selectedRow.category,

                      service_name:
                        selectedRow.serviceName,

                      vendor_id: vendor.id,
                      vendor_code:
                        vendor.vendor_code,
                      vendor_name:
                        vendor.vendor_name,

                      service_status:
                        selectedRow.status,

                      unit:
                        selectedRow.unit === "Container" ||
                        selectedRow.unit === "BL"
                          ? selectedRow.unit
                          : undefined,

                      tariff:
                        selectedRow.tariff,

                      tariff_20:
                        selectedRow.tariff20,

                      tariff_40:
                        selectedRow.tariff40,

                      enable_20:
                        selectedRow.enable20,

                      enable_40:
                        selectedRow.enable40,
                    });

                    setSelectedRow(null);
                    setSelectedVendorId("");
                  } catch {
                    // Error toast handled by mutation hook
                  }
                }}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {createPurchaseOrder.isPending
                  ? "Creating..."
                  : "Create Purchase Order"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function addServices(
  rows: PurchaseOrderServiceRow[],
  services: Record<string, ServiceItem> | undefined,
  category: "Other Gov Agency" | "Other Services",
  jobId: string,
  jobNo: string,
  consigneeName: string,
) {
  if (!services) {
    return;
  }

  Object.entries(services).forEach(
    ([serviceName, service]) => {
      if (!service) {
        return;
      }

      rows.push({
        id: [
          jobId || jobNo,
          category,
          serviceName,
        ].join("-"),

        jobId,
        jobNo,
        consigneeName,

        category,
        serviceName,

        status:
          service.status || "Pending",

        unit:
          service.unit || "",

        tariff:
          service.tariff,

        tariff20:
          service.tariff20,

        tariff40:
          service.tariff40,

        enable20:
          service.enable20,

        enable40:
          service.enable40,
      });
    },
  );
}

function TariffDisplay({
  row,
}: {
  row: PurchaseOrderServiceRow;
}) {
  if (row.status !== "Done") {
    return (
      <span className="text-muted-foreground">
        —
      </span>
    );
  }

  if (row.unit === "BL") {
    return (
      <span className="font-medium">
        {formatMoney(row.tariff)}
      </span>
    );
  }

  if (row.unit === "Container") {
    return (
      <div className="space-y-1 text-xs">
        {row.enable20 && (
          <div>
            <span className="text-muted-foreground">
              20 FT:
            </span>{" "}
            <span className="font-medium">
              {formatMoney(row.tariff20)}
            </span>
          </div>
        )}

        {row.enable40 && (
          <div>
            <span className="text-muted-foreground">
              40 FT:
            </span>{" "}
            <span className="font-medium">
              {formatMoney(row.tariff40)}
            </span>
          </div>
        )}

        {!row.enable20 && !row.enable40 && (
          <span className="text-muted-foreground">
            —
          </span>
        )}
      </div>
    );
  }

  return (
    <span className="text-muted-foreground">
      —
    </span>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const done = status === "Done";

  return (
    <span
      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
        done
          ? "bg-green-100 text-green-700"
          : "bg-amber-100 text-amber-700"
      }`}
    >
      {status || "Pending"}
    </span>
  );
}

function formatMoney(
  value: number | undefined,
) {
  if (
    value === undefined ||
    value === null
  ) {
    return "—";
  }

  return new Intl.NumberFormat(
    "en-IN",
    {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    },
  ).format(value);
}

function TableHead({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={`whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-muted-foreground ${className}`}
    >
      {children}
    </th>
  );
}

function TableCell({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <td
      className={`whitespace-nowrap px-4 py-3 ${className}`}
    >
      {children}
    </td>
  );
}
function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">
        {label}
      </p>

      <p className="mt-1 font-medium">
        {value || "—"}
      </p>
    </div>
  );
}