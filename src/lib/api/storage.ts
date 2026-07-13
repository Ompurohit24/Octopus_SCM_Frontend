
import type { EntityKey, EntityMap, ID } from "./types";

const API = "const API = import.meta.env.VITE_API_URL;";
 
// const API = "https://octopus-scm-backend.onrender.com";
const TOKEN_KEY = "access_token";

function token() {
  return localStorage.getItem(TOKEN_KEY);
}

async function request<T>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  const headers: Record<string, string> = {
  ...(token()
    ? {
        Authorization: `Bearer ${token()}`,
      }
    : {}),
  ...(options.headers as Record<string, string>),
};

if (!(options.body instanceof FormData)) {
  headers["Content-Type"] = "application/json";
}

const res = await fetch(API + url, {
  ...options,
  headers,
});

  if (res.status === 401) {
    localStorage.removeItem(TOKEN_KEY);
    window.location.href = "/";
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    let message = "Request failed";

    try {
      const err = await res.json();

console.error("FastAPI Validation Error", err);

message =
  typeof err.detail === "string"
    ? err.detail
    : JSON.stringify(err.detail, null, 2);
    } catch {}

    throw new Error(message);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return (await res.json()) as T;
}

const ROUTES: Partial<Record<EntityKey, string>> = {
  customers: "/customers",
  importJobs: "/import-jobs",
  importChecklists: "/import-workflows",
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

    // inward_date: workflow.inwardDate,

    inward_date: workflow.inwardDate || null,

    // be_no: workflow.beNo,

    be_no: workflow.beNo || null,

    // be_date: workflow.beDate, 
   be_date: workflow.beDate || null,

    goods_registration: workflow.goodsRegi,

    other_gov_agency: workflow.otherGovAgency,
    // other_gov_agency_type: workflow.otherGovAgencyType,
    other_gov_agency_type:
  typeof workflow.otherGovAgencyType === "string"
    ? workflow.otherGovAgencyType
    : null,
    assessment_type: workflow.assessmentType,
    cfs_name: workflow.cfsName,

    boe_copy_mailed: workflow.boeCopyMailed,

    original_documents: workflow.document,

    co_deface_required: workflow.coDefaceRequired,
    co_deface: workflow.coDeface,

    duty_payment: workflow.dutyPayment,

    out_of_charge: workflow.ooc,

    oc_mail_sent: workflow.ocMail,

    liner_invoice_received: workflow.linerInvoice,

    liner_payment: workflow.linerPayment,

    payment_confirmation: workflow.paymentConfirm,

    do_received: workflow.doReceived,
    // do_validity: workflow.doValidity, 
    do_validity: workflow.doValidity || null,
    do_type: workflow.doProcess,

    transportation: workflow.transportation,
    transporter: workflow.transporter,

    empty_container_return: workflow.performaInvoice,

    container_unloaded: workflow.cfsPayment,

    detention: workflow.delivery,

    job_closed: workflow.vendorInvoices,

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
        blDate: item.bl_date,

        invoiceNo: item.invoice_no,
        invoiceDate: item.invoice_date,

        noOfCntr: item.no_of_cntr,
        size: item.size,

        lineName: item.line_name,
        forwarderName: item.forwarder,

        eta: item.eta,

        consigneeName: item.consignee_name,
        consigneeAddress: item.consignee_address,

        cargoDescription: item.cargo_description,

        createdAt: item.created_at,
      })) as EntityMap[K][],
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

  return {
    rows: response.items.map((item: any) => ({
  ...item,
  id: item.id ?? item._id,

  customerCode: item.customer_code,
  customer_code: item.customer_code,

  customerName: item.customer_name,
  customer_name: item.customer_name,

  countryCode: item.country_code,
})) as EntityMap[K][],
    total: response.total,
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

  // return request<EntityMap[K]>(`${route}/${id}`);
const item = await request<any>(`${route}/${id}`);

if (key === "importChecklists") {
  return fromImportWorkflow(item) as unknown as EntityMap[K];
}

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

console.log("UPDATE WORKFLOW PAYLOAD");
console.table(payload);

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
  formData.append("email", input.email ?? "");

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

  if (key === "importJobs") {
    payload = {
      job_no: input.jobNo,
      bl_no: input.blNo,
      bl_date: input.blDate,
      invoice_no: input.invoiceNo,
      invoice_date: input.invoiceDate,
      no_of_cntr: input.noOfCntr,
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
  body: payload instanceof FormData
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
    size: item.size,
    lineName: item.line_name,
    forwarderName: item.forwarder,
    eta: item.eta,
    consigneeName: item.consignee_name,
    consigneeAddress: item.consignee_address,
    cargoDescription: item.cargo_description,
    createdAt: item.created_at,
  } as EntityMap[K];
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

console.log("UPDATE WORKFLOW PAYLOAD");
console.log(payload);

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

  if (!route) {
    throw new Error(`${key} backend not implemented`);
  }

  const item: any = await request(`${route}/${id}`, {
    method: "PUT",
    body: JSON.stringify(patch),
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
      size: item.size,

      lineName: item.line_name,
      forwarderName: item.forwarder,

      eta: item.eta,

      consigneeName: item.consignee_name,
      consigneeAddress: item.consignee_address,

      cargoDescription: item.cargo_description,

      createdAt: item.created_at,
    } as EntityMap[K];
  }

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
async getNextCustomerCode(): Promise<string> {
  const response = await request<{
    customer_code: string;
  }>("/customers/next-code");

  return response.customer_code;
},

async getNextImportJobNumber(): Promise<string> {
  const response = await request<{
    job_number: string;
  }>("/import-jobs/next-number");

  return response.job_number;
},

};

export type ApiClient = typeof apiClient; 

