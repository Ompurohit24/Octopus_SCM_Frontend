// Declarative entity configuration: drives the generic ModulePage CRUD UI.
// Each config owns columns, form fields, search, and an optional code-prefix
// for auto-generated reference numbers.
import type { ReactNode } from "react";
import type { EntityKey, EntityMap } from "@/lib/api/types";
import { Pill } from "@/components/octopus/ModulePage";
import { formatINR, formatDate } from "@/lib/csv";
import { Pencil } from "lucide-react";
export type FieldType =
  | "text"
  | "number"
  | "select"
  | "date"
  | "textarea"
  | "switch"
  | "services"
  | "emails"
  | "file";

export interface FieldDef {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: string[];
  optionsSource?: { entity: EntityKey; labelField: string; secondaryLabelField?: string };
  placeholder?: string;
  default?: string | number | boolean;
  readOnly?: boolean;
  hint?: string;
  colSpan?: 1 | 2 | 3;
  // simple validators
  min?: number;
  max?: number;
  email?: boolean;
  pattern?: { value: RegExp; message: string };
  showWhen?: { field: string; equals: string | string[] };
  // Allow users to add new options at runtime (persisted in localStorage)
  creatable?: boolean;
  // For type: "services" — the status options each selected service can take
  serviceStatusOptions?: string[];
}

export interface ColumnDef<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (row: T) => ReactNode;
  className?: string;
}

export interface EntityConfig<K extends EntityKey> {
  key: K;
  singular: string;
  plural: string;
  description: string;
  searchPlaceholder?: string;
  columns: ColumnDef<EntityMap[K]>[];
  fields: FieldDef[];
  codePrefix?: { field: string; prefix: string; pad?: number };
  initial?: Partial<EntityMap[K]>;
  // optional cross-cutting tab filter: tabs render across the top, filter applied to a field
  tabs?: { label: string; value: string | "all" }[];
  tabFilterKey?: string;
}

const STATUS_TONES: Record<string, "default" | "blue" | "green" | "amber" | "red"> = {
  Active: "green",
  Paid: "green",
  Cleared: "green",
  Delivered: "green",
  Sailed: "green",
  KYC: "blue",
  Issued: "blue",
  Loaded: "blue",
  "At Sea": "blue",
  "In Transit": "blue",
  Stuffed: "blue",
  Pending: "amber",
  Customs: "amber",
  Quotation: "amber",
  Loading: "amber",
  Booking: "default",
  Documented: "amber",
  Draft: "default",
  Inquiry: "default",
  Planned: "default",
  Inactive: "default",
  Closed: "default",
  Blocked: "red",
  Overdue: "red",
};

function statusCell<T extends { status?: string }>(row: T) {
  const s = row.status ?? "";
  return <Pill tone={STATUS_TONES[s] ?? "default"}>{s || "—"}</Pill>;
}

