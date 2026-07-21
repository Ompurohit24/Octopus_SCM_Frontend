
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

export const apiClient = {
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

  formData.append("customer_code", input.customer_code ?? "");
  formData.append("customer_name", input.customer_name ?? "");
  formData.append("address", input.address ?? "");
  const customerEmails = Array.isArray(input.email)
  ? input.email
      .map((email: unknown) => String(email ?? "").trim())
      .filter(Boolean)
  : input.email
    ? [String(input.email).trim()]
    : [];

formData.append(
  "email",
  JSON.stringify(customerEmails),
);

  formData.append("countryCode", input.countryCode ?? "+91");
  formData.append("phone", input.phone ?? "");

  formData.append("gstin", input.gstin ?? "");
  formData.append("pan", input.pan ?? "");
  formData.append("tan", input.tan ?? "");

  if (input.gst_document) {
    formData.append("gst_document", input.gst_document);
  }

  if (input.pan_document) {
    formData.append("pan_document", input.pan_document);
  }

  payload = formData;
}

if (key === "vendors") {
payload = {
  vendor_code: input.vendor_code,
  vendor_name: input.vendor_name,
  address: input.address,
  email: input.email,
  countryCode: input.countryCode,
  phone: input.phone,
  gstin: input.gstin,
  pan: input.pan,
  type_of_service: input.type_of_service,
};
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

  patch = {
    customer_code: customer.customer_code,
    customer_name: customer.customer_name,
    address: customer.address,
    email: customer.email,
    country_code: customer.countryCode,
    phone: customer.phone,
    gstin: customer.gstin,
    pan: customer.pan,
    tan: customer.tan,
  } as any;
}

if (key === "vendors") {
  const vendor = patch as any;

  patch = {
    vendor_code: vendor.vendor_code,
    vendor_name: vendor.vendor_name,
    address: vendor.address,
    email: vendor.email,
    countryCode: vendor.countryCode,
    phone: vendor.phone,
    gstin: vendor.gstin,
    pan: vendor.pan,
    type_of_service: vendor.type_of_service,
  } as any;
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

  const item: any = await request(`${route}/${id}`, {
    method: "PUT",
    body: JSON.stringify(patch),
  });

  

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

