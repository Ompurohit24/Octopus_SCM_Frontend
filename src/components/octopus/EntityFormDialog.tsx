// import { useId, useState, useEffect, useMemo, type ReactNode } from "react";
import { useId, useState, useEffect, useMemo, type ReactNode } from "react";
import { Logo } from "@/components/octopus/Logo";
import { useForm, Controller } from "react-hook-form";
import type { FieldDef } from "@/lib/entities";
import { useRef } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { ChevronsUpDown, Check } from "lucide-react";
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
const [errorTitle, setErrorTitle] = useState("Duplicate Record");
const [importSuccessDialog, setImportSuccessDialog] = useState(false);
const [updatedImportSuccessDialog, setUpdatedImportSuccessDialog] = useState(false);

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

try {
  saved = await onSubmit(cleaned as Partial<T>);
  
} catch (e) {
  setErrorMessage(
    e instanceof Error ? e.message : "Operation failed."
  );
  setErrorDialog(true);
  return;
}

if (title === "New Customer") {
    setCreatedCustomer(saved as Record<string, unknown>);
    setSuccessDialog(true);
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
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded p-1 text-muted-foreground hover:bg-accent"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        {banner && (
          <div className="flex items-center justify-center border-b border-border bg-muted/40 px-5 py-2.5 text-center">
            {banner}
          </div>
        )}
        <form id={formId} onSubmit={submit} className="grid max-h-[75dvh] grid-cols-1 gap-x-4 gap-y-3 overflow-y-auto px-5 py-4 sm:grid-cols-2 lg:grid-cols-3">


          {fields.filter(isVisible).map((f) => {
            const err = errors[f.name]?.message as string | undefined;
            const baseInput =
              "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/20 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground";
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
  className={`space-y-1.5 ${spanClass}`}
>
                <label className="text-xs font-medium text-foreground">
                  {f.label}
                  {f.required && <span className="ml-0.5 text-destructive">*</span>}
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
                            ? (ctl.value as Record<string, string>)
                            : typeof ctl.value === "string" && ctl.value
                            ? Object.fromEntries(
                                ctl.value.split(/[;,]/).map((s) => {
                                  const [k, v] = s.split(":").map((x) => x.trim());
                                  return [k, v || (f.serviceStatusOptions?.[0] ?? "Pending")];
                                }).filter(([k]) => k),
                              )
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
                  <input
  type={f.type === "date" ? "date" : f.type === "number" ? "number" : "text"}
  min={
    f.name === "eta"
      ? new Date().toISOString().split("T")[0]
      : undefined
  }
                    placeholder={f.placeholder}
                    // readOnly={f.readOnly} 
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

const query = useEntityAll(
  (src?.entity ?? "customers") as EntityKey
);
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
  apiClient.getLineNames().then((items) => {
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
  field.name === "lineName"
    ? dropdownLineNames
    : [...(field.options ?? []), ...customOpts];

return Array.from(new Set(base)).map((o) => ({
  value: o,
  label: o,
}));
  }, [
  src,
  query.data,
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
 field.name !== "lineName" && (
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

  {field.name === "lineName" && (
  <>
    <button
      type="button"
      onClick={() => setShowManage(true)}
      className="text-[11px] font-medium text-brand hover:underline"
    >
      ⚙ Manage Line Names
    </button>

    {showManage && (
      <div className="fixed inset-0 z-[120] grid place-items-center bg-black/40">
        <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">

          <h3 className="text-lg font-semibold">
            Manage Line Names
          </h3>

      <div className="mt-4 space-y-3">

  <div className="flex gap-2">
    <input
      value={newLineName}
      onChange={(e) => setNewLineName(e.target.value)}
      placeholder="New Line Name"
      className="flex-1 rounded-md border px-3 py-2 text-sm"
    />

    <button
      type="button"
      onClick={async () => {
        const value = newLineName.trim();

        if (!value) return;

      await apiClient.createLineName(value);

const items = await apiClient.getLineNames();
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
        Edit Line Name
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
              await apiClient.updateLineName(
                editingLineName,
                editLineName.trim(),
              );

              const items = await apiClient.getLineNames();
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
    await apiClient.deleteLineName(selectedLineName);

    const items = await apiClient.getLineNames();
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

function ServicesChecklist({
  options,
  statusOptions,
  value,
  onChange,
}: {
  options: string[];
  statusOptions: string[];
  value: Record<string, string>;
  onChange: (v: Record<string, string>) => void;
}) {
  const toggle = (opt: string, checked: boolean) => {
    const next = { ...value };
    if (checked) {
      if (!(opt in next)) next[opt] = statusOptions[0] ?? "";
    } else {
      delete next[opt];
    }
    onChange(next);
  };
  const setStatus = (opt: string, status: string) => {
    onChange({ ...value, [opt]: status });
  };
  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {options.map((opt) => {
          const checked = opt in value;
          return (
            <div
              key={opt}
              className="flex items-center justify-between gap-2 rounded-md border border-border/60 bg-card px-2.5 py-1.5"
            >
              <label className="flex flex-1 items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => toggle(opt, e.target.checked)}
                  className="size-4 rounded border-border accent-brand"
                />
                <span>{opt}</span>
              </label>
              {checked && (
                <select
                  value={value[opt] ?? ""}
                  onChange={(e) => setStatus(opt, e.target.value)}
                  className="h-7 rounded-md border border-border bg-background px-1.5 text-[11px] outline-none focus:border-ring"
                >
                  {statusOptions.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              )}
            </div>
          );
        })}

        
        
      </div>
    </div>
    
  );
}
