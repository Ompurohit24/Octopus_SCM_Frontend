// import { useId, useState, useEffect, useMemo, type ReactNode } from "react";
import { useId, useState, useEffect, useMemo, type ReactNode } from "react";
import { Logo } from "@/components/octopus/Logo";
import { useForm, Controller } from "react-hook-form";
import type { FieldDef } from "@/lib/entities";
import { useRef } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { toast } from "sonner";
import {
  ChevronsUpDown,
  Check,
  Download,
  ChevronDown,
  Upload,
  FileText,
} from "lucide-react";
// import { useEntityAll } from "@/lib/api/hooks";
import { Pencil } from "lucide-react";
import type { EntityKey } from "@/lib/api/types";
import {
  useEntityAll,
  useNextCustomerCode,
  useNextImportJobNumber,
} from "@/lib/api/hooks";
import { Trash2 } from "lucide-react";
import { apiClient } from "@/lib/api/storage";
import SearchableJobSelect from "@/components/octopus/SearchableJobSelect";

interface Props<T> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  fields: FieldDef[];
  defaultValues?: Partial<T>;
  submitLabel?: string;
  onSubmit: (values: Partial<T>) => Promise<Partial<T>> | Partial<T>;
  /** Notify parent when a specific field changes (useful for lookups). */
  watchField?: string;
  onWatchChange?: (value: string) => void;
  /** Optional banner rendered at the top of the dialog body. */
  banner?: ReactNode;
}

const CUSTOM_OPTS_KEY = "octopus.customOptions.v1";
const IMPORT_WORKFLOW = [
  "checklist",
  "igmStatus",
  "goodsRegi",
  "assessmentType",
  "boeCopyMailed",
  "document",
  "dutyPayment",
  "ooc",
  "ocMail",
  "linerInvoice",
  "linerPayment",
  "paymentConfirm",
  "doDocs",
  "doReceived",
  "stampDuty",
  "performaInvoice",
  "cfsPayment",
  "delivery",
  "vendorInvoices",
];

function loadCustomOptions(field: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CUSTOM_OPTS_KEY);
    if (!raw) return [];
    const map = JSON.parse(raw) as Record<string, string[]>;
    return map[field] ?? [];
  } catch {
    return [];
  }
}