export const customersConfig: EntityConfig<"customers"> = {
  key: "customers",
  singular: "Customer",
  plural: "Customers",
  description:
    "Customers, vendors, shipping lines, ports, containers and HS codes — all in one normalized registry.",
  searchPlaceholder: "Search customers…",
  // codePrefix: { field: "code", prefix: "CUS-", pad: 4 },
  codePrefix: {
  field: "customer_code",
  prefix: "CUS-",
  pad: 4,
},
  // columns: [
  //   { key: "customer_code", label: "Code", sortable: true },
  //   { key: "customer_name", label: "Name", sortable: true },
  //   { key: "address", label: "Address" },
  //   { key: "email", label: "Email", sortable: true },
  //   { key: "phone", label: "Phone" },
  //   { key: "gstin", label: "GSTIN" },
  //   { key: "pan", label: "PAN" },
  //   { key: "tan", label: "TAN" },
  // ], OLD

  columns: [
  { key: "customer_code", label: "Code", sortable: true },
  { key: "customer_name", label: "Name", sortable: true },

  {
    key: "address",
    label: "Address",
    render: (row) => row.address ?? "-",
  },

  {
  key: "email",
  label: "Email",
  sortable: true,
  render: (row) => {
    const emails = row.email;

    if (Array.isArray(emails)) {
      return emails.join(", ");
    }

    return emails || "-";
  },
},
  { key: "phone", label: "Phone" },
  { key: "gstin", label: "GSTIN" },
  { key: "pan", label: "PAN" },
  { key: "tan", label: "TAN" },
],
//   fields: [
//   {
//     name: "customer_code",
//     label: "Customer Code",
//     type: "text",
//     required: true,
//     readOnly: true,
//     hint: "Auto-generated",
//   },
//   {
//     name: "customer_name",
//     label: "Customer Name",
//     type: "text",
//     required: true,
//     placeholder: "Acme Logistics",
//   },
//   {
//   name: "address",
//   label: "Address",
//   render: (row) =>
//     row.address
//       ? [
//           row.address.address1,
//           row.address.address2,
//           row.address.city,
//           row.address.state,
//           row.address.country,
//           row.address.pincode,
//         ]
//           .filter(Boolean)
//           .join(", ")
//       : "-",
// },
//   {
//     name: "email",
//     label: "Email",
//     type: "text",
//     required: true,
//     email: true,
//   },
//   {
//     name: "phone",
//     label: "Phone",
//     type: "text",
//     required: true,
//   },
//   {
//     name: "gstin",
//     label: "GSTIN",
//     type: "text",
//     required: true,
//     placeholder: "22AAAAA0000A1Z5",
//     pattern: {
//       value: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
//       message: "Invalid GSTIN format",
//     },
//   },
//   {
//     name: "pan",
//     label: "PAN",
//     type: "text",
//     required: true,
//     placeholder: "AAAAA0000A",
//     pattern: {
//       value: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
//       message: "Invalid PAN format",
//     },
//   },
//   {
//     name: "tan",
//     label: "TAN",
//     type: "text",
//     placeholder: "AAAA00000A",
//     pattern: {
//       value: /^[A-Z]{4}[0-9]{5}[A-Z]{1}$/,
//       message: "Invalid TAN format",
//     },
//   },
// ], 2nd OLD CODE

fields: [
  // {
  //   name: "customer_code",
  //   label: "Customer Code",
  //   type: "text",
  //   required: true,
  //   readOnly: true,
  //   hint: "Auto-generated",
  // },
  {
  name: "customer_code",
  label: "Customer Code",
  type: "text",
  readOnly: true,
  hint: "Generated by server",
},
  {
    name: "customer_name",
    label: "Customer Name",
    type: "text",
    required: true,
  },
  {
    name: "address",
    label: "Address",
    type: "textarea",
    required: true,
    colSpan: 3,
  },
  {
  name: "email",
  label: "Email",
  type: "emails",
  required: true,
},
  {
  name: "countryCode",
  label: "Country Code",
  type: "select",
  required: true,
  default: "+91",
  options: [
    "+91",
    "+1",
    "+44",
    "+61",
    "+65",
    "+971",
    "+966",
    "+86",
    "+81",
    "+49",
  ],
},

{
  name: "phone",
  label: "Mobile Number",
  type: "text",
  required: true,
  // placeholder: "9876543210",
},
  {
    name: "gstin",
    label: "GSTIN",
    type: "text",
    required: true,
    // pattern: {
    //   value: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
    //   message: "Invalid GSTIN format",
    // },
  },
  {
  name: "gst_document",
  label: "GST Document",
  type: "file",
  required: true,
  hint: "Upload GST Certificate (PDF, JPG, PNG)",
},
  {
    name: "pan",
    label: "PAN",
    type: "text",
    required: true,
    // pattern: {
    //   value: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
    //   message: "Invalid PAN format",
    // },
  },
  {
  name: "pan_document",
  label: "PAN Document",
  type: "file",
  required: true,
  hint: "Upload PAN Card (PDF, JPG, PNG)",
},
  {
    name: "tan",
    label: "TAN",
    type: "text",
    required: false,
    // pattern: {
    //   value: /^[A-Z]{4}[0-9]{5}[A-Z]{1}$/,
    //   message: "Invalid TAN format",
    // },
  },
],
};

