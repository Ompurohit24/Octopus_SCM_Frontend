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

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  savePendingRegistration,
  removePendingRegistration,
} from "@/lib/pendingRegistration";
import SearchableJobSelect from "@/components/octopus/SearchableJobSelect";

interface Props<T> {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  pendingRegistrationId?: string | null;
  onPendingRegistrationHandled?:
  () => void | Promise<void>;

  title: string;
  fields: FieldDef[];
  defaultValues?: Partial<T>;
  submitLabel?: string;

  onSubmit: (
    values: Partial<T>,
  ) => Promise<Partial<T>> | Partial<T>;

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
} else if (f.type === "emails") {
  out[f.name] = [""];
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
  pendingRegistrationId,
onPendingRegistrationHandled,
}: Props<T>) {
  
  const formId = useId();


const [otpOpen, setOtpOpen] =
  useState(false);

const [
  otpRegistration,
  setOtpRegistration,
] = useState<{
  registrationId: string;
  entityType: "customer" | "vendor";
  entityName: string;
  expiresAt: string;
  verificationFields: {
    key: string;
    label: string;
    email: string;
    verified?: boolean;
  }[];
} | null>(null);



const [otpSubmitting, setOtpSubmitting] =
  useState(false);



const [resendingKey, setResendingKey] =
  useState<string | null>(null);

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
const [
  transportationCancelDialog,
  setTransportationCancelDialog,
] = useState(false);

const [
  pendingTransportation,
  setPendingTransportation,
] = useState<{
  newValue: string;
  poNumber: string;
  vendorName: string;
} | null>(null);

const [
  checkingTransportation,
  setCheckingTransportation,
] = useState(false);

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

// Customer OTP verification
// -------------------------------------------------
// CUSTOMER / VENDOR REGISTRATION OTP
// -------------------------------------------------

type OTPVerificationField = {
  key: string;
  label: string;
  email: string;
  otp_sent?: boolean;
  verified?: boolean;
};

const [otpDialog, setOtpDialog] = useState(false);

const [registrationId, setRegistrationId] = useState("");

const [
  editingPendingRegistration,
  setEditingPendingRegistration,
] = useState(false);

const [registrationEntityType, setRegistrationEntityType] =
  useState<"customer" | "vendor" | null>(null);


  const [
  registrationOperationType,
  setRegistrationOperationType,
] = useState<
  "create" | "email_update"
>("create");

  const [
  registrationEntityName,
  setRegistrationEntityName,
] = useState("");



const [
  registrationExpiresAt,
  setRegistrationExpiresAt,
] = useState("");

const [otpVerificationFields, setOtpVerificationFields] =
  useState<OTPVerificationField[]>([]);

const [otpValues, setOtpValues] =
  useState<Record<string, string>>({});

const [otpError, setOtpError] = useState("");

const [otpLoading, setOtpLoading] = useState(false);



const openRegistrationOTPDialog = (
 response: {
  registration_id: string;
  entity_type: "customer" | "vendor";
  entity_name: string;
  expires_at?: string;
  verification_fields: OTPVerificationField[];
},
) => {
  setRegistrationId(response.registration_id);

  setRegistrationEntityType(
    response.entity_type,
  );



  setRegistrationExpiresAt(
  response.expires_at ?? "",
);

  setOtpVerificationFields(
    response.verification_fields ?? [],
  );

setEditingPendingRegistration(
  false,
);

  const initialOTPValues: Record<string, string> = {};

  for (
    const field of response.verification_fields ?? []
  ) {
    initialOTPValues[field.key] = "";
  }

  setOtpValues(initialOTPValues);

  setOtpError("");

  setOtpDialog(true);
};



// Customer OTP verification
// -------------------------------------------------
// CUSTOMER / VENDOR REGISTRATION OTP
// -------------------------------------------------


const [resendingOTPKey, setResendingOTPKey] =
  useState<string | null>(null);








const startRegistrationOTP = async (
  values: Record<string, any>,
) => {
  const isCustomer =
    title === "New Customer";

  const isVendor =
    title === "New Vendor";

  const isEditingPending =
  editingPendingRegistration &&
  Boolean(registrationId);

  if (!isCustomer && !isVendor) {
    return false;
  }

  const formData = new FormData();

  // -------------------------------------------------
  // COMMON FIELDS
  // -------------------------------------------------

  formData.set(
    "address",
    String(
      values.address ?? "",
    ),
  );

  formData.set(
    "countryCode",
    String(
      values.countryCode ?? "+91",
    ),
  );

  formData.set(
    "phone",
    String(
      values.phone ?? "",
    ),
  );

  formData.set(
    "gstin",
    String(
      values.gstin ?? "",
    ),
  );

  formData.set(
    "pan",
    String(
      values.pan ?? "",
    ),
  );

  // -------------------------------------------------
  // GST / PAN DOCUMENTS
  // -------------------------------------------------

  if (
    values.gstDocument instanceof File
  ) {
    formData.set(
      "gst_document",
      values.gstDocument,
    );
  }

  if (
    values.panDocument instanceof File
  ) {
    formData.set(
      "pan_document",
      values.panDocument,
    );
  }

  // =================================================
  // CUSTOMER
  // =================================================

  if (isCustomer) {
    formData.set(
  "customer_name",
  String(
    values.customer_name ?? "",
  ),
);

    formData.set(
      "management_email",
      String(
        values.managementEmail ?? "",
      ),
    );

    formData.set(
      "accounts_email",
      String(
        values.accountsEmail ?? "",
      ),
    );

    formData.set(
      "operations_email",
      String(
        values.operationsEmail ?? "",
      ),
    );

    formData.set(
      "tan",
      String(
        values.tan ?? "",
      ),
    );

   const result =
  isEditingPending
    ? await apiClient
        .updateCustomerRegistration(
          registrationId,
          formData,
        )
    : await apiClient
        .startCustomerRegistration(
          formData,
        );



    openRegistrationOTPDialog(
  result,
);

    return true;
  }

  // =================================================
  // VENDOR
  // =================================================

  // =================================================
// VENDOR
// =================================================

formData.set(
  "vendor_code",
  String(
    values.vendor_code ??
    values.vendorCode ??
    "",
  ),
);

formData.set(
  "vendor_name",
  String(
    values.vendor_name ??
    values.vendorName ??
    "",
  ).trim(),
);

formData.set(
  "email",
  String(
    values.email ?? "",
  ).trim(),
);

formData.set(
  "type_of_service",
  String(
    values.type_of_service ??
    values.typeOfService ??
    "",
  ).trim(),
);

const result =
  isEditingPending
    ? await apiClient
        .updateVendorRegistration(
          registrationId,
          formData,
        )
    : await apiClient
        .startVendorRegistration(
          formData,
        );

openRegistrationOTPDialog(
  result,
);
return true;
};


const editRegistrationDetails = () => {
  // We are editing the SAME pending registration.
  // The next Submit must call registration/update,
  // not registration/start.
  setEditingPendingRegistration(
    true,
  );

  // Close only OTP dialog.
  // Keep registrationId and form values.
  setOtpDialog(false);

  setOtpError("");

  setOtpValues({});
};

const verifyRegistrationOTP = async (
  field: OTPVerificationField,
) => {
  if (
    !registrationId ||
    !registrationEntityType
  ) {
    setOtpError(
      "Registration information is missing.",
    );
    return;
  }

  if (field.verified) {
    return;
  }

  const otp = String(
    otpValues[field.key] ?? "",
  ).trim();

  if (!otp) {
    setOtpError(
      `Enter OTP for ${field.label}.`,
    );
    return;
  }

  setOtpError("");
  setOtpLoading(true);

  try {
    let result;

    if (
      registrationEntityType ===
      "customer"
    ) {
      result =
        await apiClient
          .verifyCustomerRegistration({
            registration_id:
              registrationId,

            management_email_otp:
              field.key ===
              "management_email"
                ? otp
                : undefined,

            accounts_email_otp:
              field.key ===
              "accounts_email"
                ? otp
                : undefined,

            operations_email_otp:
              field.key ===
              "operations_email"
                ? otp
                : undefined,
          });
    } else {
      result =
        await apiClient
          .verifyVendorRegistration({
            registration_id:
              registrationId,

            otp,
          });
    }

    // ---------------------------------------------
    // MARK ONLY THIS EMAIL AS VERIFIED
    // ---------------------------------------------

    setOtpVerificationFields(
      (current) =>
        current.map(
          (item) =>
            item.key === field.key
              ? {
                  ...item,
                  verified: true,
                }
              : item,
        ),
    );

    setOtpValues(
      (current) => ({
        ...current,
        [field.key]: "",
      }),
    );

    // ---------------------------------------------
    // NOT ALL EMAILS VERIFIED YET
    // ---------------------------------------------
const operationCompleted =
  registrationOperationType === "email_update"
    ? result.updated === true
    : result.created === true;

if (
  !operationCompleted ||
  !result.all_verified
) {
  return;
}

// ---------------------------------------------
// FINAL OPERATION COMPLETED
// ---------------------------------------------

removePendingRegistration(
  registrationId,
);

setOtpDialog(false);

// ---------------------------------------------
// PREPARE SUCCESS DIALOG
// ---------------------------------------------

if (
  registrationEntityType ===
  "customer"
) {
  setCreatedCustomer(
    (
      result.customer ?? {}
    ) as Record<
      string,
      unknown
    >,
  );

  if (
    result.operation_type ===
      "email_update" ||
    registrationOperationType ===
      "email_update"
  ) {
    setRegistrationOperationType(
      "email_update",
    );
  } else {
    setRegistrationOperationType(
      "create",
    );
  }

  setSuccessDialog(true);
} else {
  setCreatedVendor(
    (
      result.vendor ?? {}
    ) as Record<
      string,
      unknown
    >,
  );

  if (
    result.operation_type ===
      "email_update" ||
    registrationOperationType ===
      "email_update"
  ) {
    setRegistrationOperationType(
      "email_update",
    );
  } else {
    setRegistrationOperationType(
      "create",
    );
  }

  setVendorSuccessDialog(true);
}

// ---------------------------------------------
// CLEAR OTP STATE
// ---------------------------------------------

setRegistrationId("");
setRegistrationEntityType(null);
setRegistrationEntityName("");
setRegistrationExpiresAt("");
setOtpVerificationFields([]);
setOtpValues({});
setOtpError("");

// ---------------------------------------------
// REFRESH PARENT
//
// Refreshes:
// - Customer / Vendor table
// - Pending Verifications
// ---------------------------------------------

if (onPendingRegistrationHandled) {
  await onPendingRegistrationHandled();
}

} catch (e) {
  setOtpError(
    e instanceof Error
      ? e.message
      : "OTP verification failed.",
  );
} finally {
  setOtpLoading(false);
}
};


const resendRegistrationOTP = async (
  emailKey: string,
) => {
  if (
    !registrationId ||
    !registrationEntityType
  ) {
    setOtpError(
      "Registration information is missing.",
    );

    return;
  }

  setOtpError("");
  setResendingOTPKey(emailKey);

  try {
    let result;

    // =================================================
    // CUSTOMER
    // =================================================

    if (
      registrationEntityType ===
      "customer"
    ) {
      result =
        await apiClient
          .resendCustomerRegistrationOTP(
            registrationId,
            emailKey,
          );
    }

    // =================================================
    // VENDOR
    // =================================================

    else {
      result =
        await apiClient
          .resendVendorRegistrationOTP(
            registrationId,
          );
    }

    if (!result.sent) {
      setOtpError(
        result.message ||
          "Unable to resend OTP.",
      );

      return;
    }

    // Clear only the OTP box that was resent.

    setOtpValues(
      (current) => ({
        ...current,
        [emailKey]: "",
      }),
    );

  } catch (e) {
    setOtpError(
      e instanceof Error
        ? e.message
        : "Unable to resend OTP.",
    );
  } finally {
    setResendingOTPKey(null);
  }
};



const resumePendingRegistration =
  async () => {
    // ---------------------------------------------
    // RESUME ONLY AN EXPLICITLY SELECTED
    // PENDING REGISTRATION
    //
    // + New Customer / + New Vendor must always
    // open a fresh form.
    // ---------------------------------------------

    if (!pendingRegistrationId) {
      return;
    }

    let entityType:
      | "customer"
      | "vendor"
      | null = null;

    if (title === "New Customer") {
      entityType = "customer";
    }

    if (title === "New Vendor") {
      entityType = "vendor";
    }

    if (!entityType) {
      return;
    }

    const registrationIdToResume =
      pendingRegistrationId;

    try {
      let registration;

      if (entityType === "customer") {
        registration =
          await apiClient
            .getPendingCustomerRegistration(
              registrationIdToResume,
            );
      } else {
        registration =
          await apiClient
            .getPendingVendorRegistration(
              registrationIdToResume,
            );
      }

      setRegistrationId(
        registration.registration_id,
      );

      setRegistrationEntityType(
        registration.entity_type,
      );

      setRegistrationEntityName(
        registration.entity_name ||
          (
            registration.entity_type ===
            "customer"
              ? "Customer"
              : "Vendor"
          ),
      );

      setRegistrationExpiresAt(
        registration.expires_at ?? "",
      );

      setOtpVerificationFields(
        registration.verification_fields ??
          [],
      );

      const restoredOTPValues:
        Record<string, string> = {};

      for (
        const field of
        registration.verification_fields ??
        []
      ) {
        restoredOTPValues[field.key] = "";
      }

      setOtpValues(
        restoredOTPValues,
      );

      setOtpError("");

      // Open OTP for the explicitly selected
      // pending registration.
      setOtpDialog(true);
    } catch (e) {
      console.error(
        "[Pending Registration Resume]",
        e,
      );

      toast.error(
        e instanceof Error
          ? e.message
          : "Unable to resume pending verification.",
      );

      if (onPendingRegistrationHandled) {
  await onPendingRegistrationHandled();
}
    }
  };


useEffect(() => {
  // Only check when the dialog is opened.

  if (!open) {
    return;
  }

  // Only Customer and Vendor creation
  // use pending OTP registration.

  if (
    title !== "New Customer" &&
    title !== "New Vendor"
  ) {
    return;
  }

  void resumePendingRegistration();

  // We intentionally run this when the
  // create dialog opens or its type changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [
  open,
  title,
  pendingRegistrationId,
]);

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
} else if (f.type === "emails") {
  const emails = Array.isArray(v)
    ? v
        .map((email) => String(email ?? "").trim())
        .filter(Boolean)
    : typeof v === "string" && v.trim()
      ? [v.trim()]
      : [];

  cleaned[f.name] = Array.from(
    new Map(
      emails.map((email) => [
        email.toLowerCase(),
        email,
      ]),
    ).values(),
  );
} else {
  cleaned[f.name] = v;
}
  }



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