function saveCustomOption(field: string, value: string) {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(CUSTOM_OPTS_KEY);
    const map = (raw ? JSON.parse(raw) : {}) as Record<string, string[]>;
    const cur = map[field] ?? [];
    if (!cur.includes(value)) map[field] = [...cur, value];
    window.localStorage.setItem(CUSTOM_OPTS_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

function buildDefaults<T>(fields: FieldDef[], initial?: Partial<T>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const f of fields) {
    const fromInitial = (initial as Record<string, unknown> | undefined)?.[f.name];
    if (fromInitial !== undefined) {
      out[f.name] = fromInitial;
    } else if (f.default !== undefined) {
      out[f.name] = f.default;
    } else if (f.type === "number") {
      out[f.name] = "";
    } else if (f.type === "switch") {
      out[f.name] = false;
    } else if (f.type === "services") {
      out[f.name] = {};
    } else {
      out[f.name] = "";
    }
  }
  return out;
}

export function EntityFormDialog<T>({
  
  open,
  onOpenChange,
  title,
  fields,
  defaultValues,
  submitLabel = "Save",
  onSubmit,
  watchField,
  onWatchChange,
  banner,
}: Props<T>) {
  
  const formId = useId();

const stableDefaults = useMemo(
  () => buildDefaults<T>(fields, defaultValues),
  [fields, defaultValues],
);

const {
  register,
  handleSubmit,
  reset,
  watch,
  control,
  setValue,
  formState: { errors, isSubmitting },
} = useForm<Record<string, unknown>>({
  defaultValues: stableDefaults,
});


const { data: nextCustomerCode } = useNextCustomerCode();
const { data: nextImportJobNumber } = useNextImportJobNumber();

const [errorDialog, setErrorDialog] = useState(false);
const [errorMessage, setErrorMessage] = useState("");
const initialized = useRef(false);
const hasAutoScrolled = useRef(false);


useEffect(() => {
  if (!open) {
    initialized.current = false;
    return;
  }

  const values = buildDefaults<T>(fields, defaultValues);

  if (title === "Update Job") {
    const today = new Date().toISOString().split("T")[0];

    const dateFields = [
      "igmDate",
      "inwardDate",
      "beDate",
      "doValidity",
    ];

    dateFields.forEach((field) => {
      if (!values[field]) {
        values[field] = today;
      }
    });
  }

  reset(values);
}, [open, defaultValues, fields, reset, title]);

  const watched = watch();
  const currentStage = useMemo(() => {
  if (title !== "Update Job") return null;

  for (const stage of IMPORT_WORKFLOW) {
    if (watched[stage] !== "Done") {
      return stage;
    }
  }

  return IMPORT_WORKFLOW[IMPORT_WORKFLOW.length - 1];
}, [title, watched]);



const currentStageIndex = IMPORT_WORKFLOW.indexOf(currentStage ?? "");

  const getFieldStatus = (fieldName: string) => {
  if (title !== "Update Job") return "pending";

  const value = watched[fieldName];

  const completed =
    value === "Done" ||
    value === "Yes" ||
    (typeof value === "string" &&
      value.trim() !== "" &&
      value !== "Pending" &&
      value !== "No");

  if (completed) return "completed";

  if (currentStage === fieldName) return "current";

  return "pending";
};

const isWorkflowFieldLocked = (fieldName: string) => {



  if (title !== "Update Job") return false;

  const index = IMPORT_WORKFLOW.indexOf(fieldName);

  if (index === -1) return false;

  // Only the current stage is editable.
  return index !== currentStageIndex;
};

  useEffect(() => {
  if (!open || !currentStage) return;

  requestAnimationFrame(() => {
    document
      .getElementById(`workflow-${currentStage}`)
      ?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
  });
}, [open, currentStage]);
  // Notify parent when watched field changes.
  const watchedValue = watchField ? String(watched[watchField] ?? "") : "";
  useEffect(() => {
    if (watchField && onWatchChange) onWatchChange(watchedValue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedValue]);

  const isVisible = (f: FieldDef): boolean => {
    if (!f.showWhen) return true;
    const v = String(watched[f.showWhen.field] ?? "");
    const eq = f.showWhen.equals;
    return Array.isArray(eq) ? eq.includes(v) : v === eq;
  };



   const [successDialog, setSuccessDialog] = useState(false);
const [createdCustomer, setCreatedCustomer] = useState<Record<string, unknown>>({});
const [vendorSuccessDialog, setVendorSuccessDialog] = useState(false);
const [createdVendor, setCreatedVendor] = useState<Record<string, unknown>>({});
const [errorTitle, setErrorTitle] = useState("Duplicate Record");
const [importSuccessDialog, setImportSuccessDialog] = useState(false);
const [updatedImportSuccessDialog, setUpdatedImportSuccessDialog] = useState(false);
const [exportMenuOpen, setExportMenuOpen] = useState(false);

const [createdImportJob, setCreatedImportJob] = useState<Record<string, unknown>>({});
  if (!open) return null;

  
 

const submit = handleSubmit(async (raw) => {
  const cleaned: Record<string, unknown> = {};

  for (const f of fields) {
    const v = raw[f.name];
    if (f.type === "file") {
  cleaned[f.name] = v;
  continue;
}

    if (f.type === "number") {
      cleaned[f.name] =
        v === "" || v === null || v === undefined
          ? undefined
          : Number(v);
    } else if (f.type === "switch") {
      cleaned[f.name] = Boolean(v);
    } else {
      cleaned[f.name] = v;
    }
  }

let saved;

const validateServices = (
  services?: Record<string, ServiceItem>
): string | null => {
  if (!services) return null;

  for (const [name, service] of Object.entries(services)) {
    if (service.status !== "Done") continue;

    // Tariff Unit required
    if (!service.unit) {
      return `${name}: Tariff Unit is required.`;
    }

    // BL -> single Tariff Amount required
    if (service.unit === "BL") {
      if (
        service.tariff === undefined ||
        service.tariff === null
      ) {
        return `${name}: Tariff Amount is required.`;
      }

      continue;
    }

    // Container -> user must select 20 and/or 40
    if (service.unit === "Container") {
      if (!service.enable20 && !service.enable40) {
        return `${name}: Select Container Size 20 or 40.`;
      }

      // Only require 20 tariff if 20 is checked
      if (
        service.enable20 &&
        (service.tariff20 === undefined ||
          service.tariff20 === null)
      ) {
        return `${name}: 20 FT Tariff Amount is required.`;
      }

      // Only require 40 tariff if 40 is checked
      if (
        service.enable40 &&
        (service.tariff40 === undefined ||
          service.tariff40 === null)
      ) {
        return `${name}: 40 FT  Tariff Amount is required.`;
      }
    }
  }

  return null;
};

const serviceError =
  validateServices(
    cleaned.otherGovAgencyType as Record<string, ServiceItem>
  ) ??
  validateServices(
    cleaned.otherServices as Record<string, ServiceItem>
  );

if (serviceError) {
  setErrorTitle("Validation Error");
  setErrorMessage(serviceError);
  setErrorDialog(true);
  return;
}


try {
  console.log(
  JSON.stringify(cleaned.otherGovAgencyType, null, 2)
);


  saved = await onSubmit(cleaned as Partial<T>);
 
  
} catch (e) {
  const message =
    e instanceof Error ? e.message : "Operation failed.";

  if (title === "Update Job") {
    setErrorTitle("Validation Error");
  }

  setErrorMessage(message);
  setErrorDialog(true);
  return;
}

if (title === "New Customer") {
    setCreatedCustomer(saved as Record<string, unknown>);
    setSuccessDialog(true);
    return;
}

if (title === "New Vendor") {
  setCreatedVendor(saved as Record<string, unknown>);
  setVendorSuccessDialog(true);
  return;
}

if (title === "New Import Job") {
    setCreatedImportJob((saved ?? cleaned) as Record<string, unknown>);
    setImportSuccessDialog(true);
    return;
}

if (title === "Update Job") {
  // console.log("createdImportJob", saved);

  setCreatedImportJob({
    ...(saved as Record<string, unknown>),
  });

  setUpdatedImportSuccessDialog(true);
  return;
}

onOpenChange(false);
});

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-end bg-foreground/20 backdrop-blur-sm sm:items-center sm:justify-center"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="relative w-full max-w-4xl overflow-hidden rounded-t-2xl border border-border bg-card shadow-elevated sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
  <h2 className="text-sm font-semibold tracking-tight">{title}</h2>

  <div className="flex items-center gap-2">

    {/* {title === "Update Job" && (
      <Popover
        open={exportMenuOpen}
        onOpenChange={setExportMenuOpen}
      >
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="h-9 gap-2"
          >
            <Download className="h-4 w-4" />

            Export Excel

            <ChevronDown className="h-4 w-4" />
          </Button>
        </PopoverTrigger>

        <PopoverContent
          align="end"
          className="w-56 p-1"
        >
          <button
            type="button"
            className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-accent"
          >
            All Jobs
          </button>

          <button
            type="button"
            className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-accent"
          >
            OC Jobs
          </button>

          <button
            type="button"
            className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-accent"
          >
            DO Jobs
          </button>

          <button
            type="button"
            className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-accent"
          >
            Pending Jobs
          </button>

          <button
            type="button"
            className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-accent"
          >
            Closed Jobs
          </button>
        </PopoverContent>
      </Popover>
    )} */}

    <button
      type="button"
      onClick={() => onOpenChange(false)}
      className="rounded p-1 text-muted-foreground hover:bg-accent"
      aria-label="Close"
    >
      ✕
    </button>

  </div>
</div>
        {banner && (
          <div className="flex items-center justify-center border-b border-border bg-muted/40 px-5 py-2.5 text-center">
            {banner}
          </div>
        )}
        <form id={formId} onSubmit={submit} className="grid max-h-[75dvh] grid-cols-1 gap-x-4 gap-y-3 overflow-y-auto px-5 py-4 sm:grid-cols-2 lg:grid-cols-3">

          {title === "New Import Job" && (
  <div className="border-b border-border bg-muted/20 px-5 py-4">
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-border bg-background p-4">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10">
          <FileText className="h-5 w-5 text-primary" />
        </div>

        <div>
          <p className="text-sm font-semibold">
            Auto-fill from PDF
          </p>

          <p className="text-xs text-muted-foreground">
            Upload Bill of Entry / Import Checklist PDF to fill Import Job details.
          </p>
        </div>
      </div>

      <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground shadow-sm hover:opacity-95">
        <Upload className="h-4 w-4" />

        Read PDF

        <input
          type="file"
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={async (e) => {
  const file = e.target.files?.[0];

  if (!file) return;

  try {
    const formData = new FormData();
    formData.append("file", file);

    const API_URL = import.meta.env.VITE_API_URL;

    const response = await fetch(
      `${API_URL}/import-jobs/read-pdf`,
      {
        method: "POST",
        body: formData,
      },
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.detail || "Unable to read PDF.",
      );
    }

    const data = result.data ?? {};

    console.log("PDF extracted:", data);

  const pdfFields: Record<string, unknown> = {
  blNo: data.blNo,
  blDate: data.blDate,
  invoiceNo: data.invoiceNo,
  invoiceDate: data.invoiceDate,
  consigneeName: data.consigneeName,
  noOfCntr: data.noOfCntr,
  size: data.size,
  cargoDescription: data.cargoDescription,
};  

    Object.entries(pdfFields).forEach(
  ([fieldName, value]) => {
    if (
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {
      setValue(
        fieldName as any,
        value as any,
        {
          shouldDirty: true,
          shouldValidate: true,
        },
      );
    }
  },
);

    const filledCount = Object.values(pdfFields).filter(
  (value) =>
    value !== undefined &&
    value !== null &&
    value !== "",
).length;

toast.success(
  `PDF read successfully. ${filledCount} fields auto-filled. Please verify before saving.`,
);
  } catch (error: any) {
    console.error("PDF read error:", error);

    toast.error(
      error?.message || "Unable to read PDF."
    );

  } finally {
    e.target.value = "";
  }
}}
        />
      </label>
    </div>
  </div>
)}

          {fields.filter(isVisible).map((f) => {
            const err = errors[f.name]?.message as string | undefined;
            const fieldStatus = getFieldStatus(f.name);
            const completedField = fieldStatus === "completed";

const borderClass =
  title === "Update Job"
    ? fieldStatus === "completed"
      ? "border-green-500 bg-green-50 focus:border-green-500 focus:ring-green-200"
      : fieldStatus === "current"
      ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100 focus:border-blue-500 focus:ring-blue-200"
      : "border-gray-300"
    : "border-border focus:border-ring focus:ring-ring/20";

const baseInput =
  `h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none transition-colors focus:ring-2 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground ${borderClass}`;
            const spanClass =
              f.colSpan === 3
                ? "sm:col-span-2 lg:col-span-3"
                : f.colSpan === 2 || f.type === "textarea" || f.type === "services"
                ? "sm:col-span-2"
                : "";
            return (
              // <div key={f.name} className={`space-y-1.5 ${spanClass}`}> 
              <div
  id={`workflow-${f.name}`}
  key={f.name}
  className={`space-y-1.5 rounded-lg p-1 transition-all ${
    fieldStatus === "current"
      ? "bg-blue-50/40"
      : fieldStatus === "completed"
      ? "bg-green-50/20"
      : ""
  } ${spanClass}`}
>
       <label
  className={`flex items-center gap-2 text-xs font-medium ${
    getFieldStatus(f.name) === "completed"
      ? "text-green-700"
      : getFieldStatus(f.name) === "current"
      ? "text-blue-700"
      : "text-gray-600"
  }`}
>

  {title === "Update Job" && (
    <span
      className={`h-2.5 w-2.5 rounded-full ${
        getFieldStatus(f.name) === "completed"
          ? "bg-green-500"
          : getFieldStatus(f.name) === "current"
          ? "bg-blue-500"
          : "bg-gray-400"
      }`}
    />
  )}

  <span>{f.label}</span>

  {f.required && (
    <span className="ml-0.5 text-destructive">*</span>
  )}
</label>
                  
                {f.type === "services" ? (
                  <Controller
                    control={control}
                    name={f.name}
                    render={({ field: ctl }) => (
                      <ServicesChecklist
                        options={f.options ?? []}
                        statusOptions={f.serviceStatusOptions ?? ["Pending", "Done"]}
                        value={
  ctl.value && typeof ctl.value === "object" && !Array.isArray(ctl.value)
    ? (ctl.value as Record<string, ServiceItem>)
    : {}
}
                        onChange={ctl.onChange}
                      />
                    )}
                  />
                ) : f.name === "jobNo" && title === "Update Job" ? (
                   <SearchableJobSelect
    field={f}
    className={baseInput}
    control={control}
    locked={!!f.readOnly}
  />
  ) : f.type === "select" ? (
  <DynamicSelect
  field={f}
  className={baseInput}
  locked={!!f.readOnly}
  register={register(f.name, {
    required: f.required ? `${f.label} is required` : false,
  })}
  setErrorDialog={setErrorDialog}
  setErrorMessage={setErrorMessage}
  setErrorTitle={setErrorTitle}
/>
                ) : f.type === "textarea" ? (
                  <textarea
                    placeholder={f.placeholder}
                    rows={2}
                    // readOnly={f.readOnly} 
                    // readOnly={f.readOnly || isWorkflowFieldLocked(f.name)}
                    readOnly={f.readOnly}
                    className={`${baseInput} h-auto py-2`}
                    {...register(f.name, {
                      required: f.required ? `${f.label} is required` : false,
                    })}
                  />
                ) : f.type === "switch" ? (
                  <label className="inline-flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      disabled={f.readOnly}
                      className="size-4 rounded border-border accent-brand"
                      {...register(f.name)}
                    />
                    <span className="text-muted-foreground">Enable</span>
                  </label>
                ) : f.type === "file" ? (

  <div className="space-y-2">
  <input
    type="file"
    accept=".pdf,.jpg,.jpeg,.png"
    className={baseInput}
    onChange={(e) => {
      const file = e.target.files?.[0];

      if (file) {
        setValue(f.name, file);
      }
    }}
  />

  {watch(f.name) instanceof File && (
    <p className="text-xs text-muted-foreground">
      Selected: {(watch(f.name) as File).name}
    </p>
  )}
</div>

) : (
           <div className="relative">
  <input
    type={f.type === "date" ? "date" : f.type === "number" ? "number" : "text"}
    min={
      f.name === "eta"
        ? new Date().toISOString().split("T")[0]
        : undefined
    }
    placeholder={f.placeholder}
    readOnly={f.readOnly || isWorkflowFieldLocked(f.name)}
    className={baseInput}
    {...register(f.name, {
      required: f.required ? `${f.label} is required` : false,
      min:
        f.type === "number" && f.min != null
          ? { value: f.min, message: `Minimum ${f.min}` }
          : undefined,
      max:
        f.type === "number" && f.max != null
          ? { value: f.max, message: `Maximum ${f.max}` }
          : undefined,
      pattern: f.email
        ? {
            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            message: "Invalid email",
          }
        : f.pattern,
    })}
  />
</div>
                )}
                {f.hint && !err && (
                  <p className="text-[11px] text-muted-foreground">{f.hint}</p>
                )}
                {err && <p className="text-[11px] font-medium text-destructive">{err}</p>}
              </div>
            );
          })}
        </form>
        <div className="flex items-center justify-end gap-2 border-t border-border bg-muted/40 px-5 py-3">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-accent"
          >
            Cancel
          </button>
          <button
            type="submit"
            form={formId}
            disabled={isSubmitting}
            className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-soft hover:opacity-95 disabled:opacity-60"
          >
            {isSubmitting ? "Saving…" : submitLabel}
          </button>
        </div>

          {vendorSuccessDialog && (
  <div className="fixed inset-0 z-[100] grid place-items-center bg-black/40 backdrop-blur-sm">
    <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl">

      <Logo
        size={80}
        className="mx-auto justify-center"
        showWordmark={false}
      />

      <h2 className="mt-5 text-2xl font-bold text-green-600">
        Vendor Created Successfully
      </h2>

      <div className="mt-6 space-y-2 text-sm">

        <div>
          <strong>Vendor Code</strong>
          <br />
          {(createdVendor.vendor_code as string) ?? ""}
        </div>

        <div>
          <strong>Vendor Name</strong>
          <br />
          {(createdVendor.vendor_name as string) ?? ""}
        </div>

      </div>

      <button
        className="mt-8 w-full rounded-lg bg-primary py-2 font-semibold text-white"
        onClick={() => {
          setVendorSuccessDialog(false);
          onOpenChange(false);
        }}
      >
        OK
      </button>

    </div>
  </div>
)}

            {successDialog && (
  <div className="fixed inset-0 z-[100] grid place-items-center bg-black/40 backdrop-blur-sm">
    <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl">

      <Logo
    size={80}
    className="mx-auto justify-center"
    showWordmark={false}
/>

      <h2 className="mt-5 text-2xl font-bold text-green-600">
        Customer Created Successfully
      </h2>

      <div className="mt-6 space-y-2 text-sm">

        <div>
          <strong>Customer Code</strong>
          <br />
          {(createdCustomer.customer_code as string) ?? ""}
        </div>

        <div>
          <strong>Customer Name</strong>
          <br />
          {(createdCustomer.customer_name as string) ?? ""}
        </div>

      </div>

      <button
        className="mt-8 w-full rounded-lg bg-primary py-2 font-semibold text-white"
        onClick={() => {
          setSuccessDialog(false);
          onOpenChange(false);
        }}
      >
        OK
      </button>

    </div>
  </div>
)}

{importSuccessDialog && (
  <div className="fixed inset-0 z-[100] grid place-items-center bg-black/40 backdrop-blur-sm">
    <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl">

      <Logo
        size={80}
        className="mx-auto justify-center"
        showWordmark={false}
      />

      <h2 className="mt-5 text-2xl font-bold text-green-600">
        Import Job Created Successfully
      </h2>

      <div className="mt-6 space-y-2 text-sm">

        <div>
          <strong>Job Number</strong>
          <br />
          {(createdImportJob.jobNo as string) ??
            (createdImportJob.job_number as string) ??
            ""}
        </div>

        <div>
          <strong>BL No</strong>
          <br />
          {(createdImportJob.blNo as string) ??
            (createdImportJob.bl_no as string) ??
            ""}
        </div>

      </div>

      <button
        className="mt-8 w-full rounded-lg bg-primary py-2 font-semibold text-white"
        onClick={() => {
          setImportSuccessDialog(false);
          onOpenChange(false);
        }}
      >
        OK
      </button>

    </div>
  </div>
)}

{updatedImportSuccessDialog && (
  <div className="fixed inset-0 z-[100] grid place-items-center bg-black/40 backdrop-blur-sm">
    <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl">

      <Logo
        size={80}
        className="mx-auto justify-center"
        showWordmark={false}
      />

      <h2 className="mt-5 text-2xl font-bold text-green-600">
        Workflow Updated Successfully
      </h2>

      <div className="mt-6 space-y-2 text-sm">

        <div>
          <strong>Job Number</strong>
          <br />
          {(createdImportJob.jobNo as string) ??
            (createdImportJob.job_number as string) ??
            ""}
        </div>

        <div>
          <strong>BL No</strong>
          <br />
          {(createdImportJob.blNo as string) ??
            (createdImportJob.bl_no as string) ??
            ""}
        </div>

      </div>

      <button
        className="mt-8 w-full rounded-lg bg-primary py-2 font-semibold text-white"
        onClick={() => {
          setUpdatedImportSuccessDialog(false);
          onOpenChange(false);
        }}
      >
        OK
      </button>

    </div>
  </div>
)}



{errorDialog && (
  <div className="fixed inset-0 z-[300] grid place-items-center bg-black/40 backdrop-blur-sm">
    <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl">

      <Logo
        size={70}
        className="mx-auto justify-center"
        showWordmark={false}
      />

      <h2 className="mt-5 text-2xl font-bold text-red-600">
  {errorTitle}
</h2>

      <p className="mt-5 text-sm">
        {errorMessage}
      </p>

      <button
        className="mt-8 w-full rounded-lg bg-primary py-2 font-semibold text-white"
        onClick={() => setErrorDialog(false)}
      >
        OK
      </button>

    </div>
  </div>
)}

      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  destructive = false,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm: () => void | Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[200] grid place-items-center bg-foreground/20 backdrop-blur-sm"
      onClick={() => !busy && onOpenChange(false)}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-elevated"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{description}</p>
        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            onClick={() => onOpenChange(false)}
            disabled={busy}
            className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-accent disabled:opacity-60"
          >
            Cancel
          </button>
          <button
  onClick={async () => {
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
    }
  }}
            disabled={busy}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-soft hover:opacity-95 disabled:opacity-60 ${
              destructive ? "bg-destructive" : "bg-primary"
            }`}
          >
            {busy ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

type RegisterReturn = ReturnType<ReturnType<typeof useForm<Record<string, unknown>>>["register"]>;

function DynamicSelect({
  field,
  className,
  register,
  locked,
  setErrorDialog,
  setErrorMessage,
  setErrorTitle,
}: {
  field: FieldDef;
  className: string;
  register: RegisterReturn;
  locked: boolean;
  setErrorDialog: (v: boolean) => void;
  setErrorMessage: (v: string) => void;
  setErrorTitle: (v: string) => void;
}) {
  const src = field.optionsSource;
  // const queryClient = useQueryClient();
const entityKey = (
  field.name === "transporter"
    ? "vendors"
    : src?.entity ?? "customers"
) as EntityKey;

const query = useEntityAll(entityKey);

  const [customOpts, setCustomOpts] = useState<string[]>(() =>
    field.creatable ? loadCustomOptions(field.name) : [],
  );
  const [showAdd, setShowAdd] = useState(false);
  const [newOpt, setNewOpt] = useState("");
  const [showManage, setShowManage] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
const [selectedLineName, setSelectedLineName] = useState("");
  const [lineNames, setLineNames] = useState<string[]>([]);
const [dropdownLineNames, setDropdownLineNames] = useState<string[]>([]);
const [editDialog, setEditDialog] = useState(false);
const [editingLineName, setEditingLineName] = useState("");
const [newLineName, setNewLineName] = useState("");
const [editLineName, setEditLineName] = useState("");



useEffect(() => {
  const loader =
  field.name === "lineName"
    ? apiClient.getLineNames()
    : apiClient.getTypeOfServices();

loader.then((items) => {
    const names = items.map((x) => x.name);

    setDropdownLineNames(names);

    if (showManage) {
      setLineNames(names);
    }
  });
}, [showManage]);

  type Opt = { value: string; label: string };
  const dynamicOptions: Opt[] = useMemo(() => {
    if (src) {
      return Array.from(
        new Map(
          ((query.data ?? []) as unknown as Array<Record<string, unknown>>)
  .filter((r) => {
    if (field.name === "transporter") {
      return (
        String(r.type_of_service ?? "")
          .trim()
          .toLowerCase() === "transport"
      );
    }

    return true;
  })
  .map((r) => {
              const value = String(r[src.labelField] ?? "").trim();
              const secondary = src.secondaryLabelField
                ? String(r[src.secondaryLabelField] ?? "").trim()
                : "";
              const label = value && secondary ? `${value} — ${secondary}` : value;
              return [value, { value, label }] as const;
            })
            .filter(([v]) => v),
        ).values(),
      ).sort((a, b) => a.label.localeCompare(b.label));
    }
    const base =
 field.name === "lineName" ||
field.name === "type_of_service"
  ? dropdownLineNames
  : [...(field.options ?? []), ...customOpts];

return Array.from(new Set(base)).map((o) => ({
  value: o,
  label: o,
}));
}, [
  src,
  query.data,
  field.name,
  field.options,
  customOpts,
  dropdownLineNames,
]);
  const opts = dynamicOptions;

  const [open, setOpen] = useState(false);

const selectedValue =
  typeof register.name === "string" ? register.name : "";
  return (
    <div className="space-y-1">
      <select
    className={className}
    disabled={locked}
    {...register}
>
        <option value="">
          {src && query.isLoading ? "Loading…" : opts.length === 0 && src ? "No records yet" : "Select…"}
        </option>
        {opts.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {field.creatable &&
 !field.readOnly &&
 field.name !== "lineName" &&
 field.name !== "transporter" && (
        showAdd ? (
          <div className="flex items-center gap-1.5">
            <input
              autoFocus
              value={newOpt}
              onChange={(e) => setNewOpt(e.target.value)}
              placeholder="New option"
              className="h-8 flex-1 rounded-md border border-border bg-background px-2 text-xs outline-none focus:border-ring"
            />
            <button
              type="button"
              onClick={() => {
                const v = newOpt.trim();
                if (!v) return;
                saveCustomOption(field.name, v);
                setCustomOpts((prev) => (prev.includes(v) ? prev : [...prev, v]));
                setNewOpt("");
                setShowAdd(false);
              }}
              className="h-8 rounded-md bg-primary px-2 text-[11px] font-medium text-primary-foreground hover:opacity-95"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAdd(false);
                setNewOpt("");
              }}
              className="h-8 rounded-md border border-border bg-background px-2 text-[11px] hover:bg-accent"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="text-[11px] font-medium text-brand hover:underline"
          >
            + Add option
          </button>
        )
      )}

  {(field.name === "lineName" ||
  field.name === "type_of_service") && (
  <>
    <button
      type="button"
      onClick={() => setShowManage(true)}
      className="text-[11px] font-medium text-brand hover:underline"
    >
      {field.name === "lineName"
  ? "⚙ Manage Line Names"
  : "⚙ Manage Type of Services"}
    </button>

    {showManage && (
      <div className="fixed inset-0 z-[120] grid place-items-center bg-black/40">
        <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">

          <h3 className="text-lg font-semibold">
            {field.name === "lineName"
  ? "Manage Line Names"
  : "Manage Type of Services"}
          </h3>

      <div className="mt-4 space-y-3">

  <div className="flex gap-2">
    <input
      value={newLineName}
      onChange={(e) => setNewLineName(e.target.value)}
     placeholder={
  field.name === "lineName"
    ? "New Line Name"
    : "New Type of Service"
}
      className="flex-1 rounded-md border px-3 py-2 text-sm"
    />

    <button
      type="button"
      onClick={async () => {
        const value = newLineName.trim();

        if (!value) return;

      if (field.name === "lineName") {
  await apiClient.createLineName(value);
} else {
  await apiClient.createTypeOfService(value);
}

const items =
  field.name === "lineName"
    ? await apiClient.getLineNames()
    : await apiClient.getTypeOfServices();
const names = items.map((x) => x.name);

setLineNames(names);
setDropdownLineNames(names);


setNewLineName("");
      }}
      className="rounded-md bg-primary px-4 py-2 text-white"
    >
      Add
    </button>
  </div>

  {lineNames.map((name) => (
  <div
    key={name}
    className="flex items-center justify-between rounded-lg border px-3 py-2"
  >
      <span>{name}</span>

      <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => {
          setEditingLineName(name);
setEditLineName(name);
setEditDialog(true);
        }}
      >
        <Pencil className="h-4 w-4 text-blue-600" />
      </button>

      <button
        type="button"
        onClick={() => {
          setSelectedLineName(name);
          setDeleteDialog(true);
        }}
      >
        <Trash2 className="h-4 w-4 text-red-600" />
      </button>
    </div>
    </div>
  ))}

</div>

          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={() => {
  setDeleteDialog(false);
  setSelectedLineName("");
  setShowManage(false);
}}
              className="rounded-lg border px-4 py-2"
            >
              Close
            </button>
          </div>

        </div>
      </div>
    )}
{editDialog && (
  <div className="fixed inset-0 z-[250] grid place-items-center bg-black/40">
    <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">

      <h3 className="text-lg font-semibold">
        {field.name === "lineName"
  ? "Edit Line Name"
  : "Edit Type of Service"}
      </h3>

      <input
        value={editLineName}
        onChange={(e) => setEditLineName(e.target.value)}
        className="mt-4 w-full rounded-md border px-3 py-2"
      />

      <div className="mt-5 flex justify-end gap-2">

        <button
          type="button"
          onClick={() => {
            setEditDialog(false);
            setEditingLineName("");
            setEditLineName("");
          }}
          className="rounded-lg border px-4 py-2"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={async () => {
            try {
             if (field.name === "lineName") {
  await apiClient.updateLineName(
    editingLineName,
    editLineName.trim(),
  );
} else {
  await apiClient.updateTypeOfService(
    editingLineName,
    editLineName.trim(),
  );
}

const items =
  field.name === "lineName"
    ? await apiClient.getLineNames()
    : await apiClient.getTypeOfServices();
              const names = items.map((x) => x.name);

              setLineNames(names);
              setDropdownLineNames(names);

              setEditDialog(false);
              setEditingLineName("");
              setEditLineName("");
              

            } catch (e) {
              setErrorTitle("Update Failed");
              setErrorMessage(
                e instanceof Error
                  ? e.message
                  : "Unable to update Line Name."
              );
              setErrorDialog(true);
            }
          }}
          className="rounded-lg bg-primary px-4 py-2 text-white"
        >
          Save
        </button>

      </div>

    </div>
  </div>
)}


  {showManage && (
  <>
    {/* {console.log("Confirm open =", deleteDialog)} */}

    <ConfirmDialog
      open={deleteDialog}
      onOpenChange={setDeleteDialog}
      title="Delete Line Name"
      description={`Are you sure you want to delete "${selectedLineName}"?`}
      confirmLabel="Delete"
      destructive
      onConfirm={async () => {
  try {
    if (field.name === "lineName") {
  await apiClient.deleteLineName(selectedLineName);
} else {
  await apiClient.deleteTypeOfService(selectedLineName);
}

const items =
  field.name === "lineName"
    ? await apiClient.getLineNames()
    : await apiClient.getTypeOfServices();
    const names = items.map((x) => x.name);

    setLineNames(names);
    setDropdownLineNames(names);

    setSelectedLineName("");
    setDeleteDialog(false);   // Close only on success

  }  catch (e) {
  setErrorTitle("Cannot Delete");
  setDeleteDialog(false); 
  setErrorMessage(
    e instanceof Error
      ? e.message
      : "Cannot delete. This Line Name is already used in Import Jobs."
  );

  setErrorDialog(true);
}
}}
    />
  </>
)}
  </>

  
)}
    </div>
  );
}

type ServiceItem = {
  status: string;
  unit?: string;

  tariff?: number;

  tariff20?: number;
  tariff40?: number;

  enable20?: boolean;
  enable40?: boolean;
};

function ServicesChecklist({
  options,
  statusOptions,
  value,
  onChange,
}: {
  options: string[];
  statusOptions: string[];
  value: Record<string, ServiceItem>;
  onChange: (v: Record<string, ServiceItem>) => void;
}) {
  const updateService = (
    opt: string,
    patch: Partial<ServiceItem>,
  ) => {
    onChange({
      ...value,
      [opt]: {
        ...(value[opt] ?? {
          status: statusOptions[0] ?? "Pending",
        }),
        ...patch,
      },
    });
  };

  const toggle = (opt: string, checked: boolean) => {
    if (!checked) {
      const next = { ...value };
      delete next[opt];
      onChange(next);
      return;
    }

 onChange({
  ...value,
  [opt]: {
    status: statusOptions[0] ?? "Pending",
    unit: undefined,
    tariff: undefined,
    tariff20: undefined,
    tariff40: undefined,
    enable20: false,
    enable40: false,
  },
});
  };

  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <div className="space-y-3">
        {options.map((opt) => {
          const service = value[opt];
          const checked = !!service;
          const status = service?.status ?? "Pending";

          return (
            <div
              key={opt}
              className={`rounded-lg border p-3 ${
                checked && status === "Done"
                  ? "border-green-500 bg-green-50"
                  : "border-gray-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) =>
                    toggle(opt, e.target.checked)
                  }
                  className="size-4"
                />

                <span className="font-medium">{opt}</span>
              </div>

              {checked && (
                <div className="mt-3 space-y-3 border-t pt-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium">
                      Job Status
                    </label>

                    <select
                      value={status}
                      onChange={(e) =>
                        updateService(opt, {
                          status: e.target.value,
                        })
                      }
                      className="h-9 w-full rounded-md border px-2"
                    >
                      {statusOptions.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

             {status === "Done" && (
  <>
    {/* Tariff Unit FIRST */}
    <div>
      <label className="mb-1 block text-xs font-medium">
        Tariff Unit
      </label>

      <select
        value={service?.unit ?? ""}
        onChange={(e) => {
          const unit = e.target.value || undefined;

         updateService(opt, {
  unit,
  tariff: undefined,
  tariff20: undefined,
  tariff40: undefined,
  enable20: false,
  enable40: false,
});
        }}
        className="h-9 w-full rounded-md border px-2"
      >
        <option value="">Select</option>
        <option value="Container">Container</option>
        <option value="BL">BL</option>
      </select>
    </div>

    {/* Container selected -> separate 20 & 40 inputs */}


   {service?.unit === "Container" && (
  <div className="space-y-3">
<label className="mb-1 block text-xs font-medium">
  Container Size
</label>

<div className="flex gap-6">
      {/* 20 FT */}
      <label className="flex items-center gap-2 text-base font-semibold text-gray-900">
        <input
          type="checkbox"
          checked={!!service?.enable20}
          onChange={(e) =>
            updateService(opt, {
              enable20: e.target.checked,
              tariff20: e.target.checked
                ? service?.tariff20
                : undefined,
            })
          }
          className="h-5 w-5"
        />
        20 FT
      </label>

      {/* 40 FT */}
      <label className="flex items-center gap-2 text-base font-semibold text-gray-900">
        <input
          type="checkbox"
          checked={!!service?.enable40}
          onChange={(e) =>
            updateService(opt, {
              enable40: e.target.checked,
              tariff40: e.target.checked
                ? service?.tariff40
                : undefined,
            })
          }
          className="h-5 w-5"
        />
        40 FT
      </label>
    </div>

    {/* 20 Tariff */}
    {service?.enable20 && (
      <div>
        <label className="mb-1 block text-sm font-semibold">
          20 FT Tariff Amount
        </label>

        <input
          type="number"
          value={service?.tariff20 ?? ""}
          onChange={(e) =>
            updateService(opt, {
              tariff20:
                e.target.value === ""
                  ? undefined
                  : Number(e.target.value),
            })
          }
          placeholder="Enter 20 Tariff"
          className="h-9 w-full rounded-md border px-2"
        />
      </div>
    )}

    {/* 40 Tariff */}
    {service?.enable40 && (
      <div>
        <label className="mb-1 block text-sm font-semibold">
          40 FT Tariff Amount
        </label>

        <input
          type="number"
          value={service?.tariff40 ?? ""}
          onChange={(e) =>
            updateService(opt, {
              tariff40:
                e.target.value === ""
                  ? undefined
                  : Number(e.target.value),
            })
          }
          placeholder="Enter 40 Tariff"
          className="h-9 w-full rounded-md border px-2"
        />
      </div>
    )}
  </div>
)}

{/* BL selected -> single tariff input */}
{service?.unit === "BL" && (
  <div>
    <label className="mb-1 block text-xs font-medium">
      Tariff Amount
    </label>

    <input
      type="number"
      value={service?.tariff ?? ""}
      onChange={(e) =>
        updateService(opt, {
          tariff:
            e.target.value === ""
              ? undefined
              : Number(e.target.value),
        })
      }
      placeholder="Enter Tariff Amount"
      className="h-9 w-full rounded-md border px-2"
    />
  </div>
)}
                  </>
                )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
           
       
    
  