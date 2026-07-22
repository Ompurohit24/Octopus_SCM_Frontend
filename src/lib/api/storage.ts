
import type { EntityKey, EntityMap, ID } from "./types";



const API = import.meta.env.VITE_API_URL;
 
// const API = "https://octopus-scm-backend.onrender.com";
const TOKEN_KEY = "access_token";

function token() {
  return localStorage.getItem(TOKEN_KEY);
}

const REFRESH_TOKEN_KEY = "refresh_token";

async function request<T>(
  url: string,
  options: RequestInit = {},
  retry = true,
): Promise<T> {

  const accessToken =
    localStorage.getItem(TOKEN_KEY);

  const headers: Record<string, string> = {
    ...(accessToken
      ? {
          Authorization:
            `Bearer ${accessToken}`,
        }
      : {}),

    ...(options.headers as Record<
      string,
      string
    >),
  };

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] =
      "application/json";
  }

  let res = await fetch(
    API + url,
    {
      ...options,
      headers,
    },
  );

  // -----------------------------------------
  // ACCESS TOKEN EXPIRED
  //
  // Try refreshing once.
  // -----------------------------------------

  if (
    res.status === 401 &&
    retry &&
    url !== "/auth/login" &&
    url !== "/auth/refresh"
  ) {

    const refreshToken =
      localStorage.getItem(
        REFRESH_TOKEN_KEY,
      );

    if (refreshToken) {

      try {

        const refreshResponse =
          await fetch(
            API + "/auth/refresh",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                refresh_token:
                  refreshToken,
              }),
            },
          );

        if (refreshResponse.ok) {

          const refreshData =
            await refreshResponse.json();

          const newAccessToken =
            refreshData.access_token;

          if (newAccessToken) {

            localStorage.setItem(
              TOKEN_KEY,
              newAccessToken,
            );

            // Retry original request ONCE
            // using the new access token.

            return request<T>(
              url,
              options,
              false,
            );
          }
        }

      } catch (error) {

        console.error(
          "Token refresh failed:",
          error,
        );
      }
    }

    // -----------------------------------------
    // REFRESH FAILED / EXPIRED
    //
    // Clear authentication.
    // -----------------------------------------

    localStorage.removeItem(
      TOKEN_KEY,
    );

    localStorage.removeItem(
      REFRESH_TOKEN_KEY,
    );

    window.location.href =
      "/login";

    throw new Error(
      "Session expired",
    );
  }

  // -----------------------------------------
  // UNAUTHORIZED AFTER RETRY
  // -----------------------------------------

  if (res.status === 401) {

    localStorage.removeItem(
      TOKEN_KEY,
    );

    localStorage.removeItem(
      REFRESH_TOKEN_KEY,
    );

    window.location.href =
      "/login";

    throw new Error(
      "Unauthorized",
    );
  }

  // -----------------------------------------
  // OTHER API ERRORS
  // -----------------------------------------

  if (!res.ok) {

    let message =
      "Request failed";

    try {

      const err =
        await res.json();

      console.error(
        "FastAPI Validation Error",
        err,
      );

      message =
        typeof err.detail === "string"
          ? err.detail
          : JSON.stringify(
              err.detail,
              null,
              2,
            );

    } catch {}

    throw new Error(
      message,
    );
  }

  // -----------------------------------------
  // NO CONTENT
  // -----------------------------------------

  if (res.status === 204) {
    return undefined as T;
  }

  return (
    await res.json()
  ) as T;
}

const ROUTES: Partial<Record<EntityKey, string>> = {
  customers: "/customers",
  vendors: "/vendors",

  pubOperations: "/pub-operations",
  importOperations: "/import-operations",

  importJobs: "/import-jobs",
  importChecklists: "/import-workflows",

  purchaseOrders: "/purchase-orders",

  type_of_service: "/masters/type-of-services",
};
export interface ListQuery {
  search?: string;
  sortKey?: string;
  sortDir?: "asc" | "desc";
  page?: number;
  pageSize?: number;

  skip?: number;
  limit?: number;

  filter?: Record<string, string | number | boolean | undefined>;
}

export interface ListResult<T> {
  rows: T[];
  total: number;
  page: number;
  pageSize: number;
}