export const vendorsConfig: EntityConfig<"vendors"> = {
  key: "vendors",
  singular: "Vendor",
  plural: "Vendors",
  description: "Vendor Master",
  codePrefix: {
    field: "vendor_code",
    prefix: "VEN-",
    pad: 4,
  },

  columns: [
    { key: "vendor_code", label: "Vendor Code", sortable: true },
    { key: "vendor_name", label: "Vendor Name", sortable: true },
    { key: "type_of_service", label: "Type of Service", sortable: true },
    { key: "phone", label: "Mobile Number", sortable: true },
    { key: "email", label: "Email ID", sortable: true },
  ],

  fields: [
    {
      name: "vendor_code",
      label: "Vendor Code",
      type: "text",
      required: true,
      readOnly: true,
    },
    {
      name: "vendor_name",
      label: "Vendor Name",
      type: "text",
      required: true,
    },
    {
  name: "type_of_service",
  label: "Type of Service",
  type: "select",
  required: true,
  optionsSource: {
    entity: "type_of_service",
    labelField: "name",
  },
},
    {
      name: "address",
      label: "Address",
      type: "textarea",
      required: true,
    },
  {
  name: "gstin",
  label: "GSTIN",
  type: "text",
  required: true,
},
{
  name: "gst_document",
  label: "GST Document",
  type: "file",
  required: true,
  hint: "Upload GST Certificate (PDF, JPG, PNG)",
},
{
  name: "pan",
  label: "PAN",
  type: "text",
  required: true,
},
{
  name: "pan_document",
  label: "PAN Document",
  type: "file",
  required: true,
  hint: "Upload PAN Card (PDF, JPG, PNG)",
},
    {
  name: "email",
  label: "Email ID",
  type: "emails",
  required: true,
},
    {
      name: "countryCode",
      label: "Country Code",
      type: "select",
      required: true,
     options: [
  "+91",
  "+1",
  "+44",
  "+971",
  // ...
],
default: "+91",
    },
    {
      name: "phone",
      label: "Mobile Number",
      type: "text",
      required: true,
    },
  ],
};

export const shippingLinesConfig: EntityConfig<"shippingLines"> = {
  key: "shippingLines",
  singular: "Shipping Line",
  plural: "Shipping Lines",
  description: "Ocean carriers and their SCAC codes.",
  codePrefix: { field: "code", prefix: "SL-", pad: 3 },
  columns: [
    { key: "code", label: "Code", sortable: true },
    { key: "name", label: "Name", sortable: true },
    { key: "scac", label: "SCAC", sortable: true },
    { key: "country", label: "Country", sortable: true },
    { key: "status", label: "Status", render: statusCell },
  ],
  fields: [
    { name: "code", label: "Code", type: "text", required: true },
    { name: "name", label: "Name", type: "text", required: true },
    { name: "scac", label: "SCAC", type: "text", required: true },
    { name: "country", label: "Country", type: "text", required: true },
    {
      name: "status",
      label: "Status",
      type: "select",
      required: true,
      options: ["Active", "Inactive"],
      default: "Active",
    },
  ],
};

export const portsConfig: EntityConfig<"ports"> = {
  key: "ports",
  singular: "Port",
  plural: "Ports",
  description: "Sea ports, airports and ICDs.",
  codePrefix: { field: "code", prefix: "P-", pad: 4 },
  columns: [
    { key: "code", label: "Code", sortable: true },
    { key: "name", label: "Name", sortable: true },
    { key: "country", label: "Country", sortable: true },
    { key: "type", label: "Type", sortable: true },
  ],
  fields: [
    { name: "code", label: "UN/LOCODE", type: "text", required: true },
    { name: "name", label: "Name", type: "text", required: true },
    { name: "country", label: "Country", type: "text", required: true },
    {
      name: "type",
      label: "Type",
      type: "select",
      required: true,
      options: ["Sea", "Air", "ICD"],
      default: "Sea",
    },
  ],
};

export const containersConfig: EntityConfig<"containers"> = {
  key: "containers",
  singular: "Container Type",
  plural: "Containers",
  description: "Standard container types and TEU factor.",
  columns: [
    { key: "code", label: "Code", sortable: true },
    { key: "description", label: "Description", sortable: true },
    { key: "teu", label: "TEU", sortable: true },
  ],
  fields: [
    { name: "code", label: "Code", type: "text", required: true },
    { name: "description", label: "Description", type: "text", required: true },
    { name: "teu", label: "TEU", type: "number", required: true, min: 1, default: 1 },
  ],
};

export const hsCodesConfig: EntityConfig<"hsCodes"> = {
  key: "hsCodes",
  singular: "HS Code",
  plural: "HS Codes",
  description: "Harmonized System codes and GST rates.",
  columns: [
    { key: "code", label: "Code", sortable: true },
    { key: "description", label: "Description", sortable: true },
    { key: "gstRate", label: "GST %", sortable: true },
  ],
  fields: [
    { name: "code", label: "HSN", type: "text", required: true },
    { name: "description", label: "Description", type: "text", required: true },
    { name: "gstRate", label: "GST %", type: "number", required: true, min: 0, max: 50, default: 18 },
  ],
};