const emailField = fields.find(
  (field) => field.type === "emails",
);

if (emailField) {
  const emails = cleaned[emailField.name];

  if (
    emailField.required &&
    (!Array.isArray(emails) || emails.length === 0)
  ) {
    setErrorTitle("Validation Error");
    setErrorMessage(
      `${emailField.label} is required.`,
    );
    setErrorDialog(true);
    return;
  }

  if (Array.isArray(emails)) {
    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const invalidEmail = emails.find(
      (email) =>
        !emailPattern.test(String(email)),
    );

    if (invalidEmail) {
      setErrorTitle("Validation Error");
      setErrorMessage(
        `Invalid email: ${invalidEmail}`,
      );
      setErrorDialog(true);
      return;
    }
  }
}

let saved: unknown;

try {
  console.log(
    JSON.stringify(
      cleaned.otherGovAgencyType,
      null,
      2,
    ),
  );

  // =================================================
  // CUSTOMER / VENDOR
  //
  // Do not create the actual profile yet.
  // Start OTP registration first.
  // =================================================

  if (
    title === "New Customer" ||
    title === "New Vendor"
  ) {
    const started =
      await startRegistrationOTP(
        cleaned,
      );

    if (started) {
      // IMPORTANT:
      // Stop here.
      //
      // Do NOT execute onSubmit().
      // Customer/Vendor must only be created
      // after successful OTP verification.
      return;
    }
  }
// =================================================
// EXISTING CUSTOMER EDIT
//
// If an email changed, start OTP verification.
// If no email changed, backend updates normally.
// =================================================

if (title === "Edit Customer") {
  const customerId = String(
    (
      defaultValues as
        | Record<string, unknown>
        | undefined
    )?.id ??
      (
        defaultValues as
          | Record<string, unknown>
          | undefined
      )?._id ??
      "",
  ).trim();

  if (!customerId) {
    throw new Error(
      "Customer ID is missing.",
    );
  }

  const customerPayload = {
    ...cleaned,

    management_email:
      String(
        cleaned.managementEmail ??
          cleaned.management_email ??
          "",
      ).trim() || null,

    accounts_email:
      String(
        cleaned.accountsEmail ??
          cleaned.accounts_email ??
          "",
      ).trim() || null,

    operations_email:
      String(
        cleaned.operationsEmail ??
          cleaned.operations_email ??
          "",
      ).trim() || null,
  };

  const result =
    await apiClient
      .startCustomerEmailUpdate(
        customerId,
        customerPayload,
      );

  // ---------------------------------------------
  // EMAIL CHANGE REQUIRES OTP
  // ---------------------------------------------

  if (
    result.verification_required
  ) {
    setRegistrationId(
      result.registration_id ?? "",
    );

    setRegistrationEntityType(
      "customer",
    );

    setRegistrationOperationType(
      "email_update",
    );

    setRegistrationEntityName(
      result.entity_name ??
        String(
          cleaned.customer_name ??
            cleaned.customerName ??
            "Customer",
        ),
    );

    setRegistrationExpiresAt(
      result.expires_at ?? "",
    );

    setOtpVerificationFields(
      result.verification_fields ??
        [],
    );

    const initialOtpValues:
      Record<string, string> = {};

    for (
      const field of
      result.verification_fields ?? []
    ) {
      initialOtpValues[
        field.key
      ] = "";
    }

    setOtpValues(
      initialOtpValues,
    );

    setOtpError("");

    setOtpDialog(true);

    // CRITICAL:
    // Never execute normal onSubmit after
    // starting email OTP verification.
    return;
  }

  // Backend already completed the normal update
  // because no email verification was required.
  //
  // Do NOT call onSubmit again.

 if (onPendingRegistrationHandled) {
  await onPendingRegistrationHandled();
}

onOpenChange(false);

return;

  
}





// =================================================
// EXISTING VENDOR EDIT
//
// If Vendor email changed:
// → OTP to new email
// → do not update Vendor until verified.
//
// If email did not change:
// → backend performs normal update immediately.
// =================================================

if (title === "Edit Vendor") {
  const vendorId = String(
    (
      defaultValues as
        | Record<string, unknown>
        | undefined
    )?.id ??
      (
        defaultValues as
          | Record<string, unknown>
          | undefined
      )?._id ??
      "",
  ).trim();

  if (!vendorId) {
    throw new Error(
      "Vendor ID is missing.",
    );
  }

  // ---------------------------------------------
  // NORMALIZE VENDOR PAYLOAD
  // ---------------------------------------------

  const vendorPayload = {
    ...cleaned,

    email:
      String(
        cleaned.email ??
          cleaned.emailId ??
          cleaned.email_id ??
          "",
      ).trim() || null,
  };

  const result =
    await apiClient
      .startVendorEmailUpdate(
        vendorId,
        vendorPayload,
      );

  // ---------------------------------------------
  // EMAIL CHANGE REQUIRES OTP
  // ---------------------------------------------

  if (
    result.verification_required
  ) {
    setRegistrationId(
      result.registration_id ?? "",
    );

    setRegistrationEntityType(
      "vendor",
    );

    setRegistrationOperationType(
      "email_update",
    );

    setRegistrationEntityName(
      result.entity_name ??
        String(
          cleaned.name ??
            cleaned.vendorName ??
            cleaned.vendor_name ??
            "Vendor",
        ),
    );

    setRegistrationExpiresAt(
      result.expires_at ?? "",
    );

    setOtpVerificationFields(
      result.verification_fields ??
        [],
    );

    const initialOtpValues:
      Record<string, string> = {};

    for (
      const field of
      result.verification_fields ?? []
    ) {
      initialOtpValues[
        field.key
      ] = "";
    }

    setOtpValues(
      initialOtpValues,
    );

    setOtpError("");

    setOtpDialog(true);

    // Critical:
    // Never continue to generic onSubmit().
    // New Vendor email is not verified yet.
    return;
  }

  // ---------------------------------------------
  // NO EMAIL CHANGE
  //
  // Backend already performed normal Vendor update.
  // Refresh Vendor table and close Edit dialog.
  // ---------------------------------------------

  if (
    onPendingRegistrationHandled
  ) {
    await onPendingRegistrationHandled();
  }

  onOpenChange(false);

  return;
}


  // =================================================
  // EXISTING NORMAL FLOW
  //
  // Import Job, Update Job and all other modules
  // continue unchanged.
  // =================================================

  saved = await onSubmit(
    cleaned as Partial<T>,
  );

} catch (e) {
  const message =
    e instanceof Error
      ? e.message
      : "Operation failed.";

  if (title === "Update Job") {
    setErrorTitle(
      "Validation Error",
    );
  } else if (
    title === "New Customer" ||
    title === "New Vendor"
  ) {
    setErrorTitle(
      "Registration Error",
    );
  }

  setErrorMessage(message);
  setErrorDialog(true);

  return;
}