function toImportWorkflowPayload(workflow: any) {
  return {
    job_id: workflow.job_id,
    job_number: workflow.job_number,

    checklist: workflow.checklist,

    igm_no: workflow.igmNo,
    igm_date: workflow.igmDate,
    igm_status: workflow.igmStatus,

    inward_date: workflow.inwardDate || null,

    be_no: workflow.beNo || null,

    be_date: workflow.beDate || null,

    goods_registration: workflow.goodsRegi,

    other_gov_agency:
  workflow.otherGovAgency === "Yes" ? "Yes" : "No",

    other_gov_agency_type:
  workflow.otherGovAgency === "Yes"
    ? workflow.otherGovAgencyType ?? {}
    : null,

    other_services:
  workflow.otherServices ?? {},

    assessment_type:
      workflow.assessmentType === "" ? null : workflow.assessmentType,

    cfs_name:
      workflow.cfsName === "" ? null : workflow.cfsName,

    boe_copy_mailed:
      workflow.boeCopyMailed === "" ? null : workflow.boeCopyMailed,

    original_documents:
      workflow.document === "" ? null : workflow.document,

    co_deface_required:
      workflow.coDefaceRequired === "" ? null : workflow.coDefaceRequired,

    co_deface:
      workflow.coDeface === "" ? null : workflow.coDeface,

    duty_payment:
      workflow.dutyPayment === "" ? null : workflow.dutyPayment,

    out_of_charge:
      workflow.ooc === "" ? null : workflow.ooc,

    oc_mail_sent:
      workflow.ocMail === "" ? null : workflow.ocMail,

    liner_invoice_received:
      workflow.linerInvoice === "" ? null : workflow.linerInvoice,

    liner_payment:
      workflow.linerPayment === "" ? null : workflow.linerPayment,

    payment_confirmation:
      workflow.paymentConfirm === "" ? null : workflow.paymentConfirm,

    do_received:
      workflow.doReceived === "" ? null : workflow.doReceived,

    do_validity:
      workflow.doValidity || null,

    do_type:
      workflow.doProcess === "" ? null : workflow.doProcess,

    transportation:
      workflow.transportation === "" ? null : workflow.transportation,

    transporter:
      workflow.transporter === "" ? null : workflow.transporter,

    empty_container_return:
      workflow.performaInvoice === "" ? null : workflow.performaInvoice,

    container_unloaded:
      workflow.cfsPayment === "" ? null : workflow.cfsPayment,

    detention:
      workflow.delivery === "" ? null : workflow.delivery,

    job_closed:
      workflow.vendorInvoices === "" ? null : workflow.vendorInvoices,

    remarks: workflow.remarks,
  };
}



function fromImportWorkflow(item: any): Record<string, unknown> {
  return {
    id: item.id ?? item._id,

    job_id: item.job_id,
    job_number: item.job_number,

    jobNo: item.job_number,

    checklist: item.checklist,

    igmNo: item.igm_no,
    // igmDate: item.igm_date,
igmDate: item.igm_date?.split("T")[0] ?? "",

    igmStatus: item.igm_status,

    // inwardDate: item.inward_date,

    inwardDate: item.inward_date?.split("T")[0] ?? "",

    beNo: item.be_no,
    // beDate: item.be_date,

    beDate: item.be_date?.split("T")[0] ?? "",

    goodsRegi: item.goods_registration,

    otherGovAgency: item.other_gov_agency,
    otherGovAgencyType: item.other_gov_agency_type,

    otherServices: item.other_services,

    assessmentType: item.assessment_type,
    cfsName: item.cfs_name,

    boeCopyMailed: item.boe_copy_mailed,

    document: item.original_documents,

    coDefaceRequired: item.co_deface_required,
    coDeface: item.co_deface,

    dutyPayment: item.duty_payment,

    ooc: item.out_of_charge,

    ocMail: item.oc_mail_sent,

    linerInvoice: item.liner_invoice_received,

    linerPayment: item.liner_payment,

    paymentConfirm: item.payment_confirmation,

    doReceived: item.do_received,
    // doValidity: item.do_validity,

    doValidity: item.do_validity?.split("T")[0] ?? "",
    doProcess: item.do_type,

    transportation: item.transportation,
    transporter: item.transporter,

    performaInvoice: item.empty_container_return,

    cfsPayment: item.container_unloaded,

    delivery: item.detention,

    vendorInvoices: item.job_closed,

    remarks: item.remarks,

    createdAt: item.created_at,
  };
}