const TODAY = new Date().toISOString().split("T")[0];
export const importJobsConfig: EntityConfig<"importJobs"> = {
  key: "importJobs",
  singular: "Import Job",
  plural: "Import Jobs",
  description:
    "Inquiry → Quotation → Booking → Job → Containers → BL → Customs → Invoice → Closing.",
  searchPlaceholder: "Search by Job No, BL No, Invoice No, Consignee…",
  codePrefix: { field: "jobNo", prefix: "IMP-", pad: 5 },
  columns: [
    { key: "jobNo", label: "Job Number", sortable: true },
    { key: "blNo", label: "BL No", sortable: true },
    { key: "blDate", label: "BL Date", sortable: true, render: (r) => formatDate(r.blDate) },
    { key: "invoiceNo", label: "Invoice No", sortable: true },
    { key: "invoiceDate", label: "Invoice Date", render: (r) => formatDate(r.invoiceDate) },
    { key: "noOfCntr", label: "No of Cntr", sortable: true },
    {
  key: "containerNumbers",
  label: "Container Numbers",
},
    { key: "size", label: "Size", sortable: true },
    { key: "consigneeName", label: "Name of Consignee", sortable: true },
    { key: "consigneeAddress", label: "Address of Consignee" },
    { key: "forwarderName", label: "Name of Forwarder", sortable: true },
    { key: "cargoDescription", label: "Cargo Description" },
    { key: "lineName", label: "Line Name", sortable: true },
    { key: "eta", label: "ETA", sortable: true, render: (r) => formatDate(r.eta) },
  ],
  fields: [
    // { name: "jobNo", label: "Job Number", type: "text", required: true, readOnly: true, hint: "Auto-generated" },
  {
  name: "jobNo",
  label: "Job Number",
  type: "text",
  readOnly: true,
  hint: "Generated by server",
},
    { name: "blNo", label: "BL No", type: "text", required: true },
    { 
  name: "blDate",
  label: "BL Date",
  type: "date",
  required: true,
  default: TODAY,
},
    { name: "invoiceNo", label: "Invoice No", type: "text", required: true },
    {
  name: "invoiceDate",
  label: "Invoice Date",
  type: "date",
  required: true,
  default: TODAY,
},
    {
  name: "noOfCntr",
  label: "No of Cntr",
  type: "number",
  min: 0,
  required: true,
},
{
  name: "containerNumbers",
  label: "Container Numbers",
  type: "text",
  required: true,
  placeholder: "DFSU1259598, TCLU3417974",
  colSpan: 2,
},
{
  name: "size",
  label: "Size",
  type: "select",
  options: ["20", "40"],
  default: "40",
  required: true,
},
    {
  name: "lineName",
  label: "Line Name",
  type: "select",
  required: true,
  creatable: true,
  options: [],
},
    { name: "forwarderName", label: "Name of Forwarder", type: "select", required: true, optionsSource: {
  entity: "customers",
  labelField: "customer_name",
} },
    {
  name: "eta",
  label: "ETA",
  type: "date",
  required: true,
  default: TODAY,
},
    { name: "consigneeName", label: "Name of Consignee", type: "text", required: true, colSpan: 3 },
    { name: "consigneeAddress", label: "Address of Consignee", type: "textarea", required: true, colSpan: 3 },
    { name: "cargoDescription", label: "Cargo Description", type: "text", required: true, colSpan: 3 },
  ],
};

const PD = ["Pending", "Done"];
const YN = ["Yes", "No"];

