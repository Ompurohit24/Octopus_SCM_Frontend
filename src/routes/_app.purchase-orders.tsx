import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ClipboardList,
  Search,
  Upload,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/storage";


import { useCreateEntity, useEntityAll } from "@/lib/api/hooks";
import type {
  ImportChecklist,
  ImportJob,
  ServiceItem,
  Vendor,
  PurchaseOrder,
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

  blNo: string;
  beNo: string;
  cfsName: string;

  containers: {
  containerNumber: string;
  size: string;
}[];

  category:
  | "Other Gov Agency"
  | "Other Services"
  | "Transportation";

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

  const [viewPO, setViewPO] =
  useState<PurchaseOrder | null>(null);


  const [invoicePO, setInvoicePO] =
  useState<PurchaseOrder | null>(null);

const [invoiceFile, setInvoiceFile] =
  useState<File | null>(null);

const [invoiceUploading, setInvoiceUploading] =
  useState(false);

  const [removePORow, setRemovePORow] =
  useState<PurchaseOrderServiceRow | null>(null);

   const [selectedVendorId, setSelectedVendorId] =
    useState("");

  const [selectedContainerNumbers, setSelectedContainerNumbers] =
  useState<string[]>([]);

const [poTariff, setPoTariff] =
  useState("");

const [poTariffUnit, setPoTariffUnit] =
  useState<"BL" | "Container" | "">("");

const { data: vendors = [] } =
  useEntityAll("vendors");

const queryClient = useQueryClient();

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

  transportation?: string;
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

      const blNo =
  job?.blNo ??
  "";

const beNo =
  wf.be_no ??
  job?.beNo ??
  "";

const cfsName =
  wf.cfs_name ??
  "";

const containerNumbers = String(
  job?.containerNumbers ?? "",
)
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);

const containerSize = String(
  job?.size ?? "",
).trim();

const containers = containerNumbers.map(
  (containerNumber) => ({
    containerNumber,
    size: containerSize,
  }),
);

      addServices(
  result,
  wf.otherGovAgencyType,
  "Other Gov Agency",
  String(jobId),
  String(jobNo),
  consigneeName,
  blNo,
  beNo,
  cfsName,
containers,
);



    addServices(
  result,
  wf.otherServices,
  "Other Services",
  String(jobId),
  String(jobNo),
  consigneeName,
  blNo,
  beNo,
  cfsName,
containers,
);


// -------------------------------------------------------
// TRANSPORTATION
//
// Only Octopus-managed transportation requires a PO.
//
// Party:
// Customer/party handles transportation themselves.
// Do not create a Purchase Order row.
//
// Octopus:
// Octopus assigns a transport vendor.
// Show the job in Purchase Orders.
// -------------------------------------------------------