// if (title === "New Customer") {
//     setCreatedCustomer(saved as Record<string, unknown>);
//     setSuccessDialog(true);
//     return;
// }

// if (title === "New Vendor") {
//   setCreatedVendor(saved as Record<string, unknown>);
//   setVendorSuccessDialog(true);
//   return;
// }

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
  <>
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
  consigneeAddress: data.consigneeAddress,
  noOfCntr: data.noOfCntr,
  size: data.size,

  containerNumbers: Array.isArray(data.containerNumbers)
    ? data.containerNumbers.join(", ")
    : "",

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
    ctl.value &&
    typeof ctl.value === "object" &&
    !Array.isArray(ctl.value)
      ? (ctl.value as Record<string, ServiceItem>)
      : {}
  }
  onChange={ctl.onChange}
  jobId={String(
    watched.job_id ??
    (defaultValues as Record<string, unknown> | undefined)?.job_id ??
    ""
  )}
  category={
    f.name === "otherGovAgencyType"
      ? "Other Gov Agency"
      : f.name === "otherServices"
        ? "Other Services"
        : ""
  }
/>
                    )}
                  />
                ) : f.type === "emails" ? (
  <Controller
    control={control}
    name={f.name}
    render={({ field: ctl }) => {
      // Supports both:
      // Old customer: email = "abc@gmail.com"
      // New customer: email = ["abc@gmail.com", "accounts@gmail.com"]
      const emails = Array.isArray(ctl.value)
        ? ctl.value.map((value) => String(value ?? ""))
        : typeof ctl.value === "string" && ctl.value.trim()
          ? [ctl.value]
          : [""];

      const updateEmail = (
        index: number,
        value: string,
      ) => {
        const next = [...emails];
        next[index] = value;

        ctl.onChange(next);
      };

      const addEmail = () => {
        ctl.onChange([...emails, ""]);
      };

      const removeEmail = (index: number) => {
        const next = emails.filter(
          (_, currentIndex) => currentIndex !== index,
        );

        // Always keep at least one email input.
        ctl.onChange(
          next.length > 0 ? next : [""],
        );
      };

      return (
        <div className="space-y-2">
          {emails.map((email, index) => (
            <div
              key={index}
              className="flex items-center gap-2"
            >
              <input
                type="email"
                value={email}
                onChange={(e) =>
                  updateEmail(
                    index,
                    e.target.value,
                  )
                }
                placeholder={
                  index === 0
                    ? "Enter email ID"
                    : "Enter additional email ID"
                }
                readOnly={f.readOnly}
                className={baseInput}
              />

              {emails.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    removeEmail(index)
                  }
                  disabled={f.readOnly}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-border bg-background text-destructive transition-colors hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-50"
                  title="Remove email"
                  aria-label={`Remove email ${index + 1}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}

          {!f.readOnly && (
            <button
              type="button"
              onClick={addEmail}
              className="text-[11px] font-medium text-brand hover:underline"
            >
              + Add Email
            </button>
          )}
        </div>
      );
    }}
  />

) : f.name === "jobNo" && title === "Update Job" ? (
  <SearchableJobSelect
    field={f}
    className={baseInput}
    control={control}
    locked={!!f.readOnly}
  />

) : f.type === "select" ? (
  f.name === "transportation" &&
  title === "Update Job" ? (
    <Controller
      control={control}
      name={f.name}
      rules={{
        required: f.required
          ? `${f.label} is required`
          : false,
      }}
      render={({ field: ctl }) => (
        <select
          className={baseInput}
          disabled={
            !!f.readOnly ||
            checkingTransportation
          }
          value={String(ctl.value ?? "")}
          onChange={async (e) => {
            const newValue = e.target.value;
            const oldValue = String(
              ctl.value ?? "",
            );

            // Normal change:
            // anything -> Octopus,
            // empty -> Party,
            // Party -> empty, etc.
            if (
              oldValue !== "Octopus" ||
              newValue === "Octopus"
            ) {
              ctl.onChange(newValue);
              return;
            }

            // We are removing Octopus.
            // Do NOT change the field until PO status
            // has been checked.
            const jobId = String(
              watched.job_id ??
                (
                  defaultValues as
                    | Record<string, unknown>
                    | undefined
                )?.job_id ??
                "",
            );

            if (!jobId) {
              ctl.onChange(newValue);
              return;
            }

            try {
              setCheckingTransportation(true);

              const result =
                await apiClient
                  .getPurchaseOrderServiceStatus(
                    jobId,
                    "Transportation",
                    "Transportation",
                  );

              // No issued Transportation PO.
              // Change normally.
              if (
                !result.has_issued_po ||
                !result.purchase_order
              ) {
                ctl.onChange(newValue);
                return;
              }

              // Issued PO exists.
              // Keep Octopus selected until confirmed.
              setPendingTransportation({
                newValue,
                poNumber:
                  result.purchase_order.po_number,
                vendorName:
                  result.purchase_order.vendor_name,
              });

              setTransportationCancelDialog(true);
            } catch (error) {
              toast.error(
                error instanceof Error
                  ? error.message
                  : "Unable to verify Transportation Purchase Order.",
              );
            } finally {
              setCheckingTransportation(false);
            }
          }}
        >
          <option value="">
            {checkingTransportation
              ? "Checking PO..."
              : "Select..."}
          </option>

          {(f.options ?? []).map((option) => (
            <option
              key={option}
              value={option}
            >
              {option}
            </option>
          ))}
        </select>
      )}
    />
  ) : (
    <DynamicSelect
      field={f}
      className={baseInput}
      locked={!!f.readOnly}
      register={register(f.name, {
        required: f.required
          ? `${f.label} is required`
          : false,
      })}
      setErrorDialog={setErrorDialog}
      setErrorMessage={setErrorMessage}
      setErrorTitle={setErrorTitle}
    />
  )

) : f.type === "textarea" ? (
  <textarea
    placeholder={f.placeholder}
    rows={2}
    readOnly={f.readOnly}
    className={`${baseInput} h-auto py-2`}
    {...register(f.name, {
      required: f.required
        ? `${f.label} is required`
        : false,
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

    <span className="text-muted-foreground">
      Enable
    </span>
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
{registrationOperationType ===
"email_update"
  ? "Vendor Updated Successfully"
  : "Vendor Created Successfully"}
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

    setCreatedVendor({});

    reset(
      buildDefaults<T>(
        fields,
        undefined,
      ),
    );

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
        {registrationOperationType ===
"email_update"
  ? "Customer Updated Successfully"
  : "Customer Created Successfully"}
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

    setCreatedCustomer({});

    reset(
      buildDefaults<T>(
        fields,
        undefined,
      ),
    );

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

<ConfirmDialog
  open={transportationCancelDialog}
  onOpenChange={(nextOpen) => {
    setTransportationCancelDialog(
      nextOpen,
    );

    if (!nextOpen) {
      setPendingTransportation(null);
    }
  }}
  title="Cancel Assigned Transportation?"
  description={
    pendingTransportation
      ? `Transportation is already assigned to vendor ${pendingTransportation.vendorName} under ${pendingTransportation.poNumber}. Are you sure you want to change Transportation from Octopus to ${pendingTransportation.newValue || "unselected"}? The Purchase Order will be cancelled and the vendor will be notified by email.`
      : ""
  }
  confirmLabel="Change & Cancel PO"
  destructive
  onConfirm={async () => {
    if (!pendingTransportation) {
      return;
    }

    const jobId = String(
      watched.job_id ??
        (
          defaultValues as
            | Record<string, unknown>
            | undefined
        )?.job_id ??
        "",
    );

    try {
      await apiClient
        .cancelPurchaseOrderService(
          jobId,
          "Transportation",
          "Transportation",
          "Transportation changed from Octopus to Party",
        );

      // Only change Transportation AFTER
      // successful PO cancellation.
      setValue(
        "transportation",
        pendingTransportation.newValue,
        {
          shouldDirty: true,
          shouldValidate: true,
        },
      );

      setTransportationCancelDialog(false);
      setPendingTransportation(null);

      toast.success(
        "Transportation Purchase Order cancelled successfully.",
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to cancel Transportation Purchase Order.",
      );

      throw error;
    }
  }}
/>


        </div>
    </div>

    {/* =================================================
    CUSTOMER / VENDOR OTP VERIFICATION DIALOG
================================================= */}

<Dialog
  open={otpDialog}
  onOpenChange={(nextOpen) => {
    setOtpDialog(nextOpen);

    if (!nextOpen) {
      setOtpError("");
    }
  }}
>
  <DialogContent
  className="
    sm:max-w-[560px]
    max-h-[90vh]
    overflow-y-auto

    [&>button.absolute]:hidden
  "
  onEscapeKeyDown={(e) => {
    e.preventDefault();
  }}
  onPointerDownOutside={(e) => {
    e.preventDefault();
  }}
  onInteractOutside={(e) => {
    e.preventDefault();
  }}
>
    <DialogHeader>
      <DialogTitle>
  {registrationOperationType ===
  "email_update"
    ? "Verify Email Change"
    : "Verify Email OTP"}
</DialogTitle>
    </DialogHeader>

    <div className="space-y-5">

      {/* ENTITY INFORMATION */}

      <div className="rounded-lg border p-4">
        <p className="text-sm text-muted-foreground">
          {registrationEntityType === "customer"
            ? "Customer"
            : "Vendor"}
        </p>

        <p className="font-semibold">
          {registrationEntityName}
        </p>

      <p className="mt-2 text-xs text-muted-foreground">
  {registrationOperationType ===
  "email_update" ? (
    <>
      Enter the OTP sent to the
      changed email address. The{" "}
      {registrationEntityType ===
      "customer"
        ? "Customer"
        : "Vendor"}{" "}
      email will be updated only
      after successful verification.
    </>
  ) : (
    <>
      Enter the OTP sent to each
      email address. Registration
      will be completed only after
      successful email verification.
    </>
  )}
</p>
      </div>


      {/* DYNAMIC OTP INPUTS */}

      <div className="space-y-4">
        {otpVerificationFields.map((field) => (
          <div
            key={field.key}
            className="rounded-lg border p-4"
          >
            <div className="mb-3">
              <p className="text-sm font-medium">
                {field.label}
              </p>

              <p className="text-xs text-muted-foreground">
                {field.email}
              </p>
            </div>

            {field.verified ? (
              <div className="text-sm font-medium text-green-600">
                ✓ Email verified
              </div>
            ) : (
  <div className="space-y-2">

    <input
      type="text"
      inputMode="numeric"
      autoComplete="one-time-code"
      maxLength={6}
      placeholder="Enter 6-digit OTP"
      value={
        otpValues[field.key] ?? ""
      }
      disabled={
        otpLoading ||
        resendingOTPKey === field.key
      }
      onChange={(e) => {
        const value =
          e.target.value
            .replace(/\D/g, "")
            .slice(0, 6);

        setOtpValues(
          (current) => ({
            ...current,
            [field.key]: value,
          }),
        );

        if (otpError) {
          setOtpError("");
        }
      }}
      className="
        h-10
        w-full
        rounded-lg
        border
        border-border
        bg-background
        px-3
        text-sm
        outline-none
        transition-colors
        focus:border-ring
        focus:ring-2
        focus:ring-ring/20
        disabled:cursor-not-allowed
        disabled:opacity-60
      "
    />

    <div className="flex items-center justify-end gap-2">
  <Button
    type="button"
    variant="ghost"
    size="sm"
    disabled={
      otpLoading ||
      resendingOTPKey !== null ||
      field.verified
    }
    onClick={() => {
      void resendRegistrationOTP(
        field.key,
      );
    }}
  >
    {resendingOTPKey === field.key
      ? "Sending..."
      : "Resend OTP"}
  </Button>

  <Button
    type="button"
    size="sm"
    disabled={
      otpLoading ||
      resendingOTPKey !== null ||
      field.verified ||
      !String(
        otpValues[field.key] ?? "",
      ).trim()
    }
    onClick={() => {
      void verifyRegistrationOTP(
        field,
      );
    }}
  >
    {otpLoading
      ? "Verifying..."
      : "Verify"}
  </Button>
</div>

  </div>
)}
          </div>
        ))}
      </div>


      {/* OTP ERROR */}

      {otpError && (
        <div
          className="
            rounded-lg
            border
            border-destructive/30
            bg-destructive/5
            px-4
            py-3
            text-sm
            text-destructive
          "
        >
          {otpError}
        </div>
      )}


      {/* ACTION BUTTONS */}

      <DialogFooter className="gap-2">

        {/* EDIT CUSTOMER / VENDOR DETAILS */}
<Button
  type="button"
  variant="outline"
  disabled={
    otpLoading ||
    resendingOTPKey !== null
  }
  onClick={
    editRegistrationDetails
  }
>
  Edit Details
</Button>

        <Button
  type="button"
  variant="outline"
  disabled={otpLoading}
 onClick={() => {
  if (
    !registrationId ||
    !registrationEntityType
  ) {
    return;
  }

  // Keep this registration available
  // in Pending Verifications.
  savePendingRegistration({
    registrationId,

    entityType:
      registrationEntityType,

    entityName:
      registrationEntityName,

    expiresAt:
      registrationExpiresAt ||
      new Date(
        Date.now() +
          24 * 60 * 60 * 1000,
      ).toISOString(),
  });

  // Close OTP.
  setOtpDialog(false);

  // Clear only local OTP UI state.
  // Backend keeps each email's verified status.
  setOtpValues({});
  setOtpError("");

  setRegistrationId("");
  setRegistrationEntityType(null);
  setRegistrationEntityName("");
  setRegistrationExpiresAt("");
  setOtpVerificationFields([]);

  // Refresh Pending Verifications.
  onPendingRegistrationHandled?.();

  // Close New Customer / New Vendor form.
  onOpenChange(false);
}}

>
  Verify Later
</Button>

        

      </DialogFooter>

    </div>
  </DialogContent>
</Dialog>

  </>
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
  jobId,
  category,
}: {
  options: string[];
  statusOptions: string[];
  value: Record<string, ServiceItem>;
  onChange: (v: Record<string, ServiceItem>) => void;

  jobId: string;

  category:
    | "Other Gov Agency"
    | "Other Services"
    | "";
}) {
  const [cancelDialogOpen, setCancelDialogOpen] =
    useState(false);

  const [pendingRemoval, setPendingRemoval] =
    useState<{
      serviceName: string;
      poNumber: string;
      vendorName: string;
    } | null>(null);

  const [checkingService, setCheckingService] =
    useState<string | null>(null);


  const updateService = (
    opt: string,
    patch: Partial<ServiceItem>,
  ) => {
    onChange({
      ...value,

      [opt]: {
        ...(value[opt] ?? {
          status:
            statusOptions[0] ??
            "Pending",
        }),

        ...patch,
      },
    });
  };


  const removeServiceFromForm = (
    serviceName: string,
  ) => {
    const next = {
      ...value,
    };

    delete next[serviceName];

    onChange(next);
  };


  const toggle = async (
    opt: string,
    checked: boolean,
  ) => {

    // ---------------------------------------------
    // CHECKING SERVICE
    //
    // Existing behavior remains unchanged.
    // ---------------------------------------------

    if (checked) {
      onChange({
        ...value,

        [opt]: {
          status:
            statusOptions[0] ??
            "Pending",

          unit: undefined,

          tariff: undefined,

          tariff20: undefined,

          tariff40: undefined,

          enable20: false,

          enable40: false,
        },
      });

      return;
    }


    // ---------------------------------------------
    // UNCLEAR PO CONTEXT
    //
    // If this is not a PO-enabled workflow field,
    // preserve the original uncheck behavior.
    // ---------------------------------------------

    if (
      !jobId ||
      !category
    ) {
      removeServiceFromForm(
        opt,
      );

      return;
    }


    // ---------------------------------------------
    // CHECK WHETHER AN ISSUED PO EXISTS
    //
    // IMPORTANT:
    //
    // Do NOT remove the checkbox yet.
    // ---------------------------------------------

    try {
      setCheckingService(
        opt,
      );

      const result =
        await apiClient.getPurchaseOrderServiceStatus(
          jobId,
          category,
          opt,
        );


      // -------------------------------------------
      // NO ISSUED PO
      //
      // Safe to uncheck normally.
      // -------------------------------------------

      if (
        !result.has_issued_po ||
        !result.purchase_order
      ) {
        removeServiceFromForm(
          opt,
        );

        return;
      }


      // -------------------------------------------
      // ISSUED PO FOUND
      //
      // Keep checkbox checked and ask user.
      // -------------------------------------------

      setPendingRemoval({
        serviceName: opt,

        poNumber:
          result.purchase_order.po_number,

        vendorName:
          result.purchase_order.vendor_name,
      });

      setCancelDialogOpen(
        true,
      );

    } catch (error) {

      // IMPORTANT:
      //
      // If PO verification fails,
      // DO NOT remove the service.
      //
      // Otherwise a network/backend failure could
      // bypass the PO cancellation protection.

      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to verify Purchase Order status.",
      );

    } finally {

      setCheckingService(
        null,
      );
    }
  };


  return (
    <>
      <div className="rounded-lg border border-border bg-background p-3">

        <div className="space-y-3">

          {options.map((opt) => {

            const service =
              value[opt];

            const checked =
              !!service;

            const status =
              service?.status ??
              "Pending";

            return (
              <div
                key={opt}
                className={`rounded-lg border p-3 ${
                  checked &&
                  status === "Done"
                    ? "border-green-500 bg-green-50"
                    : "border-gray-300"
                }`}
              >

                <div className="flex items-center gap-2">

                  <input
                    type="checkbox"

                    checked={
                      checked
                    }

                    disabled={
                      checkingService ===
                      opt
                    }

                    onChange={(e) => {
                      void toggle(
                        opt,
                        e.target.checked,
                      );
                    }}

                    className="size-4"
                  />

                  <span className="font-medium">
                    {opt}
                  </span>

                  {checkingService === opt && (
                    <span className="text-xs text-muted-foreground">
                      Checking PO…
                    </span>
                  )}

                </div>


             {checked && (
  <div className="mt-3 space-y-3 border-t pt-3">

    {/* JOB STATUS */}
    <div className="space-y-1">

      <label className="text-xs font-medium">
        Job Status
      </label>

      <select
        value={service.status ?? ""}
        onChange={(e) => {
          const nextStatus = e.target.value;

          updateService(
            opt,
            nextStatus === "Done"
              ? {
                  status: nextStatus,
                }
              : {
                  status: nextStatus,

                  // Clear tariff configuration
                  // when service is no longer Done.
                  unit: undefined,
                  tariff: undefined,

                  tariff20: undefined,
                  tariff40: undefined,

                  enable20: false,
                  enable40: false,
                },
          );
        }}
        className="
          h-10
          w-full
          rounded-lg
          border
          border-border
          bg-background
          px-3
          text-sm
          outline-none
          focus:border-ring
          focus:ring-2
          focus:ring-ring/20
        "
      >
        {statusOptions.map(
          (statusOption) => (
            <option
              key={statusOption}
              value={statusOption}
            >
              {statusOption}
            </option>
          ),
        )}
      </select>

    </div>


    {/* SHOW TARIFF ONLY WHEN DONE */}
    {service.status === "Done" && (
      <>

        {/* TARIFF UNIT */}
        <div className="space-y-1">

          <label className="text-xs font-medium">
            Tariff Unit
          </label>

          <select
            value={service.unit ?? ""}
            onChange={(e) => {
              const unit =
                e.target.value;

              if (unit === "BL") {
                updateService(
                  opt,
                  {
                    unit,

                    tariff20: undefined,
                    tariff40: undefined,

                    enable20: false,
                    enable40: false,
                  },
                );

                return;
              }

              if (
                unit === "Container"
              ) {
                updateService(
                  opt,
                  {
                    unit,

                    tariff: undefined,
                  },
                );

                return;
              }

              updateService(
                opt,
                {
                  unit: undefined,

                  tariff: undefined,

                  tariff20: undefined,
                  tariff40: undefined,

                  enable20: false,
                  enable40: false,
                },
              );
            }}
            className="
              h-10
              w-full
              rounded-lg
              border
              border-border
              bg-background
              px-3
              text-sm
              outline-none
              focus:border-ring
              focus:ring-2
              focus:ring-ring/20
            "
          >

            <option value="">
              Select Tariff Unit
            </option>

            <option value="Container">
              Container
            </option>

            <option value="BL">
              BL
            </option>

          </select>

        </div>


        {/* BL TARIFF */}
        {service.unit === "BL" && (
          <div className="space-y-1">

            <label className="text-xs font-medium">
              Tariff Amount
            </label>

            <input
              type="number"
              min="0"
              step="0.01"
              value={
                service.tariff ??
                ""
              }
              onChange={(e) => {

                const raw =
                  e.target.value;

                updateService(
                  opt,
                  {
                    tariff:
                      raw === ""
                        ? undefined
                        : Number(raw),
                  },
                );
              }}
              placeholder="Enter tariff amount"
              className="
                h-10
                w-full
                rounded-lg
                border
                border-border
                bg-background
                px-3
                text-sm
                outline-none
                focus:border-ring
                focus:ring-2
                focus:ring-ring/20
              "
            />

          </div>
        )}


        {/* CONTAINER TARIFF */}
        {service.unit ===
          "Container" && (
          <div className="space-y-3">

            <label className="text-xs font-medium">
              Container Size & Tariff
            </label>


            {/* 20 FT */}
            <div
              className="
                rounded-lg
                border
                border-border
                bg-background
                p-3
              "
            >

              <label className="flex items-center gap-2">

                <input
                  type="checkbox"
                  checked={
                    !!service.enable20
                  }
                  onChange={(e) => {

                    const enabled =
                      e.target.checked;

                    updateService(
                      opt,
                      {
                        enable20:
                          enabled,

                        tariff20:
                          enabled
                            ? service.tariff20
                            : undefined,
                      },
                    );
                  }}
                  className="size-4"
                />

                <span className="text-sm font-medium">
                  20 FT
                </span>

              </label>


              {service.enable20 && (
                <div className="mt-3 space-y-1">

                  <label className="text-xs font-medium">
                    20 FT Tariff Amount
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      service.tariff20 ??
                      ""
                    }
                    onChange={(e) => {

                      const raw =
                        e.target.value;

                      updateService(
                        opt,
                        {
                          tariff20:
                            raw === ""
                              ? undefined
                              : Number(
                                  raw,
                                ),
                        },
                      );
                    }}
                    placeholder="Enter 20 FT tariff"
                    className="
                      h-10
                      w-full
                      rounded-lg
                      border
                      border-border
                      bg-background
                      px-3
                      text-sm
                      outline-none
                      focus:border-ring
                      focus:ring-2
                      focus:ring-ring/20
                    "
                  />

                </div>
              )}

            </div>


            {/* 40 FT */}
            <div
              className="
                rounded-lg
                border
                border-border
                bg-background
                p-3
              "
            >

              <label className="flex items-center gap-2">

                <input
                  type="checkbox"
                  checked={
                    !!service.enable40
                  }
                  onChange={(e) => {

                    const enabled =
                      e.target.checked;

                    updateService(
                      opt,
                      {
                        enable40:
                          enabled,

                        tariff40:
                          enabled
                            ? service.tariff40
                            : undefined,
                      },
                    );
                  }}
                  className="size-4"
                />

                <span className="text-sm font-medium">
                  40 FT
                </span>

              </label>


              {service.enable40 && (
                <div className="mt-3 space-y-1">

                  <label className="text-xs font-medium">
                    40 FT Tariff Amount
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      service.tariff40 ??
                      ""
                    }
                    onChange={(e) => {

                      const raw =
                        e.target.value;

                      updateService(
                        opt,
                        {
                          tariff40:
                            raw === ""
                              ? undefined
                              : Number(
                                  raw,
                                ),
                        },
                      );
                    }}
                    placeholder="Enter 40 FT tariff"
                    className="
                      h-10
                      w-full
                      rounded-lg
                      border
                      border-border
                      bg-background
                      px-3
                      text-sm
                      outline-none
                      focus:border-ring
                      focus:ring-2
                      focus:ring-ring/20
                    "
                  />

                </div>
              )}

            </div>

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


      <ConfirmDialog
        open={
          cancelDialogOpen
        }

        onOpenChange={(open) => {

          setCancelDialogOpen(
            open,
          );

          if (!open) {
            setPendingRemoval(
              null,
            );
          }
        }}

        title="Cancel Assigned Service?"

        description={
          pendingRemoval
            ? `${pendingRemoval.serviceName} is already assigned to vendor ${pendingRemoval.vendorName} under ${pendingRemoval.poNumber}. Are you sure you want to cancel this service? The Purchase Order will be cancelled and the vendor will be notified by email.`
            : ""
        }

        confirmLabel="Cancel Service"

        destructive

        onConfirm={async () => {

          if (
            !pendingRemoval
          ) {
            return;
          }

          const serviceName =
            pendingRemoval.serviceName;

          try {

            // -----------------------------------------
            // CANCEL PO FIRST
            // -----------------------------------------

            await apiClient.cancelPurchaseOrderService(
              jobId,
              category,
              serviceName,
              "Service removed from Import Workflow",
            );


            // -----------------------------------------
            // ONLY AFTER BACKEND SUCCESS:
            //
            // Remove checkbox/service from form.
            // -----------------------------------------

            removeServiceFromForm(
              serviceName,
            );


            setCancelDialogOpen(
              false,
            );

            setPendingRemoval(
              null,
            );


            toast.success(
              `${serviceName} cancelled successfully. Purchase Order cancelled and vendor notification queued.`,
            );

          } catch (error) {

            // Keep checkbox checked if cancellation fails.

            toast.error(
              error instanceof Error
                ? error.message
                : "Unable to cancel Purchase Order.",
            );

            throw error;
          }
        }}
      />

    </>
  );
}        
       
    
  