export const importChecklistsConfig: EntityConfig<"importChecklists"> = {
  key: "importChecklists",
  singular: "Checklist",
  plural: "Import Checklists",
  description: "Operational checklist for each import job.",
  columns: [
    { key: "jobNo", label: "Job No", sortable: true },
    { key: "checklist", label: "Checklist" },
    { key: "igmStatus", label: "IGM Status" },
    { key: "assessmentType", label: "Assessment" },
    { key: "cfsName", label: "CFS" },
    { key: "delivery", label: "Delivery" },
  ],
  fields: [
    // { name: "jobNo", label: "Job No / BL No", type: "select", optionsSource: { entity: "importJobs", labelField: "jobNo", secondaryLabelField: "blNo" }, colSpan: 3, required: true },
{
  name: "jobNo",
  label: "Job No / BL No / BE No",
  type: "select",
  optionsSource: {
    entity: "importJobs",
    labelField: "jobNo",
    secondaryLabelField: "blNo",
  },
  colSpan: 3,
  required: true,
},
    { name: "checklist", label: "Checklist", type: "select", options: PD, default: "Pending", required: false },
    // { name: "igm", label: "IGM", type: "date", required: true },
    { name: "igmDate", label: "IGM Date", type: "date", required: false },
    { name: "igmStatus", label: "IGM Status", type: "select", options: PD, default: "Pending", required: false },
    { name: "inwardDate", label: "Inward Date", type: "date", required: false },
    { name: "beNo", label: "BE No", type: "text",required: false },
    { name: "beDate", label: "BE Date", type: "date" },
    { name: "goodsRegi", label: "Goods Regi", type: "select", options: PD, default: "Pending", required: false },
    { name: "otherGovAgency", label: "Other Gov Agency", type: "select", options: YN, required: false },
    { name: "otherGovAgencyType", label: "Type of Other Gov Agency", type: "services", options: ["FSSAI", "PPQ", "CDRUG", "Other"], serviceStatusOptions: PD, showWhen: { field: "otherGovAgency", equals: "Yes" }, required: false, colSpan: 3 },
    { name: "assessmentType", label: "Assessment Type", type: "select", options: ["RMS", "APR"], required: false },
    { name: "cfsName", label: "CFS Name", type: "select", options: ["Hind Terminal", "Ashutosh", "Hind Terminal2", "Landmark", "Seabird", "Ameya", "Allcargo", "Speedy", "Mundhra", "Saurashtra", "Transworld1", "Transworld2"], creatable: true, showWhen: { field: "assessmentType", equals: "APR" }, required: false },
    { name: "boeCopyMailed", label: "BOE Copy Mailed", type: "select", options: PD, default: "Pending", required: false },
    { name: "document", label: "Document", type: "select", options: PD, default: "Pending", required: false },
    { name: "coDefaceRequired", label: "CO Deface Required", type: "select", options: YN, required: false },
    { name: "coDeface", label: "CO Deface", type: "select", options: PD, default: "Pending", showWhen: { field: "coDefaceRequired", equals: "Yes" }, required: false },
    { name: "dutyPayment", label: "Duty Payment", type: "select", options: PD, default: "Pending", required: false },
    { name: "ooc", label: "OOC", type: "select", options: PD, default: "Pending", required: false },
    { name: "ocMail", label: "OC Mail", type: "select", options: PD, default: "Pending", required: false },
    { name: "linerInvoice", label: "Liner Invoice", type: "select", options: PD, default: "Pending", required: false},
    { name: "linerPayment", label: "Liner Payment", type: "select", options: PD, default: "Pending", required: false},
    { name: "paymentConfirm", label: "Payment Confirm", type: "select", options: PD, default: "Pending", required: false },
    { name: "doDocs", label: "DO Docs", type: "select", options: PD, default: "Pending", required: false },
    { name: "doReceived", label: "DO Received", type: "select", options: PD, default: "Pending", required: false },
    { name: "doValidity", label: "DO Validity", type: "date", required: false, showWhen: { field: "doReceived", equals: "Done" } },
    { name: "doType", label: "DO Type", type: "select", options: ["Factory", "Doc destuff"], required: false, showWhen: { field: "doReceived", equals: "Done" } },
    { name: "doProcess", label: "DO Process", type: "select", options: ["Mundra", "Gandhidham", "Party"], required: false },
    { name: "stampDuty", label: "Stamp Duty", type: "select", options: PD, default: "Pending", required: false },
    { name: "transportation", label: "Transportation", type: "select", options: ["Octopus", "Party"], required: false },
    {
  name: "transporter",
  label: "Transporter",
  type: "select",
  optionsSource: {
    entity: "vendors",
    labelField: "vendor_name",
  },
  showWhen: {
    field: "transportation",
    equals: "Octopus",
  },
  required: false,
},
    { name: "performaInvoice", label: "Performa Invoice", type: "select", options: PD, default: "Pending", required: false },
    { name: "cfsPayment", label: "CFS Payment", type: "select", options: PD, default: "Pending", required: false },
    { name: "otherServices", label: "Other Services", type: "services", options: ["Insurance", "CE Certificate", "Phyto", "Fumigation", "Lashing Chocking", "Palletisation"], serviceStatusOptions: PD, colSpan: 3 },
    { name: "delivery", label: "Delivery", type: "select", options: PD, default: "Pending", required: false },
    { name: "vendorInvoices", label: "Vendor Invoices", type: "select", options: PD, default: "Pending", required: false },
  ],
};