if (
  String(
    wf.transportation ?? "",
  )
    .trim()
    .toLowerCase() === "octopus"
) {
  result.push({
    id: [
      jobId || jobNo,
      "Transportation",
      "Transportation",
    ].join("-"),

    jobId: String(jobId),
    jobNo: String(jobNo),

    consigneeName,

    blNo,
    beNo,
    cfsName,

    containers,

    category: "Transportation",

    serviceName: "Transportation",

    status: "Pending",

    unit: "",

    tariff: undefined,
    tariff20: undefined,
    tariff40: undefined,

    enable20: false,
    enable40: false,
  });
}

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
  const map = new Map<string, PurchaseOrder>();

  purchaseOrders.forEach((po) => {
    if (po.status === "Cancelled") return;

    const key = [
      po.job_id || po.job_number,
      po.category,
      po.service_name,
    ].join("|");

    map.set(key, po);
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

const eligibleVendors = useMemo(() => {
  if (!selectedRow) {
    return [];
  }

const service =
  selectedRow.category === "Transportation"
    ? "transport"
    : selectedRow.serviceName
        .trim()
        .toLowerCase();

  return vendors.filter((vendor) => {
    if (
      vendor.is_active === false ||
      vendor.is_deleted === true
    ) {
      return false;
    }

    const eligibleVendors = useMemo(() => {
  if (!selectedRow) {
    return [];
  }

  const requiredService =
    selectedRow.category === "Transportation"
      ? "transport"
      : selectedRow.serviceName
          .trim()
          .toLowerCase();

  return vendors.filter((vendor) => {
    if (
      vendor.is_active === false ||
      vendor.is_deleted === true
    ) {
      return false;
    }

    const rawServices =
      vendor.type_of_service;

    const vendorServices = Array.isArray(rawServices)
      ? rawServices
          .map((service) =>
            String(service)
              .trim()
              .toLowerCase(),
          )
          .filter(Boolean)
      : String(rawServices ?? "")
          .split(",")
          .map((service) =>
            service
              .trim()
              .toLowerCase(),
          )
          .filter(Boolean);

    return vendorServices.includes(
      requiredService,
    );
  });
}, [vendors, selectedRow]);

    
  });
}, [vendors, selectedRow]);

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
  {getExistingPO(row) ? (
    <span className="font-medium">
      {getExistingPO(row)?.vendor_name}
    </span>
  ) : (
    <span className="text-muted-foreground">
      Not Assigned
    </span>
  )}
</TableCell>

                    <TableCell className="text-right">
  {(() => {
    const existingPO =
      getExistingPO(row);

    const invoiceReceived =
      existingPO?.invoice_status ===
      "Received";

    const canImportInvoice =
      existingPO?.status ===
      "Issued";

    return (
      <div className="flex items-center justify-end gap-2">

        {/* CREATE / VIEW PO */}

        {existingPO ? (
          <>
            <button
              type="button"
              onClick={() =>
                setViewPO(existingPO)
              }
              className="
                inline-flex
                rounded-lg
                bg-green-100
                px-3
                py-1.5
                text-xs
                font-semibold
                text-green-700
                transition-colors
                hover:bg-green-200
              "
            >
              {existingPO.po_number}
            </button>

            <button
              type="button"
              onClick={() =>
                setRemovePORow(row)
              }
              className="
                rounded-lg
                border
                border-destructive/30
                px-3
                py-1.5
                text-xs
                font-medium
                text-destructive
                transition-colors
                hover:bg-destructive/10
              "
            >
              Delete
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => {
              setSelectedRow(row);

              setSelectedVendorId("");

              setSelectedContainerNumbers(
                row.containers.map(
                  (container) =>
                    container.containerNumber,
                ),
              );

              setPoTariffUnit(
                row.unit === "BL" ||
                  row.unit === "Container"
                  ? row.unit
                  : "",
              );

              if (row.unit === "BL") {
                setPoTariff(
                  row.tariff !== undefined
                    ? String(row.tariff)
                    : "",
                );
              } else {
                setPoTariff("");
              }
            }}
            className="
              rounded-lg
              bg-primary
              px-3
              py-1.5
              text-xs
              font-medium
              text-primary-foreground
              hover:opacity-95
            "
          >
            Create PO
          </button>
        )}


        {/* IMPORT INVOICE */}

        <button
          type="button"

          disabled={
            !canImportInvoice
          }

          onClick={() => {
            if (!existingPO) {
              return;
            }

            setInvoicePO(
              existingPO,
            );

            setInvoiceFile(
              null,
            );
          }}

          className={`
            inline-flex
            items-center
            gap-1.5
            rounded-lg
            border
            px-3
            py-1.5
            text-xs
            font-medium
            transition-colors

            ${
              invoiceReceived
                ? `
                    border-green-200
                    bg-green-50
                    text-green-700
                    hover:bg-green-100
                  `
                : `
                    border-border
                    bg-background
                    hover:bg-accent
                  `
            }

            disabled:cursor-not-allowed
            disabled:opacity-40
          `}
        >
          <Upload className="h-3.5 w-3.5" />

          {invoiceReceived
            ? "Invoice Received"
            : "Upload Vendor Invoice"}
        </button>

      </div>
    );
  })()}
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
    label="BL No"
    value={selectedRow.blNo}
  />

  <Info
    label="BE No"
    value={selectedRow.beNo}
  />

  <Info
    label="CFS Name"
    value={selectedRow.cfsName}
  />

<div className="col-span-2">
  <p className="text-xs text-muted-foreground">
    Container Number
  </p>

  {selectedRow.containers.length > 0 ? (
    <div className="mt-2 space-y-2">
      {selectedRow.containers.map(
        (container) => {
          const checked =
            selectedContainerNumbers.includes(
              container.containerNumber,
            );

          return (
            <label
              key={container.containerNumber}
              className="flex cursor-pointer items-center justify-between rounded-lg border border-border bg-background px-3 py-2"
            >
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(event) => {
                    if (event.target.checked) {
                      setSelectedContainerNumbers(
                        (current) => [
                          ...current,
                          container.containerNumber,
                        ],
                      );
                    } else {
                      setSelectedContainerNumbers(
                        (current) =>
                          current.filter(
                            (number) =>
                              number !==
                              container.containerNumber,
                          ),
                      );
                    }
                  }}
                  className="size-4 rounded border-border accent-primary"
                />

                <span className="font-medium">
                  {container.containerNumber}
                </span>
              </div>

              <span className="text-xs font-medium text-muted-foreground">
                {container.size || "—"}
              </span>
            </label>
          );
        },
      )}
    </div>
  ) : (
    <p className="mt-1 font-medium">
      —
    </p>
  )}