function normalizeContainerNumbers(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item).trim().toUpperCase())
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/[\n,]+/)
      .map((item) => item.trim().toUpperCase())
      .filter(Boolean);
  }

  return [];
}

function containerNumbersToText(value: unknown): string {
  return normalizeContainerNumbers(value).join(", ");
}

export interface PurchaseOrderServiceStatus {
  has_issued_po: boolean;

  purchase_order: {
    id: string;
    po_number: string;

    job_id: string;
    job_number: string;

    category: string;
    service_name: string;

    vendor_id: string;
    vendor_code?: string | null;
    vendor_name: string;

    status: string;
  } | null;
}

export interface CancelledPurchaseOrder {
  id: string;
  po_number: string;

  job_id: string;
  job_number: string;

  category: string;
  service_name: string;

  vendor_id: string;
  vendor_code?: string | null;
  vendor_name: string;

  status: "Cancelled";

  cancellation_reason?: string | null;
  cancelled_at?: string | null;
}



export type RegistrationVerificationField = {
  key: string;
  label: string;
  email: string;
  otp_sent?: boolean;
  verified?: boolean;
};

export type RegistrationStartResponse = {
  registration_id: string;
  entity_type: "customer" | "vendor";
  entity_name: string;
  status: "pending";
  expires_at: string;

  verification_fields: RegistrationVerificationField[];

  all_otps_sent: boolean;
  message: string;
};

export type PendingRegistrationResponse = {
  registration_id: string;
  entity_type: "customer" | "vendor";
  entity_name: string;
  status: "pending";
  expires_at: string;

  verification_fields: RegistrationVerificationField[];

  form_data: Record<string, unknown>;

  has_gst_document: boolean;
  has_pan_document: boolean;
};

export type CustomerOTPVerifyPayload = {
  registration_id: string;

  management_email_otp?: string;
  accounts_email_otp?: string;
  operations_email_otp?: string;
};

export type VendorOTPVerifyPayload = {
  registration_id: string;
  otp: string;
};

export type RegistrationVerifyResponse<T> = {
  created: boolean;

  // Used when an existing Customer/Vendor
  // is updated after OTP verification.
  updated?: boolean;

  all_verified: boolean;

  // Present for verified email-change updates.
  operation_type?:
    | "email_update";

  customer?: T;
  vendor?: T;

  message: string;
};

export type ResendOTPResponse = {
  sent: boolean;
  email_key: string;
  email: string;
  otp_expires_at: string;
  message: string;
};