export const exportJobsConfig: EntityConfig<"exportJobs"> = {
  key: "exportJobs",
  singular: "Export Job",
  plural: "Export Jobs",
  description:
    "Manage outbound shipments end-to-end: bookings, stuffing, shipping bill, vessel sailing and BL release.",
  codePrefix: { field: "jobNo", prefix: "EXP-", pad: 5 },
  tabFilterKey: "status",
  tabs: [
    { label: "All", value: "all" },
    { label: "Booking", value: "Booking" },
    { label: "Stuffed", value: "Stuffed" },
    { label: "Sailed", value: "Sailed" },
    { label: "Documented", value: "Documented" },
    { label: "Closed", value: "Closed" },
  ],
  columns: [
    { key: "jobNo", label: "Job #", sortable: true },
    { key: "customer", label: "Customer", sortable: true },
    {
      key: "lane",
      label: "Origin → Dest.",
      render: (r) => `${r.origin} → ${r.destination}`,
    },
    { key: "vessel", label: "Vessel", sortable: true },
    { key: "shippingBill", label: "SB #" },
    { key: "etd", label: "ETD", sortable: true, render: (r) => formatDate(r.etd) },
    { key: "status", label: "Status", render: statusCell },
  ],
  fields: [
    { name: "jobNo", label: "Job #", type: "text", required: true },
    { name: "customer", label: "Customer", type: "text", required: true },
    { name: "origin", label: "Origin", type: "text", required: true },
    { name: "destination", label: "Destination", type: "text", required: true },
    { name: "vessel", label: "Vessel", type: "text" },
    { name: "shippingBill", label: "SB #", type: "text" },
    { name: "etd", label: "ETD", type: "date" },
    {
      name: "status",
      label: "Status",
      type: "select",
      required: true,
      options: ["Booking", "Stuffed", "Sailed", "Documented", "Closed"],
      default: "Booking",
    },
  ],
};

export const tripsConfig: EntityConfig<"trips"> = {
  key: "trips",
  singular: "Trip",
  plural: "Trips",
  description:
    "Trailers, drivers, route planning and ICD movements — fully integrated with each job.",
  codePrefix: { field: "tripNo", prefix: "TR-", pad: 5 },
  columns: [
    { key: "tripNo", label: "Trip #", sortable: true },
    { key: "vehicle", label: "Vehicle", sortable: true },
    { key: "driver", label: "Driver", sortable: true },
    { key: "route", label: "Route" },
    { key: "container", label: "Container" },
    { key: "status", label: "Status", render: statusCell },
  ],
  fields: [
    { name: "tripNo", label: "Trip #", type: "text", required: true },
    { name: "vehicle", label: "Vehicle", type: "text", required: true },
    { name: "driver", label: "Driver", type: "text", required: true },
    { name: "route", label: "Route", type: "text", required: true },
    { name: "container", label: "Container", type: "text" },
    {
      name: "status",
      label: "Status",
      type: "select",
      required: true,
      options: ["Planned", "Loading", "In Transit", "Delivered"],
      default: "Planned",
    },
  ],
};

export const invoicesConfig: EntityConfig<"invoices"> = {
  key: "invoices",
  singular: "Invoice",
  plural: "Invoices",
  description:
    "Customer invoices, vendor bills, payments, outstanding and GST — synced with every job.",
  codePrefix: { field: "invoiceNo", prefix: "INV-", pad: 4 },
  columns: [
    { key: "invoiceNo", label: "Invoice #", sortable: true },
    { key: "customer", label: "Customer", sortable: true },
    { key: "job", label: "Job" },
    { key: "amount", label: "Amount", sortable: true, render: (r) => formatINR(r.amount) },
    { key: "gst", label: "GST", render: (r) => `${r.gst}%` },
    { key: "dueDate", label: "Due", sortable: true, render: (r) => formatDate(r.dueDate) },
    { key: "status", label: "Status", render: statusCell },
  ],
  fields: [
    { name: "invoiceNo", label: "Invoice #", type: "text", required: true },
    { name: "customer", label: "Customer", type: "text", required: true },
    { name: "job", label: "Job", type: "text" },
    { name: "amount", label: "Amount (₹)", type: "number", required: true, min: 0 },
    { name: "gst", label: "GST %", type: "number", required: true, min: 0, max: 50, default: 18 },
    { name: "dueDate", label: "Due Date", type: "date", required: true },
    {
      name: "status",
      label: "Status",
      type: "select",
      required: true,
      options: ["Draft", "Issued", "Pending", "Paid", "Overdue"],
      default: "Draft",
    },
  ],
};