</div>

  <Info
    label="Category"
    value={selectedRow.category}
  />

  <div className="col-span-2">
    <Info
      label="Service"
      value={selectedRow.serviceName}
    />
  </div>

</div>


<div className="mt-5 grid grid-cols-2 gap-4">

  <div>
    <label className="mb-1.5 block text-xs font-medium">
      Tariff Unit{" "}
      <span className="text-destructive">*</span>
    </label>

    <select
      value={poTariffUnit}
      onChange={(event) =>
        setPoTariffUnit(
          event.target.value as
            | "BL"
            | "Container"
            | "",
        )
      }
      className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
    >
      <option value="">
        Select Tariff Unit...
      </option>

      <option value="BL">
        BL
      </option>

      <option value="Container">
        Container
      </option>
    </select>
  </div>

  <div>
    <label className="mb-1.5 block text-xs font-medium">
      Tariff Amount{" "}
      <span className="text-destructive">*</span>
    </label>

    <input
      type="number"
      min="0"
      step="0.01"
      value={poTariff}
      onChange={(event) =>
        setPoTariff(event.target.value)
      }
      placeholder="Enter tariff amount"
      className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
    />
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

                {eligibleVendors.map((vendor) => (
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
              {eligibleVendors.length === 0 && (
  <p className="mt-2 text-xs text-amber-600">
    No vendor is configured for{" "}
    <strong>{selectedRow.serviceName}</strong>.
    Add this service to a vendor in Vendor Master first.
  </p>
)}
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
  !poTariffUnit ||
  !poTariff ||
  Number(poTariff) < 0 ||
  (
    poTariffUnit === "Container" &&
    selectedContainerNumbers.length === 0
  ) ||
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
  job_id:
    selectedRow.jobId,

  job_number:
    selectedRow.jobNo,

  consignee_name:
    selectedRow.consigneeName,

  bl_no:
    selectedRow.blNo,

  be_no:
    selectedRow.beNo,

  cfs_name:
    selectedRow.cfsName,

  containers:
    selectedRow.containers
      .filter((container) =>
        selectedContainerNumbers.includes(
          container.containerNumber,
        ),
      )
      .map((container) => ({
        container_number:
          container.containerNumber,

        size:
          container.size,
      })),

  category:
    selectedRow.category,

  service_name:
    selectedRow.serviceName,

  vendor_id:
    vendor.id,

  vendor_code:
    vendor.vendor_code,

  vendor_name:
    vendor.vendor_name,

  service_status:
    selectedRow.status,

  unit:
    poTariffUnit || undefined,

  tariff:
    poTariff
      ? Number(poTariff)
      : undefined,

  tariff_20:
    undefined,

  tariff_40:
    undefined,

  enable_20:
    false,

  enable_40:
    false,
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

{viewPO && (
  <div
    className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4 backdrop-blur-sm"
    onClick={() => setViewPO(null)}
  >
    <div
      className="w-full max-w-3xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div>
          <h2 className="text-lg font-semibold">
            Purchase Order
          </h2>

          <p className="mt-1 text-sm font-medium text-primary">
            {viewPO.po_number}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setViewPO(null)}
          className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-accent"
        >
          Close
        </button>
      </div>

      <div className="space-y-6 p-6">
        <div className="grid grid-cols-2 gap-5 md:grid-cols-3">
          <Info
            label="PO Number"
            value={viewPO.po_number}
          />

          <Info
            label="Job Number"
            value={viewPO.job_number}
          />

          <Info
            label="Status"
            value={viewPO.status}
          />

          <Info
            label="Consignee"
            value={viewPO.consignee_name}
          />

          <Info
            label="Vendor"
            value={viewPO.vendor_name}
          />

          <Info
            label="Vendor Code"
            value={viewPO.vendor_code || "—"}
          />

          <Info
            label="Category"
            value={viewPO.category}
          />

          <Info
            label="Service"
            value={viewPO.service_name}
          />

          <Info
            label="Unit"
            value={viewPO.unit || "—"}
          />
        </div>

        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <TableHead>Description</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead className="text-right">
                  Tariff
                </TableHead>
              </tr>
            </thead>

            <tbody>
              <tr className="border-t border-border">
                <TableCell>
                  {viewPO.service_name}
                </TableCell>

                <TableCell>
                  {viewPO.unit || "—"}
                </TableCell>

                <TableCell className="text-right">
                  {viewPO.unit === "BL" ? (
                    formatMoney(viewPO.tariff)
                  ) : viewPO.unit === "Container" ? (
                    <div className="space-y-1">
                      {viewPO.enable_20 && (
                        <div>
                          20 FT:{" "}
                          {formatMoney(
                            viewPO.tariff_20,
                          )}
                        </div>
                      )}

                      {viewPO.enable_40 && (
                        <div>
                          40 FT:{" "}
                          {formatMoney(
                            viewPO.tariff_40,
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    "—"
                  )}
                </TableCell>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Print Purchase Order
          </button>
        </div>
      </div>
    </div>
  </div>
)}

{invoicePO && (
  <div
    className="
      fixed
      inset-0
      z-50
      grid
      place-items-center
      bg-black/40
      p-4
      backdrop-blur-sm
    "
    onClick={() => {
      if (!invoiceUploading) {
        setInvoicePO(null);
        setInvoiceFile(null);
      }
    }}
  >
    <div
      className="
        w-full
        max-w-lg
        rounded-2xl
        border
        border-border
        bg-card
        p-6
        shadow-2xl
      "
      onClick={(event) =>
        event.stopPropagation()
      }
    >

      <div>
        <h2 className="text-lg font-semibold">
          {invoicePO.invoice_status ===
          "Received"
            ? "Replace Vendor Invoice"
            : "Import Vendor Invoice"}
        </h2>

        <p className="mt-1 text-sm text-muted-foreground">
          Upload the invoice received from the vendor.
        </p>
      </div>


      {/* PO INFORMATION */}

      <div
        className="
          mt-5
          grid
          grid-cols-2
          gap-4
          rounded-xl
          border
          border-border
          bg-muted/30
          p-4
          text-sm
        "
      >

        <Info
          label="PO Number"
          value={
            invoicePO.po_number
          }
        />

        <Info
          label="Job Number"
          value={
            invoicePO.job_number
          }
        />

        <Info
          label="Vendor"
          value={
            invoicePO.vendor_name
          }
        />

        <Info
          label="Vendor Code"
          value={
            invoicePO.vendor_code ??
            "—"
          }
        />

        <Info
          label="Service"
          value={
            invoicePO.service_name
          }
        />

        <Info
          label="Status"
          value={
            invoicePO.invoice_status ===
            "Received"
              ? "Invoice Received"
              : "Pending Invoice"
          }
        />

      </div>


      {/* EXISTING INVOICE */}

      {invoicePO.invoice_status ===
        "Received" && (
        <div
          className="
            mt-4
            rounded-lg
            border
            border-green-200
            bg-green-50
            px-4
            py-3
          "
        >
          <p className="text-sm font-medium text-green-700">
            Invoice already received
          </p>

          {invoicePO.invoice_original_name && (
            <p className="mt-1 text-xs text-green-700">
              {
                invoicePO.invoice_original_name
              }
            </p>
          )}
        </div>
      )}


      {/* FILE INPUT */}

      <div className="mt-5">

        <label className="mb-1.5 block text-xs font-medium">
          Invoice File{" "}
          <span className="text-destructive">
            *
          </span>
        </label>

        <input
          type="file"

          accept="
            application/pdf,
            image/jpeg,
            image/png,
            .pdf,
            .jpg,
            .jpeg,
            .png
          "

          disabled={
            invoiceUploading
          }

          onChange={(event) => {
            const file =
              event.target.files?.[0] ??
              null;

            if (!file) {
              setInvoiceFile(null);
              return;
            }

            const allowedTypes = [
              "application/pdf",
              "image/jpeg",
              "image/png",
            ];

            if (
              !allowedTypes.includes(
                file.type,
              )
            ) {
              toast.error(
                "Invoice must be PDF, JPG, JPEG, or PNG.",
              );

              event.target.value =
                "";

              setInvoiceFile(null);

              return;
            }

            if (
              file.size >
              10 * 1024 * 1024
            ) {
              toast.error(
                "Invoice file size must not exceed 10 MB.",
              );

              event.target.value =
                "";

              setInvoiceFile(null);

              return;
            }

            setInvoiceFile(
              file,
            );
          }}

          className="
            block
            w-full
            rounded-lg
            border
            border-border
            bg-background
            px-3
            py-2
            text-sm
            file:mr-3
            file:rounded-md
            file:border-0
            file:bg-muted
            file:px-3
            file:py-1.5
            file:text-xs
            file:font-medium
          "
        />

        <p className="mt-2 text-xs text-muted-foreground">
          PDF, JPG, JPEG or PNG. Maximum 10 MB.
        </p>

      </div>


      {/* ACTIONS */}

      <div className="mt-6 flex justify-end gap-2">

        <button
          type="button"

          disabled={
            invoiceUploading
          }

          onClick={() => {
            setInvoicePO(null);
            setInvoiceFile(null);
          }}

          className="
            rounded-lg
            border
            border-border
            bg-background
            px-4
            py-2
            text-sm
            font-medium
            hover:bg-accent
            disabled:opacity-50
          "
        >
          Cancel
        </button>


        <button
          type="button"

          disabled={
            !invoiceFile ||
            invoiceUploading
          }

          onClick={async () => {

            if (!invoiceFile) {
              toast.error(
                "Please select an invoice file.",
              );

              return;
            }

            try {

              setInvoiceUploading(
                true,
              );

             await apiClient
  .uploadPurchaseOrderInvoice(
    invoicePO.po_number,
    invoiceFile,
  );


// -----------------------------------------
// REFRESH PURCHASE ORDERS
//
// Backend has now changed:
//
// invoice_status:
// Pending -> Received
//
// Refetch before closing so the table gets
// the latest PO state immediately.
// -----------------------------------------

await queryClient.invalidateQueries({
  queryKey: [
    "purchaseOrders",
  ],
});


toast.success(
  invoicePO.invoice_status ===
    "Received"
    ? "Invoice replaced successfully."
    : "Invoice uploaded successfully. Vendor reminders will stop for this Purchase Order.",
);


setInvoicePO(
  null,
);

setInvoiceFile(
  null,
);  

              // We need fresh purchaseOrders data here.
              // See note below.

            } catch (error) {

              toast.error(
                error instanceof Error
                  ? error.message
                  : "Failed to upload invoice.",
              );

            } finally {

              setInvoiceUploading(
                false,
              );
            }
          }}

          className="
            rounded-lg
            bg-primary
            px-4
            py-2
            text-sm
            font-medium
            text-primary-foreground
            hover:opacity-95
            disabled:cursor-not-allowed
            disabled:opacity-50
          "
        >
          {invoiceUploading
            ? "Uploading..."
            : invoicePO.invoice_status ===
                "Received"
              ? "Replace Invoice"
              : "Upload Invoice"}
        </button>

      </div>

    </div>
  </div>
)}


{removePORow && (
  <div
    className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4 backdrop-blur-sm"
    onClick={() => setRemovePORow(null)}
  >
    <div
      className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl"
      onClick={(event) => event.stopPropagation()}
    >
      <h2 className="text-lg font-semibold">
        Remove Purchase Order Service
      </h2>

      <p className="mt-3 text-sm text-muted-foreground">
        This service cannot be deleted directly from Purchase Orders.
      </p>

      <div className="mt-4 rounded-xl border border-border bg-muted/30 p-4">
        <Info
          label="Job No"
          value={removePORow.jobNo}
        />

        <div className="mt-3">
          <Info
            label="Service"
            value={removePORow.serviceName}
          />
        </div>

        <div className="mt-3">
          <Info
            label="Category"
            value={removePORow.category}
          />
        </div>
      </div>

      <p className="mt-4 text-sm">
        To remove this service from the Purchase Order list,
        go to <strong>Update Job</strong>, select job{" "}
        <strong>{removePORow.jobNo}</strong>, and remove/uncheck{" "}
        <strong>{removePORow.serviceName}</strong>.
      </p>

      <p className="mt-2 text-xs text-muted-foreground">
        Save the Update Job after removing the service. It will then
        disappear automatically from the Purchase Order list.
      </p>

      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={() => setRemovePORow(null)}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          OK, Got It
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
  blNo: string,
  beNo: string,
  cfsName: string,
  containers: {
    containerNumber: string;
    size: string;
  }[],
) {
  if (!services) {
    return;
  }

  Object.entries(services).forEach(
    ([serviceName, service]) => {
      // Ignore legacy array-style entries: 0, 1, 2...
      if (/^\d+$/.test(serviceName)) {
        return;
      }

      // Ignore invalid legacy service data
      if (
        !service ||
        typeof service !== "object" ||
        !("status" in service)
      ) {
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

        blNo,
beNo,
cfsName,
containers,

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
