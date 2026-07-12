import type { EntityMap } from "./types";

const now = () => new Date().toISOString();
const id = (p: string, i: number) => `${p}_${String(i).padStart(4, "0")}`;

export const seedData: { [K in keyof EntityMap]: EntityMap[K][] } = {
  customers: [
    { id: id("c", 1), code: "CUS-0192", name: "Tata Steel Global", country: "India", type: "Shipper", creditLimit: 12000000, status: "Active", email: "ops@tatasteel.com", phone: "+91 22 6665 8282", gstin: "27AAACT2727Q1ZW", createdAt: now() },
    { id: id("c", 2), code: "CUS-0188", name: "Maersk Logistics SG", country: "Singapore", type: "Consignee", creditLimit: 8000000, status: "Active", createdAt: now() },
    { id: id("c", 3), code: "CUS-0184", name: "Rotterdam Bulk BV", country: "Netherlands", type: "Shipper", creditLimit: 25000000, status: "KYC", createdAt: now() },
    { id: id("c", 4), code: "CUS-0181", name: "Hamburg Süd Trade", country: "Germany", type: "Shipper", creditLimit: 6000000, status: "Pending", createdAt: now() },
    { id: id("c", 5), code: "CUS-0177", name: "Hyundai Mipo Dock", country: "S. Korea", type: "Consignee", creditLimit: 18000000, status: "Active", createdAt: now() },
    { id: id("c", 6), code: "CUS-0173", name: "Adani Ports SEZ", country: "India", type: "Both", creditLimit: 50000000, status: "Active", createdAt: now() },
    { id: id("c", 7), code: "CUS-0169", name: "CMA CGM Marseille", country: "France", type: "Vendor", creditLimit: 9000000, status: "Blocked", createdAt: now() },
  ],
  vendors: [
    { id: id("v", 1), code: "VEN-0044", name: "Maersk Line", category: "Shipping Line", country: "Denmark", status: "Active", email: "bookings@maersk.com", createdAt: now() },
    { id: id("v", 2), code: "VEN-0061", name: "Shreeji CHA Services", category: "CHA", country: "India", status: "Active", createdAt: now() },
    { id: id("v", 3), code: "VEN-0072", name: "Reliable Truckers", category: "Trucker", country: "India", status: "Active", createdAt: now() },
    { id: id("v", 4), code: "VEN-0084", name: "JNPT Bonded Warehouse", category: "Warehouse", country: "India", status: "Active", createdAt: now() },
  ],
  shippingLines: [
    { id: id("sl", 1), code: "MSC", name: "Mediterranean Shipping Co.", scac: "MSCU", country: "Switzerland", status: "Active", createdAt: now() },
    { id: id("sl", 2), code: "MAEU", name: "Maersk Line", scac: "MAEU", country: "Denmark", status: "Active", createdAt: now() },
    { id: id("sl", 3), code: "CMA", name: "CMA CGM", scac: "CMDU", country: "France", status: "Active", createdAt: now() },
    { id: id("sl", 4), code: "OOCL", name: "Orient Overseas", scac: "OOLU", country: "Hong Kong", status: "Active", createdAt: now() },
  ],
  ports: [
    { id: id("p", 1), code: "INNSA", name: "Nhava Sheva (JNPT)", country: "India", type: "Sea", createdAt: now() },
    { id: id("p", 2), code: "INMUN", name: "Mundra", country: "India", type: "Sea", createdAt: now() },
    { id: id("p", 3), code: "INMAA", name: "Chennai", country: "India", type: "Sea", createdAt: now() },
    { id: id("p", 4), code: "INTKD", name: "ICD Tughlakabad", country: "India", type: "ICD", createdAt: now() },
    { id: id("p", 5), code: "SGSIN", name: "Singapore", country: "Singapore", type: "Sea", createdAt: now() },
    { id: id("p", 6), code: "DEHAM", name: "Hamburg", country: "Germany", type: "Sea", createdAt: now() },
  ],
  containers: [
    { id: id("ct", 1), code: "20GP", description: "20 ft General Purpose", teu: 1, createdAt: now() },
    { id: id("ct", 2), code: "40GP", description: "40 ft General Purpose", teu: 2, createdAt: now() },
    { id: id("ct", 3), code: "40HC", description: "40 ft High Cube", teu: 2, createdAt: now() },
    { id: id("ct", 4), code: "20RF", description: "20 ft Reefer", teu: 1, createdAt: now() },
  ],
  hsCodes: [
    { id: id("hs", 1), code: "7208.10", description: "Hot-rolled flat steel", gstRate: 18, createdAt: now() },
    { id: id("hs", 2), code: "3004.90", description: "Pharmaceutical preparations", gstRate: 12, createdAt: now() },
    { id: id("hs", 3), code: "8703.23", description: "Passenger motor vehicles", gstRate: 28, createdAt: now() },
  ],
  importJobs: [
    { id: id("ij", 1), jobNo: "IMP-24819", customer: "Tata Steel Global", origin: "Shanghai", destination: "Nhava Sheva", vessel: "MSC Arushi", bl: "BL-90021", eta: "2026-11-04", status: "At Sea", createdAt: now() },
    { id: id("ij", 2), jobNo: "IMP-24802", customer: "Adani Ports SEZ", origin: "Hamburg", destination: "Mundra", vessel: "Maersk Helsinki", bl: "BL-89882", eta: "2026-11-06", status: "Customs", createdAt: now() },
    { id: id("ij", 3), jobNo: "IMP-24788", customer: "Reliance Polymers", origin: "Busan", destination: "Chennai", vessel: "OOCL Singapore", bl: "BL-89771", eta: "2026-11-08", status: "Loaded", createdAt: now() },
    { id: id("ij", 4), jobNo: "IMP-24772", customer: "Hyundai Mipo", origin: "Rotterdam", destination: "JNPT", vessel: "CMA CGM Marco", bl: "BL-89650", eta: "2026-11-11", status: "Cleared", createdAt: now() },
    { id: id("ij", 5), jobNo: "IMP-24755", customer: "Bajaj Auto Ltd", origin: "Yokohama", destination: "Cochin", vessel: "ONE Magdalena", bl: "", eta: "2026-11-14", status: "Booking", createdAt: now() },
    { id: id("ij", 6), jobNo: "IMP-24741", customer: "Maruti Suzuki", origin: "Singapore", destination: "Mundra", vessel: "Evergreen Ace", bl: "", eta: "2026-11-18", status: "Quotation", createdAt: now() },
  ],
  exportJobs: [
    { id: id("ej", 1), jobNo: "EXP-12044", customer: "Tata Motors Exports", origin: "JNPT", destination: "Jebel Ali", vessel: "MSC Aurora", shippingBill: "SB-77231", etd: "2026-11-05", status: "Stuffed", createdAt: now() },
    { id: id("ej", 2), jobNo: "EXP-12031", customer: "Sun Pharma", origin: "Mundra", destination: "New York", vessel: "Maersk Edinburgh", shippingBill: "SB-77118", etd: "2026-11-09", status: "Sailed", createdAt: now() },
    { id: id("ej", 3), jobNo: "EXP-12022", customer: "Infosys Hardware", origin: "Chennai", destination: "Hamburg", vessel: "OOCL Atlantic", shippingBill: "SB-77005", etd: "2026-11-12", status: "Documented", createdAt: now() },
    { id: id("ej", 4), jobNo: "EXP-12011", customer: "Asian Paints", origin: "Cochin", destination: "Singapore", vessel: "ONE Komodo", shippingBill: "SB-76882", etd: "2026-11-14", status: "Booking", createdAt: now() },
  ],
  importChecklists: [],
  trips: [
    { id: id("t", 1), tripNo: "TR-50221", vehicle: "MH-04-GD-9921", driver: "Ramesh Singh", route: "JNPT → ICD Tughlakabad", container: "MSCU-7720114", status: "In Transit", createdAt: now() },
    { id: id("t", 2), tripNo: "TR-50214", vehicle: "GJ-12-AB-4408", driver: "Devendra Patel", route: "Mundra → Ahmedabad", container: "MAEU-3320088", status: "Delivered", createdAt: now() },
    { id: id("t", 3), tripNo: "TR-50208", vehicle: "TN-22-CC-7711", driver: "Karthik R", route: "Chennai → Bangalore", container: "OOLU-9211774", status: "Loading", createdAt: now() },
  ],
  invoices: [
    { id: id("inv", 1), invoiceNo: "INV-1042", customer: "Tata Steel Global", job: "IMP-24819", amount: 342000, gst: 18, dueDate: "2026-11-12", status: "Paid", createdAt: now() },
    { id: id("inv", 2), invoiceNo: "INV-1041", customer: "Adani Ports SEZ", job: "IMP-24802", amount: 510500, gst: 18, dueDate: "2026-11-15", status: "Pending", createdAt: now() },
    { id: id("inv", 3), invoiceNo: "INV-1040", customer: "Reliance Polymers", job: "EXP-12044", amount: 288200, gst: 18, dueDate: "2026-11-02", status: "Overdue", createdAt: now() },
    { id: id("inv", 4), invoiceNo: "INV-1039", customer: "Bajaj Auto Ltd", job: "IMP-24755", amount: 112800, gst: 18, dueDate: "2026-11-18", status: "Paid", createdAt: now() },
    { id: id("inv", 5), invoiceNo: "INV-1038", customer: "Sun Pharma", job: "EXP-12031", amount: 675000, gst: 18, dueDate: "2026-11-20", status: "Issued", createdAt: now() },
  ],
  vendorBills: [
    { id: id("vb", 1), billNo: "VB-2201", vendor: "Maersk Line", job: "IMP-24819", amount: 184000, dueDate: "2026-11-10", status: "Pending", createdAt: now() },
    { id: id("vb", 2), billNo: "VB-2200", vendor: "Shreeji CHA Services", job: "IMP-24802", amount: 42500, dueDate: "2026-11-08", status: "Paid", createdAt: now() },
  ],
  payments: [
    { id: id("pm", 1), reference: "PAY-7711", party: "Tata Steel Global", mode: "RTGS", amount: 342000, date: "2026-10-28", createdAt: now() },
    { id: id("pm", 2), reference: "PAY-7710", party: "Bajaj Auto Ltd", mode: "NEFT", amount: 112800, date: "2026-10-26", createdAt: now() },
  ],
  expenses: [
    { id: id("ex", 1), reference: "EXP-441", category: "Port Handling", amount: 38000, date: "2026-10-29", notes: "JNPT THC", createdAt: now() },
    { id: id("ex", 2), reference: "EXP-440", category: "Documentation", amount: 4500, date: "2026-10-27", createdAt: now() },
  ],
  rules: [
    { id: id("r", 1), name: "ETA reminder · 48h before arrival", channel: "Email + WhatsApp", trigger: "Vessel ETA", enabled: true, runs: 412, createdAt: now() },
    { id: id("r", 2), name: "Invoice generated → customer notification", channel: "Email", trigger: "Invoice created", enabled: true, runs: 1089, createdAt: now() },
    { id: id("r", 3), name: "Payment due in 3 days", channel: "Email + WhatsApp", trigger: "Invoice due date", enabled: true, runs: 234, createdAt: now() },
    { id: id("r", 4), name: "Shipment loaded → consignee update", channel: "WhatsApp", trigger: "Container loaded", enabled: false, runs: 88, createdAt: now() },
  ],
  documents: [
    { id: id("d", 1), name: "BL-90021.pdf", type: "BL", job: "IMP-24819", sizeKb: 184, uploadedBy: "Aarav Kapoor", createdAt: now() },
    { id: id("d", 2), name: "INV-1042.pdf", type: "Invoice", job: "IMP-24819", sizeKb: 92, uploadedBy: "System", createdAt: now() },
    { id: id("d", 3), name: "PackingList-EXP-12031.pdf", type: "Packing List", job: "EXP-12031", sizeKb: 220, uploadedBy: "Meera Iyer", createdAt: now() },
  ],
  reportRuns: [
    { id: id("rr", 1), report: "Shipment Performance — Oct", range: "Oct 01 — Oct 31", generatedBy: "Aarav Kapoor", format: "PDF", createdAt: now() },
    { id: id("rr", 2), report: "Customer Outstanding", range: "Q3 FY26", generatedBy: "Meera Iyer", format: "XLSX", createdAt: now() },
    { id: id("rr", 3), report: "Customs Compliance", range: "Last 90 days", generatedBy: "System", format: "PDF", createdAt: now() },
  ],
  notifications: [
    { id: id("n", 1), title: "3 invoices overdue", body: "Total ₹8.7L past due across 3 customers.", read: false, createdAt: now() },
    { id: id("n", 2), title: "ETA changed", body: "MSC Arushi delayed 6h — arrival now 04 Nov 14:00.", read: false, createdAt: now() },
    { id: id("n", 3), title: "BL released", body: "Maersk released BL-89882 for IMP-24802.", read: true, createdAt: now() },
  ],
};