export const vendorBillsConfig: EntityConfig<"vendorBills"> = {
  key: "vendorBills",
  singular: "Vendor Bill",
  plural: "Vendor Bills",
  description: "Vendor bills against jobs.",
  codePrefix: { field: "billNo", prefix: "VB-", pad: 4 },
  columns: [
    { key: "billNo", label: "Bill #", sortable: true },
    { key: "vendor", label: "Vendor", sortable: true },
    { key: "job", label: "Job" },
    { key: "amount", label: "Amount", sortable: true, render: (r) => formatINR(r.amount) },
    { key: "dueDate", label: "Due", sortable: true, render: (r) => formatDate(r.dueDate) },
    { key: "status", label: "Status", render: statusCell },
  ],
  fields: [
    { name: "billNo", label: "Bill #", type: "text", required: true },
    { name: "vendor", label: "Vendor", type: "text", required: true },
    { name: "job", label: "Job", type: "text" },
    { name: "amount", label: "Amount (₹)", type: "number", required: true, min: 0 },
    { name: "dueDate", label: "Due Date", type: "date", required: true },
    {
      name: "status",
      label: "Status",
      type: "select",
      required: true,
      options: ["Pending", "Paid"],
      default: "Pending",
    },
  ],
};

export const paymentsConfig: EntityConfig<"payments"> = {
  key: "payments",
  singular: "Payment",
  plural: "Payments",
  description: "Customer collections and vendor payouts.",
  codePrefix: { field: "reference", prefix: "PAY-", pad: 4 },
  columns: [
    { key: "reference", label: "Reference", sortable: true },
    { key: "party", label: "Party", sortable: true },
    { key: "mode", label: "Mode" },
    { key: "amount", label: "Amount", sortable: true, render: (r) => formatINR(r.amount) },
    { key: "date", label: "Date", sortable: true, render: (r) => formatDate(r.date) },
  ],
  fields: [
    { name: "reference", label: "Reference", type: "text", required: true },
    { name: "party", label: "Party", type: "text", required: true },
    {
      name: "mode",
      label: "Mode",
      type: "select",
      required: true,
      options: ["NEFT", "RTGS", "UPI", "Cheque", "Cash"],
      default: "NEFT",
    },
    { name: "amount", label: "Amount (₹)", type: "number", required: true, min: 0 },
    { name: "date", label: "Date", type: "date", required: true },
  ],
};

export const expensesConfig: EntityConfig<"expenses"> = {
  key: "expenses",
  singular: "Expense",
  plural: "Expenses",
  description: "Operational expenses recorded per job or branch.",
  codePrefix: { field: "reference", prefix: "EXP-", pad: 4 },
  columns: [
    { key: "reference", label: "Reference", sortable: true },
    { key: "category", label: "Category", sortable: true },
    { key: "amount", label: "Amount", sortable: true, render: (r) => formatINR(r.amount) },
    { key: "date", label: "Date", sortable: true, render: (r) => formatDate(r.date) },
    { key: "notes", label: "Notes" },
  ],
  fields: [
    { name: "reference", label: "Reference", type: "text", required: true },
    { name: "category", label: "Category", type: "text", required: true },
    { name: "amount", label: "Amount (₹)", type: "number", required: true, min: 0 },
    { name: "date", label: "Date", type: "date", required: true },
    { name: "notes", label: "Notes", type: "textarea" },
  ],
};

