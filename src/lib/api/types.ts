// Domain types — mirror future FastAPI schema.
export type ID = string;

export type EntityKey =
  | "customers"
  | "vendors"
  | "pubOperations"
  | "importOperations"
  | "shippingLines"
  | "ports"
  | "containers"
  | "hsCodes"
  | "importJobs"
  | "importChecklists"
  | "exportJobs"
  | "trips"
  | "invoices"
  | "vendorBills"
  | "payments"
  | "expenses"
  | "rules"
  | "documents"
  | "reportRuns"
  | "notifications"
  | "type_of_service";
// export interface Customer {
//   id: ID;
//   code: string;
//   name: string;
//   address?: string;
//   email?: string;
//   phone?: string;
//   gstin?: string;
//   panNumber?: string;
//   tanNumber?: string;
//   country?: string;
//   type?: "Shipper" | "Consignee" | "Both" | "Vendor";
//   creditLimit?: number;
//   status?: "Active" | "KYC" | "Pending" | "Blocked";
//   createdAt: string;
// }OLD CODE
export interface Customer {
  id: ID;

  customer_code: string;
  customer_name: string;

  address: string;

  email: string;
  countryCode: string;
  phone: string;

  gstin: string;
  pan: string;
  tan: string;

  is_active: boolean;
  is_deleted: boolean;

  created_by?: string;
  updated_by?: string;

  created_at: string;
  updated_at: string;
}

export interface Vendor {
  id: ID;

  vendor_code: string;
  vendor_name: string;

  address: string;

  email: string;
  countryCode: string;
  phone: string;

  gstin: string;
  pan: string;

  type_of_service: string;

  is_active: boolean;
  is_deleted: boolean;

  created_by?: string;
  updated_by?: string;

  created_at: string;
  updated_at: string;
}

export interface PubOperation {
  id: ID;

  name: string;
  mobile_number: string;
  email: string;

  is_active: boolean;
  is_deleted: boolean;

  created_by?: string;
  updated_by?: string;

  created_at: string;
  updated_at: string;
}

export interface ImportOperation {
  id: ID;

  name: string;
  mobile_number: string;
  email: string;

  is_active: boolean;
  is_deleted: boolean;

  created_by?: string;
  updated_by?: string;

  created_at: string;
  updated_at: string;
}

export interface Operation {
  id: ID;

  name: string;
  mobile_number: string;
  email: string;

  operation_type:
    | "Pub Operations"
    | "Import Operations";

  is_active: boolean;
  is_deleted: boolean;

  created_by?: string;
  updated_by?: string;

  created_at: string;
  updated_at: string;
}

export interface ShippingLine {
  id: ID;
  code: string;
  name: string;
  scac: string;
  country: string;
  status: "Active" | "Inactive";
  createdAt: string;
}

export interface Port {
  id: ID;
  code: string;
  name: string;
  country: string;
  type: "Sea" | "Air" | "ICD";
  createdAt: string;
}

export interface ContainerType {
  id: ID;
  code: string;
  description: string;
  teu: number;
  createdAt: string;
}

export interface HSCode {
  id: ID;
  code: string;
  description: string;
  gstRate: number;
  createdAt: string;
}

export type JobStatus =
  | "Inquiry"
  | "Quotation"
  | "Booking"
  | "Loaded"
  | "At Sea"
  | "Customs"
  | "Cleared"
  | "Closed"
  | "Stuffed"
  | "Sailed"
  | "Documented";

export interface ImportJob {
  id: ID;

  job_id?: string;
  job_number?: string;

  jobNo: string;
  blNo?: string;
  blDate?: string;
  beNo?: string;
  invoiceNo?: string;
  invoiceDate?: string;
  noOfCntr?: number;
  containerNumbers?: string;
  size?: string;
  consigneeName?: string;
  consigneeAddress?: string;
  forwarderName?: string;
  cargoDescription?: string;
  lineName?: string;
  eta?: string;
  // legacy optional
  customer?: string;
  origin?: string;
  destination?: string;
  vessel?: string;
  bl?: string;
  status?: JobStatus;
  createdAt: string;
}

export type ServiceItem = {
  status: string;
  tariff?: number;
  unit?: "Container" | "BL" | "";
};