export const apiClient = {



startCustomerRegistration(
  formData: FormData,
) {
  return request<RegistrationStartResponse>(
    "/customers/registration/start",
    {
      method: "POST",
      body: formData,
    },
  );
},

verifyCustomerRegistration(
  payload: CustomerOTPVerifyPayload,
) {
  return request<
    RegistrationVerifyResponse<any>
  >(
    "/customers/registration/verify",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
},

getPendingCustomerRegistration(
  registrationId: string,
) {
  return request<PendingRegistrationResponse>(
    `/customers/registration/pending/${encodeURIComponent(
      registrationId,
    )}`,
  );
},

resendCustomerRegistrationOTP(
  registrationId: string,
  emailKey: string,
) {
  return request<ResendOTPResponse>(
    "/customers/registration/resend-otp",
    {
      method: "POST",
      body: JSON.stringify({
        registration_id:
          registrationId,

        email_key:
          emailKey,
      }),
    },
  );
},

startVendorRegistration(
  formData: FormData,
) {
  return request<RegistrationStartResponse>(
    "/vendors/registration/start",
    {
      method: "POST",
      body: formData,
    },
  );
},


async updateCustomerRegistration(
  registrationId: string,
  formData: FormData,
) {
  const customer =
    Object.fromEntries(
      formData.entries(),
    );

  return request<{
    registration_id: string;
    entity_type: "customer";
    entity_name: string;
    status: string;
    expires_at?: string;

    verification_fields: Array<{
      key: string;
      label: string;
      email: string;
      verified: boolean;
      otp_sent?: boolean;
    }>;

    message?: string;
  }>(
    "/customers/registration/update",
    {
      method: "POST",

      body: JSON.stringify({
        registration_id:
          registrationId,

        customer,
      }),
    },
  );
},

async updateVendorRegistration(
  registrationId: string,
  formData: FormData,
) {
  const vendor =
    Object.fromEntries(
      formData.entries(),
    );

  return request<{
    registration_id: string;
    entity_type: "vendor";
    entity_name: string;
    status: string;
    expires_at?: string;

    verification_fields: Array<{
      key: string;
      label: string;
      email: string;
      verified: boolean;
      otp_sent?: boolean;
    }>;

    message?: string;
  }>(
    "/vendors/registration/update",
    {
      method: "POST",

      body: JSON.stringify({
        registration_id:
          registrationId,

        vendor,
      }),
    },
  );
},

verifyVendorRegistration(
  payload: VendorOTPVerifyPayload,
) {
  return request<
    RegistrationVerifyResponse<any>
  >(
    "/vendors/registration/verify",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
},

getPendingVendorRegistration(
  registrationId: string,
) {
  return request<PendingRegistrationResponse>(
    `/vendors/registration/pending/${encodeURIComponent(
      registrationId,
    )}`,
  );
},

resendVendorRegistrationOTP(
  registrationId: string,
) {
  return request<ResendOTPResponse>(
    "/vendors/registration/resend-otp",
    {
      method: "POST",
      body: JSON.stringify({
        registration_id:
          registrationId,

        email_key:
          "vendor_email",
      }),
    },
  );
},

async list<K extends EntityKey>(
  key: K,
  query: ListQuery = {},
): Promise<ListResult<EntityMap[K]>> {

  const route = ROUTES[key];

  if (!route) {
    throw new Error(`${key} backend not implemented`);
  }

  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 20;

  const limit = query.pageSize ?? query.limit ?? 20;
  const skip = query.skip ?? (page - 1) * pageSize;

  const response = await request<{
    total: number;
    skip: number;
    limit: number;
    items: any[];
  }>(
    `${route}?search=${encodeURIComponent(query.search ?? "")}&skip=${skip}&limit=${limit}`,
  );

 if (key === "type_of_service") {
  const items = (Array.isArray(response)
    ? response
    : response.items ?? []) as any[];

  return {
   rows: items.map((item) => ({
  id: item.id ?? item._id ?? item.name,
  name: item.name,
})) as EntityMap[K][],
    total: items.length,
    page,
    pageSize,
  };


  
}

  // ---------------- Import Jobs ----------------

  if (key === "importJobs") {
    return {
      rows: response.items.map((item: any) => ({
        id: item.id ?? item._id,

        // Required for workflow
        job_id: item.id ?? item._id,
        job_number: item.job_number,

        // Frontend fields
        jobNo: item.job_number,
        blNo: item.bl_no,
        beNo: item.be_no,
        blDate: item.bl_date,

        invoiceNo: item.invoice_no,
        invoiceDate: item.invoice_date,

        noOfCntr: item.no_of_cntr,

    containerNumbers: containerNumbersToText(
  item.container_numbers,
),

        size: item.size,

        lineName: item.line_name,
        forwarderName: item.forwarder,

        eta: item.eta,

        consigneeName: item.consignee_name,
        consigneeAddress: item.consignee_address,

        cargoDescription: item.cargo_description,

        createdAt: item.created_at,
      })) as unknown as EntityMap[K][],
      total: response.total,
      page,
      pageSize,
    };
  }

  // ---------------- Import Workflow ----------------

  if (key === "importChecklists") {
    return {
      rows: response.items.map(item => fromImportWorkflow(item)) as unknown as EntityMap[K][],
      total: response.total,
      page,
      pageSize,
    };
  }

  // ---------------- Default ----------------
const items = (
  Array.isArray(response)
    ? response
    : response.items ?? []
) as any[];
return {
  rows: items.map((item: any) => ({
    ...item,
    id: item.id ?? item._id,

    customerCode: item.customer_code,
    customer_code: item.customer_code,

    customerName: item.customer_name,
    customer_name: item.customer_name,

    managementEmail:
  item.management_email ??
  item.managementEmail ??
  "",

management_email:
  item.management_email ??
  item.managementEmail ??
  "",

accountsEmail:
  item.accounts_email ??
  item.accountsEmail ??
  "",

accounts_email:
  item.accounts_email ??
  item.accountsEmail ??
  "",

operationsEmail:
  item.operations_email ??
  item.operationsEmail ??
  "",

operations_email:
  item.operations_email ??
  item.operationsEmail ??
  "",

    vendorCode: item.vendor_code,
    vendor_code: item.vendor_code,

    vendorName: item.vendor_name,
    vendor_name: item.vendor_name,

    countryCode: item.countryCode ?? item.country_code,
  })) as EntityMap[K][],

  total: Array.isArray(response)
    ? items.length
    : response.total ?? items.length,

  page,
  pageSize,
};
},

async all<K extends EntityKey>(key: K): Promise<EntityMap[K][]> {
  const result = await this.list(key, {
    skip: 0,
    limit: 1000,
  });

  

  return result.rows;
},
async get<K extends EntityKey>(
  key: K,
  id: ID,
): Promise<EntityMap[K] | undefined> {

  const route = ROUTES[key];

  if (!route) {
    throw new Error(`${key} backend not implemented`);
  }

  const item = await request<any>(`${route}/${id}`);

  // ---------------- Import Workflow ----------------

  if (key === "importChecklists") {
    return fromImportWorkflow(item) as unknown as EntityMap[K];
  }

  // ---------------- Import Jobs ----------------

  if (key === "importJobs") {
    return {
      id: item.id ?? item._id,

      job_id: item.id ?? item._id,
      job_number: item.job_number,

      jobNo: item.job_number,

      blNo: item.bl_no,
      blDate: item.bl_date,

      invoiceNo: item.invoice_no,
      invoiceDate: item.invoice_date,

      noOfCntr: item.no_of_cntr,

      containerNumbers: containerNumbersToText(
        item.container_numbers,
      ),

      size: item.size,

      lineName: item.line_name,
      forwarderName: item.forwarder,

      eta: item.eta,

      consigneeName: item.consignee_name,
      consigneeAddress: item.consignee_address,

      cargoDescription: item.cargo_description,

      createdAt: item.created_at,
    } as unknown as EntityMap[K];
  }

  // ---------------- Default ----------------

  return {
    ...item,
    id: item.id ?? item._id,

    customerCode: item.customer_code,
    customer_code: item.customer_code,

    customerName: item.customer_name,
    customer_name: item.customer_name,

    managementEmail:
  item.management_email ??
  "",

management_email:
  item.management_email ??
  "",

accountsEmail:
  item.accounts_email ??
  "",

accounts_email:
  item.accounts_email ??
  "",

operationsEmail:
  item.operations_email ??
  "",

operations_email:
  item.operations_email ??
  "",

    countryCode: item.country_code,
  };
},


async create<K extends EntityKey>(
  key: K,
  input: any,
): Promise<EntityMap[K]> {

  const route = ROUTES[key];

if (key === "importChecklists") {
  const workflow = input as any;

  if (!workflow.job_id) {
    throw new Error("Workflow job_id is missing.");
  }

  const payload = toImportWorkflowPayload(workflow);

  

  const item = await request<any>(
  `/import-workflows/${workflow.job_id}`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );

  return fromImportWorkflow(item) as unknown as EntityMap[K];
}

  if (!route) {
    throw new Error(`${key} backend not implemented`);
  }

  let payload: any = input;

if (key === "customers") {
  const formData = new FormData();

  formData.append(
    "customer_code",
    input.customer_code ??
      input.customerCode ??
      "",
  );

  formData.append(
    "customer_name",
    input.customer_name ??
      input.customerName ??
      "",
  );

  formData.append(
    "address",
    input.address ?? "",
  );

  // -----------------------------------------
  // FIXED CUSTOMER EMAIL FIELDS
  // -----------------------------------------

  formData.append(
    "management_email",
    String(
      input.managementEmail ??
        input.management_email ??
        "",
    ).trim(),
  );

  formData.append(
    "accounts_email",
    String(
      input.accountsEmail ??
        input.accounts_email ??
        "",
    ).trim(),
  );

  formData.append(
    "operations_email",
    String(
      input.operationsEmail ??
        input.operations_email ??
        "",
    ).trim(),
  );

  formData.append(
    "countryCode",
    input.countryCode ?? "+91",
  );

  formData.append(
    "phone",
    input.phone ?? "",
  );

  formData.append(
    "gstin",
    input.gstin ?? "",
  );

  formData.append(
    "pan",
    input.pan ?? "",
  );

  formData.append(
    "tan",
    input.tan ?? "",
  );

  if (
    input.gst_document instanceof File
  ) {
    formData.append(
      "gst_document",
      input.gst_document,
    );
  }

  if (
    input.pan_document instanceof File
  ) {
    formData.append(
      "pan_document",
      input.pan_document,
    );
  }

  payload = formData;
}
if (key === "vendors") {
  const formData = new FormData();

  formData.append(
    "vendor_code",
    input.vendor_code ?? "",
  );

  formData.append(
    "vendor_name",
    input.vendor_name ?? "",
  );

  formData.append(
    "address",
    input.address ?? "",
  );

 formData.append(
  "email",
  String(
    input.email ?? "",
  ).trim(),
);
  formData.append(
    "countryCode",
    input.countryCode ?? "+91",
  );

  formData.append(
    "phone",
    input.phone ?? "",
  );

  formData.append(
    "gstin",
    input.gstin ?? "",
  );

  formData.append(
    "pan",
    input.pan ?? "",
  );

  formData.append(
    "type_of_service",
    input.type_of_service ?? "",
  );

  if (input.gst_document instanceof File) {
    formData.append(
      "gst_document",
      input.gst_document,
    );
  }

  if (input.pan_document instanceof File) {
    formData.append(
      "pan_document",
      input.pan_document,
    );
  }

  payload = formData;
}

 if (key === "importJobs") {
  payload = {
    job_no: input.jobNo,

    bl_no: input.blNo,
    bl_date: input.blDate,

    invoice_no: input.invoiceNo,
    invoice_date: input.invoiceDate,

    no_of_cntr: input.noOfCntr,

    container_numbers: normalizeContainerNumbers(
      input.containerNumbers,
    ),

    size: input.size,

    line_name: input.lineName,
    forwarder: input.forwarderName,

    eta: input.eta,

    consignee_name: input.consigneeName,
    consignee_address: input.consigneeAddress,

    cargo_description: input.cargoDescription,
  };
}

const item = await request<any>(route, {
  method: "POST",
  body:
    payload instanceof FormData
      ? payload
      : JSON.stringify(payload),
});

if (key === "importJobs") {
  return {
    id: item.id ?? item._id,

    job_id: item.id ?? item._id,
    job_number: item.job_number,

    jobNo: item.job_number,
    blNo: item.bl_no,
    blDate: item.bl_date,

    invoiceNo: item.invoice_no,
    invoiceDate: item.invoice_date,

    noOfCntr: item.no_of_cntr,

    containerNumbers: containerNumbersToText(
      item.container_numbers,
    ),

    size: item.size,

    lineName: item.line_name,
    forwarderName: item.forwarder,

    eta: item.eta,

    consigneeName: item.consignee_name,
    consigneeAddress: item.consignee_address,

    cargoDescription: item.cargo_description,

    createdAt: item.created_at,
  }  as unknown as EntityMap[K];
}

return {
  ...item,
  id: item.id ?? item._id,
};
},


async startCustomerEmailUpdate(
  customerId: string,
  customer: Record<string, unknown>,
) {
  return request<{
    verification_required: boolean;
    updated: boolean;

    registration_id?: string;

    entity_type?: "customer";

    operation_type?: "email_update";

    entity_id?: string;

    entity_name?: string;

    expires_at?: string;

    verification_fields?: Array<{
      key: string;
      label: string;
      email: string;
      verified: boolean;
      otp_sent?: boolean;
    }>;

    customer?: Record<
      string,
      unknown
    >;

    message?: string;
  }>(
    "/customers/email-update/start",
    {
      method: "POST",

      body: JSON.stringify({
        customer_id:
          customerId,

        customer,
      }),
    },
  );
},

async startVendorEmailUpdate(
  vendorId: string,
  vendor: Record<string, unknown>,
) {
  return request<{
    verification_required: boolean;
    updated: boolean;

    registration_id?: string;

    entity_type?: "vendor";

    operation_type?: "email_update";

    entity_id?: string;

    entity_name?: string;

    expires_at?: string;

    verification_fields?: Array<{
      key: string;
      label: string;
      email: string;
      verified: boolean;
      otp_sent?: boolean;
    }>;

    vendor?: Record<
      string,
      unknown
    >;

    message?: string;
  }>(
    "/vendors/email-update/start",
    {
      method: "POST",

      body: JSON.stringify({
        vendor_id:
          vendorId,

        vendor,
      }),
    },
  );
},



async update<K extends EntityKey>(
  key: K,
  id: ID,
  patch: Partial<EntityMap[K]>,
): Promise<EntityMap[K]> {

  const route = ROUTES[key];

  // ---------------- Import Workflow ----------------

  if (key === "importChecklists") {
    const workflow = patch as any;

    if (!workflow.job_id) {
      throw new Error("Workflow job_id is missing.");
    }

   const payload = toImportWorkflowPayload(workflow);


const item = await request<any>(
  `/import-workflows/${workflow.job_id}`,
  {
    method: "PUT",
    body: JSON.stringify(payload),
  },
);

// return fromImportWorkflow(item) as EntityMap[K]; 
return fromImportWorkflow(item) as unknown as EntityMap[K];
  }

  // ---------------- Default ----------------

if (key === "customers") {
  const customer = patch as any;

  const managementEmail =
    String(
      customer.managementEmail ??
        customer.management_email ??
        "",
    ).trim();

  const accountsEmail =
    String(
      customer.accountsEmail ??
        customer.accounts_email ??
        "",
    ).trim();

  const operationsEmail =
    String(
      customer.operationsEmail ??
        customer.operations_email ??
        "",
    ).trim();

  patch = {
    customer_code:
      customer.customer_code ??
      customer.customerCode,

    customer_name:
      customer.customer_name ??
      customer.customerName,

    address:
      customer.address,

    management_email:
      managementEmail,

    // Optional emails must be null,
    // never an empty string.
    accounts_email:
      accountsEmail || null,

    operations_email:
      operationsEmail || null,

    countryCode:
      customer.countryCode,

    phone:
      customer.phone,

    gstin:
      customer.gstin,

    pan:
      customer.pan,

    tan:
      customer.tan,
  } as any;
}

if (key === "vendors") {
  const vendor = patch as any;

  const formData = new FormData();

  if (vendor.vendor_code !== undefined) {
    formData.append(
      "vendor_code",
      vendor.vendor_code ?? "",
    );
  }

  if (vendor.vendor_name !== undefined) {
    formData.append(
      "vendor_name",
      vendor.vendor_name ?? "",
    );
  }

  if (vendor.address !== undefined) {
    formData.append(
      "address",
      vendor.address ?? "",
    );
  }

if (vendor.email !== undefined) {
  formData.append(
    "email",
    String(
      vendor.email ?? "",
    ).trim(),
  );
}

  if (vendor.countryCode !== undefined) {
    formData.append(
      "countryCode",
      vendor.countryCode ?? "+91",
    );
  }

  if (vendor.phone !== undefined) {
    formData.append(
      "phone",
      vendor.phone ?? "",
    );
  }

  if (vendor.gstin !== undefined) {
    formData.append(
      "gstin",
      vendor.gstin ?? "",
    );
  }

  if (vendor.pan !== undefined) {
    formData.append(
      "pan",
      vendor.pan ?? "",
    );
  }

  if (
    vendor.type_of_service !== undefined
  ) {
    formData.append(
      "type_of_service",
      vendor.type_of_service ?? "",
    );
  }

  if (
    vendor.gst_document instanceof File
  ) {
    formData.append(
      "gst_document",
      vendor.gst_document,
    );
  }

  if (
    vendor.pan_document instanceof File
  ) {
    formData.append(
      "pan_document",
      vendor.pan_document,
    );
  }

  patch = formData as any;
}
if (key === "importJobs") {
  const job = patch as any;

  patch = {
    bl_no: job.blNo,
    bl_date: job.blDate,

    invoice_no: job.invoiceNo,
    invoice_date: job.invoiceDate,

    no_of_cntr: job.noOfCntr,

    container_numbers: normalizeContainerNumbers(
      job.containerNumbers,
    ),

    size: job.size,

    line_name: job.lineName,
    forwarder: job.forwarderName,

    eta: job.eta,

    consignee_name: job.consigneeName,
    consignee_address: job.consigneeAddress,

    cargo_description: job.cargoDescription,
  } as any;
}
  if (!route) {
    throw new Error(`${key} backend not implemented`);
  }

 const item: any = await request(
  `${route}/${id}`,
  {
    method: "PUT",

    body:
      patch instanceof FormData
        ? patch
        : JSON.stringify(patch),
  },
);

  

  return {
    ...item,
    id: item.id ?? item._id,
  };
},

async remove<K extends EntityKey>(
  key: K,
  id: ID,
): Promise<void> {

  const route = ROUTES[key];

  if (!route) {
    throw new Error(`${key} backend not implemented`);
  }

  await request(`${route}/${id}`, {
    method: "DELETE",
  });
},

async removeMany<K extends EntityKey>(
  key: K,
  ids: ID[],
): Promise<void> {

  for (const id of ids) {
    await this.remove(key, id);
  }
},

async bulkCreate<K extends EntityKey>(
  key: K,
  inputs: Partial<EntityMap[K]>[],
): Promise<EntityMap[K][]> {

  const result: EntityMap[K][] = [];

  for (const item of inputs) {
    result.push(await this.create(key, item));
  }

  return result;
},
async getNextCustomerCode(): Promise<{ customer_code: string }> {
  return request<{ customer_code: string }>("/customers/next-code");
},

async getNextVendorCode(): Promise<{ vendor_code: string }> {
  return request<{ vendor_code: string }>("/vendors/next-code");
},
 
async getNextImportJobNumber(): Promise<string> {
  const response = await request<{
    job_number: string;
  }>("/import-jobs/next-number");

  return response.job_number;
},

async getLineNames(): Promise<{ name: string }[]> {
  return request<{ name: string }[]>("/masters/line-names");
},

async createLineName(name: string) {
  return request("/masters/line-names?name=" + encodeURIComponent(name), {
    method: "POST",
  });
},

async updateLineName(
  oldName: string,
  newName: string,
): Promise<void> {
  await request(
    `/masters/line-names/${encodeURIComponent(oldName)}?new_name=${encodeURIComponent(newName)}`,
    {
      method: "PUT",
    }
  );
},

async deleteLineName(name: string) {
  return request(
    "/masters/line-names/" + encodeURIComponent(name),
    {
      method: "DELETE",
    },
  );
},

async getTypeOfServices(): Promise<{ name: string }[]> {
  return request<{ name: string }[]>("/masters/type-of-services");
},

async createTypeOfService(name: string) {
  return request(
    "/masters/type-of-services?name=" + encodeURIComponent(name),
    {
      method: "POST",
    },
  );
},

async updateTypeOfService(
  oldName: string,
  newName: string,
): Promise<void> {
  await request(
    `/masters/type-of-services/${encodeURIComponent(oldName)}?new_name=${encodeURIComponent(newName)}`,
    {
      method: "PUT",
    },
  );
},

async deleteTypeOfService(name: string) {
  return request(
    "/masters/type-of-services/" + encodeURIComponent(name),
    {
      method: "DELETE",
    },
  );
},

async getPurchaseOrderServiceStatus(
  jobId: string,
  category: string,
  serviceName: string,
): Promise<PurchaseOrderServiceStatus> {

  const params = new URLSearchParams({
    job_id: jobId,
    category,
    service_name: serviceName,
  });

  return request<PurchaseOrderServiceStatus>(
    `/purchase-orders/service-status?${params.toString()}`,
  );
},


async cancelPurchaseOrderService(
  jobId: string,
  category: string,
  serviceName: string,
  reason = "Service removed from Import Workflow",
): Promise<CancelledPurchaseOrder> {

  const params = new URLSearchParams({
    job_id: jobId,
    category,
    service_name: serviceName,
  });

  return request<CancelledPurchaseOrder>(
    `/purchase-orders/cancel-service?${params.toString()}`,
    {
      method: "POST",

      body: JSON.stringify({
        reason,
      }),
    },
  );
},



async uploadPurchaseOrderInvoice(
  poNumber: string,
  file: File,
): Promise<EntityMap["purchaseOrders"]> {
  const formData = new FormData();

  formData.append(
    "invoice",
    file,
  );

  return request<
    EntityMap["purchaseOrders"]
  >(
    `/purchase-orders/${encodeURIComponent(
      poNumber,
    )}/invoice`,
    {
      method: "POST",
      body: formData,
    },
  );
},

};




export type ApiClient = typeof apiClient; 