export const documentsConfig: EntityConfig<"documents"> = {
  key: "documents",
  singular: "Document",
  plural: "Documents",
  description: "Shipping bills, BLs, invoices and packing lists.",
  columns: [
    { key: "name", label: "File", sortable: true },
    { key: "type", label: "Type", sortable: true },
    { key: "job", label: "Job" },
    { key: "sizeKb", label: "Size", render: (r) => `${r.sizeKb} KB` },
    { key: "uploadedBy", label: "Uploaded by" },
    { key: "createdAt", label: "Uploaded", render: (r) => formatDate(r.createdAt) },
  ],
  fields: [
    { name: "name", label: "File Name", type: "text", required: true },
    {
      name: "type",
      label: "Type",
      type: "select",
      required: true,
      options: ["BL", "Invoice", "Packing List", "Shipping Bill", "BOE", "Other"],
      default: "Other",
    },
    { name: "job", label: "Job", type: "text" },
    { name: "sizeKb", label: "Size (KB)", type: "number", required: true, min: 0, default: 1 },
    { name: "uploadedBy", label: "Uploaded by", type: "text", required: true, default: "Aarav Kapoor" },
  ],
};

export const rulesConfig: EntityConfig<"rules"> = {
  key: "rules",
  singular: "Rule",
  plural: "Rules",
  description: "Trigger emails, WhatsApp messages and in-app alerts from any shipment event.",
  columns: [
    { key: "name", label: "Rule", sortable: true },
    { key: "trigger", label: "Trigger", sortable: true },
    { key: "channel", label: "Channel" },
    { key: "runs", label: "Runs", sortable: true },
  ],
  fields: [
    { name: "name", label: "Rule name", type: "text", required: true },
    { name: "trigger", label: "Trigger", type: "text", required: true, placeholder: "Vessel ETA" },
    {
      name: "channel",
      label: "Channel",
      type: "select",
      required: true,
      options: ["Email", "WhatsApp", "Email + WhatsApp", "In-app"],
      default: "Email",
    },
    { name: "enabled", label: "Enabled", type: "switch", default: true },
    { name: "runs", label: "Total runs", type: "number", min: 0, default: 0 },
  ],
};

export const CONFIGS = {
  customers: customersConfig,
  vendors: vendorsConfig,
  shippingLines: shippingLinesConfig,
  ports: portsConfig,
  containers: containersConfig,
  hsCodes: hsCodesConfig,
  importJobs: importJobsConfig,
  exportJobs: exportJobsConfig,
  trips: tripsConfig,
  invoices: invoicesConfig,
  vendorBills: vendorBillsConfig,
  payments: paymentsConfig,
  expenses: expensesConfig,
  rules: rulesConfig,
  documents: documentsConfig,
} as const;

export const pubOperationsConfig: EntityConfig<"pubOperations"> = {
  key: "pubOperations",

  singular: "Pub Operation",
  plural: "Pub Operations",

  description: "Manage Pub Operations contacts.",

  searchPlaceholder:
    "Search by name, mobile number or email ID...",

  columns: [
    {
      key: "name",
      label: "Name",
      sortable: true,
    },
    {
      key: "mobile_number",
      label: "Mobile Number",
      sortable: true,
    },
    {
      key: "email",
      label: "Email ID",
      sortable: true,
    },
  ],

  fields: [
    {
      name: "name",
      label: "Name",
      type: "text",
      required: true,
      placeholder: "Enter name",
    },
    {
      name: "mobile_number",
      label: "Mobile Number",
      type: "text",
      required: true,
      placeholder: "Enter mobile number",
    },
   {
  name: "email",
  label: "Email ID",
  type: "text",
  required: true,
  placeholder: "Enter email ID",
},
  ],
};

export const importOperationsConfig: EntityConfig<"importOperations"> = {
  key: "importOperations",

  singular: "Import Operation",
  plural: "Import Operations",

  description: "Manage Import Operations contacts.",

  searchPlaceholder:
    "Search by name, mobile number or email ID...",

  columns: [
    {
      key: "name",
      label: "Name",
      sortable: true,
    },
    {
      key: "mobile_number",
      label: "Mobile Number",
      sortable: true,
    },
    {
      key: "email",
      label: "Email ID",
      sortable: true,
    },
  ],

  fields: [
    {
      name: "name",
      label: "Name",
      type: "text",
      required: true,
      placeholder: "Enter name",
    },
    {
      name: "mobile_number",
      label: "Mobile Number",
      type: "text",
      required: true,
      placeholder: "Enter mobile number",
    },
   {
  name: "email",
  label: "Email ID",
  type: "text",
  required: true,
  placeholder: "Enter email ID",
},
  ],
};