export type ServiceMap = Record<string, ServiceItem>;

export interface ImportChecklist {
  id: ID;

  job_id?: string;
  job_number?: string;

  jobNo?: string;
  blNo?: string;

  checklist?: "Pending" | "Done";

  igm_no?: string;
  igm_date?: string;
  igm_status?: "Pending" | "Done";

  inward_date?: string;

  be_no?: string;
  be_date?: string;

  goods_registration?: "Pending" | "Done";

  other_gov_agency?: "Yes" | "No";
  other_gov_agency_type?: ServiceMap;

  assessment_type?: string;
  cfs_name?: string;

  boe_copy_mailed?: "Pending" | "Done";

  original_documents?: "Pending" | "Done";

  co_deface_required?: "Yes" | "No";
  co_deface?: "Pending" | "Done";

  duty_payment?: "Pending" | "Done";

  out_of_charge?: "Pending" | "Done";

  oc_mail_sent?: "Pending" | "Done";

  liner_invoice_received?: "Pending" | "Done";

  liner_payment?: "Pending" | "Done";

  payment_confirmation?: "Pending" | "Done";

  do_received?: "Pending" | "Done";
  do_validity?: string;
  do_type?: string;

  transportation?: string;
  transporter?: string;

  empty_container_return?: "Pending" | "Done";

  container_unloaded?: "Pending" | "Done";

  detention?: "Pending" | "Done";

  job_closed?: "Pending" | "Done";

  remarks?: string;

  current_stage?: string;

  createdAt?: string;
}

export interface ExportJob {
  id: ID;
  jobNo: string;
  customer: string;
  origin: string;
  destination: string;
  vessel: string;
  shippingBill: string;
  etd: string;
  status: JobStatus;
  createdAt: string;
}

export interface Trip {
  id: ID;
  tripNo: string;
  vehicle: string;
  driver: string;
  route: string;
  container: string;
  status: "Planned" | "Loading" | "In Transit" | "Delivered";
  createdAt: string;
}

export interface Invoice {
  id: ID;
  invoiceNo: string;
  customer: string;
  job: string;
  amount: number;
  gst: number;
  dueDate: string;
  status: "Draft" | "Issued" | "Pending" | "Paid" | "Overdue";
  createdAt: string;
}

export interface VendorBill {
  id: ID;
  billNo: string;
  vendor: string;
  job: string;
  amount: number;
  dueDate: string;
  status: "Pending" | "Paid";
  createdAt: string;
}

export interface Payment {
  id: ID;
  reference: string;
  party: string;
  mode: "NEFT" | "RTGS" | "UPI" | "Cheque" | "Cash";
  amount: number;
  date: string;
  createdAt: string;
}

export interface Expense {
  id: ID;
  reference: string;
  category: string;
  amount: number;
  date: string;
  notes?: string;
  createdAt: string;
}

export interface AutomationRule {
  id: ID;
  name: string;
  channel: "Email" | "WhatsApp" | "Email + WhatsApp" | "In-app";
  trigger: string;
  enabled: boolean;
  runs: number;
  createdAt: string;
}

export interface DocumentItem {
  id: ID;
  name: string;
  type: "BL" | "Invoice" | "Packing List" | "Shipping Bill" | "BOE" | "Other";
  job: string;
  sizeKb: number;
  uploadedBy: string;
  createdAt: string;
}

export interface ReportRun {
  id: ID;
  report: string;
  range: string;
  generatedBy: string;
  format: "PDF" | "XLSX" | "CSV";
  createdAt: string;
}

export interface NotificationItem {
  id: ID;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

export type EntityMap = {
  customers: Customer;
  vendors: Vendor;
     pubOperations: PubOperation;
  importOperations: ImportOperation;
  shippingLines: ShippingLine;
  ports: Port;
  containers: ContainerType;
  hsCodes: HSCode;
  importJobs: ImportJob;
  importChecklists: ImportChecklist;
  exportJobs: ExportJob;
  trips: Trip;
  invoices: Invoice;
  vendorBills: VendorBill;
  payments: Payment;
  expenses: Expense;
  rules: AutomationRule;
  documents: DocumentItem;
  reportRuns: ReportRun;
  notifications: NotificationItem;
  type_of_service: {
  id?: string;
  name: string;
};
};
