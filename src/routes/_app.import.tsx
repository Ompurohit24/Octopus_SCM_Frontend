import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ClipboardList } from "lucide-react";
import { ModulePage } from "@/components/octopus/ModulePage";
import { EntityFormDialog } from "@/components/octopus/EntityFormDialog";
import { importJobsConfig, importChecklistsConfig } from "@/lib/entities";
import { useCreateEntity, useEntityAll, useUpdateEntity } from "@/lib/api/hooks";
import type { ImportChecklist } from "@/lib/api/types";
import { downloadCSV, toCSV } from "@/lib/csv";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/import")({
  head: () => ({ meta: [{ title: "Import — Octopus SCM" }] }),
  component: ImportPage,
});

function ImportPage() {
  const [openChecklist, setOpenChecklist] = useState(false);
  const [selectedJobNo, setSelectedJobNo] = useState("");
  const create = useCreateEntity("importChecklists", "Checklist");
  const update = useUpdateEntity("importChecklists", "Checklist");
  const checklists = useEntityAll("importChecklists");
  const jobs = useEntityAll("importJobs");
  
// const existing = useMemo(
//   () =>
//     selectedJob
//       ? (checklists.data ?? []).find(
//           (c: any) => c.job_id === selectedJob.id,
//         )
//       : undefined,
//   [checklists.data, selectedJob],
// );

//   const defaults = useMemo<Partial<ImportChecklist>>(
//     () => existing ?? (selectedJobNo ? { jobNo: selectedJobNo } : {}),
//     [existing, selectedJobNo],
//   );

//   const selectedJob = useMemo(
//     () => (jobs.data ?? []).find((j) => j.jobNo === selectedJobNo),
//     [jobs.data, selectedJobNo],
//   );
const selectedJob = useMemo(
  () => (jobs.data ?? []).find((j) => j.jobNo === selectedJobNo),
  [jobs.data, selectedJobNo],
);

const existing = useMemo(() => {
  if (!selectedJob) return undefined;

  return (checklists.data ?? []).find(
    (c: any) =>
      c.job_id === selectedJob.id ||
      c.job_number === selectedJob.jobNo ||
      c.jobNo === selectedJob.jobNo,
  );
}, [checklists.data, selectedJob]);

const defaults = useMemo<Partial<ImportChecklist>>(
  () => ({
    ...(existing ?? {}),
    jobNo: selectedJob?.jobNo ?? selectedJobNo,
    blNo: selectedJob?.blNo,
  }),
  [existing, selectedJob, selectedJobNo],
);

  const banner = selectedJob ? (
    <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-xs">
      <div>
        <span className="text-muted-foreground">Party: </span>
        <span className="font-semibold text-foreground">
          {selectedJob.consigneeName || "—"}
        </span>
      </div>
      <div>
        <span className="text-muted-foreground">Containers: </span>
        <span className="font-semibold text-foreground">
          {selectedJob.noOfCntr ?? "—"}
          {selectedJob.size ? ` × ${selectedJob.size}` : ""}
        </span>
      </div>
      <div>
        <span className="text-muted-foreground">BL No: </span>
        <span className="font-semibold text-foreground">
          {selectedJob.blNo || "—"}
        </span>
      </div>
    </div>
  ) : null;


function getJobForChecklist(record: Record<string, unknown>) {
  return (jobs.data ?? []).find((job) => {
    return (
      (record.job_id && job.id === record.job_id) ||
      (record.jobNo && job.jobNo === record.jobNo) ||
      (record.job_number && job.jobNo === record.job_number)
    );
  });
}

function getBaseExportFields(record: Record<string, unknown>) {
  const job = getJobForChecklist(record);

  return {
    "Job No": record.jobNo ?? record.job_number ?? job?.jobNo ?? "",
    "BL No": job?.blNo ?? "",
    "BE No": record.beNo ?? "",
    "Consignee Name": job?.consigneeName ?? "",
  };
}

function exportChecklists() {
  const rows = (checklists.data ?? []).map((c) => {
    const record = c as unknown as Record<string, unknown>;
    const job = getJobForChecklist(record);

    const out: Record<string, unknown> = {
      "Job No": record.jobNo ?? record.job_number ?? job?.jobNo ?? "",
      "BL No": job?.blNo ?? "",
      "Consignee Name": job?.consigneeName ?? "",
    };

    for (const f of importChecklistsConfig.fields) {
      if (f.name === "jobNo") continue;

      const v = record[f.name];

      if (f.type === "services" && v && typeof v === "object") {
        out[f.label] = Object.entries(v as Record<string, unknown>)
          .map(([serviceName, serviceValue]) => {
            if (
              serviceValue &&
              typeof serviceValue === "object" &&
              !Array.isArray(serviceValue)
            ) {
              const item = serviceValue as Record<string, unknown>;

              return [
                serviceName,
                item.status ? `Status: ${item.status}` : "",
                item.tariff !== undefined && item.tariff !== ""
                  ? `Tariff: ${item.tariff}`
                  : "",
                item.unit ? `Unit: ${item.unit}` : "",
              ]
                .filter(Boolean)
                .join(" | ");
            }

            return `${serviceName}: ${String(serviceValue ?? "")}`;
          })
          .join("; ");
      } else {
        out[f.label] = v ?? "";
      }
    }

    return out;
  });

  if (!rows.length) {
    toast.info("No Update Job records to export.");
    return;
  }

  downloadCSV(`import-all-${Date.now()}.csv`, toCSV(rows));
  toast.success(`Exported ${rows.length} Import Job rows`);
}

function exportCoDefacePending() {
  const rows = (checklists.data ?? [])
    .filter((c) => {
      const record = c as unknown as Record<string, unknown>;
      return (
        record.coDefaceRequired === "Yes" &&
        record.coDeface === "Pending"
      );
    })
    .map((c) => {
      const record = c as unknown as Record<string, unknown>;
      return {
        ...getBaseExportFields(record),
        "CO Deface Required": record.coDefaceRequired ?? "",
        "CO Deface": record.coDeface ?? "",
      };
    });

  if (!rows.length) {
    toast.info("No CO Deface Pending records.");
    return;
  }

  downloadCSV(`co-deface-pending-${Date.now()}.csv`, toCSV(rows));
  toast.success(`Exported ${rows.length} CO Deface Pending rows`);
}

function exportRmsOcPending() {
  const rows = (checklists.data ?? [])
    .filter((c) => {
      const record = c as unknown as Record<string, unknown>;
      return (
        record.assessmentType === "RMS" &&
        record.ooc === "Pending"
      );
    })
    .map((c) => {
      const record = c as unknown as Record<string, unknown>;
      return {
        ...getBaseExportFields(record),
        "Assessment Type": record.assessmentType ?? "",
        "OOC": record.ooc ?? "",
        "OC Mail": record.ocMail ?? "",
      };
    });

  if (!rows.length) {
    toast.info("No RMS OC Pending records.");
    return;
  }

  downloadCSV(`rms-oc-pending-${Date.now()}.csv`, toCSV(rows));
  toast.success(`Exported ${rows.length} RMS OC Pending rows`);
}

function exportExamOcPending() {
  const rows = (checklists.data ?? [])
    .filter((c) => {
      const record = c as unknown as Record<string, unknown>;
      return (
        record.assessmentType === "APR" &&
        record.ooc === "Pending"
      );
    })
    .map((c) => {
      const record = c as unknown as Record<string, unknown>;
      return {
        ...getBaseExportFields(record),
        "Assessment Type": record.assessmentType ?? "",
        "CFS Name": record.cfsName ?? "",
        "OOC": record.ooc ?? "",
        "OC Mail": record.ocMail ?? "",
      };
    });

  if (!rows.length) {
    toast.info("No Exam OC Pending records.");
    return;
  }

  downloadCSV(`exam-oc-pending-${Date.now()}.csv`, toCSV(rows));
  toast.success(`Exported ${rows.length} Exam OC Pending rows`);
}

function exportDeliveryOrderPending() {
  const rows = (checklists.data ?? [])
    .filter((c) => {
      const record = c as unknown as Record<string, unknown>;
      return record.doReceived === "Pending";
    })
    .map((c) => {
      const record = c as unknown as Record<string, unknown>;
      return {
        ...getBaseExportFields(record),
        "Liner Invoice": record.linerInvoice ?? "",
        "Liner Payment": record.linerPayment ?? "",
        "Payment Confirm": record.paymentConfirm ?? "",
        "DO Docs": record.doDocs ?? "",
        "DO Received": record.doReceived ?? "",
        "DO Validity": record.doValidity ?? "",
        "DO Type": record.doType ?? "",
        "DO Process": record.doProcess ?? "",
      };
    });

  if (!rows.length) {
    toast.info("No Delivery Order Pending records.");
    return;
  }

  downloadCSV(`delivery-order-pending-${Date.now()}.csv`, toCSV(rows));
  toast.success(`Exported ${rows.length} Delivery Order Pending rows`);
}

function exportStampDutyPending() {
  const rows = (checklists.data ?? [])
    .filter((c) => {
      const record = c as unknown as Record<string, unknown>;
      return record.stampDuty === "Pending";
    })
    .map((c) => {
      const record = c as unknown as Record<string, unknown>;
      return {
        ...getBaseExportFields(record),
        "Stamp Duty": record.stampDuty ?? "",
      };
    });

  if (!rows.length) {
    toast.info("No Stamp Duty Pending records.");
    return;
  }

  downloadCSV(`stamp-duty-pending-${Date.now()}.csv`, toCSV(rows));
  toast.success(`Exported ${rows.length} Stamp Duty Pending rows`);
}

function exportCfsPaymentPending() {
  const rows = (checklists.data ?? [])
    .filter((c) => {
      const record = c as unknown as Record<string, unknown>;
      return record.cfsPayment === "Pending";
    })
    .map((c) => {
      const record = c as unknown as Record<string, unknown>;
      return {
        ...getBaseExportFields(record),
        "CFS Name": record.cfsName ?? "",
        "Performa Invoice": record.performaInvoice ?? "",
        "CFS Payment": record.cfsPayment ?? "",
      };
    });

  if (!rows.length) {
    toast.info("No CFS Payment Pending records.");
    return;
  }

  downloadCSV(`cfs-payment-pending-${Date.now()}.csv`, toCSV(rows));
  toast.success(`Exported ${rows.length} CFS Payment Pending rows`);
}

function exportDeliveryPending() {
  const rows = (checklists.data ?? [])
    .filter((c) => {
      const record = c as unknown as Record<string, unknown>;
      return record.delivery === "Pending";
    })
    .map((c) => {
      const record = c as unknown as Record<string, unknown>;
      return {
        ...getBaseExportFields(record),
        "Transportation": record.transportation ?? "",
        "Transporter": record.transporter ?? "",
        "Delivery": record.delivery ?? "",
      };
    });

  if (!rows.length) {
    toast.info("No Delivery Pending records.");
    return;
  }

  downloadCSV(`delivery-pending-${Date.now()}.csv`, toCSV(rows));
  toast.success(`Exported ${rows.length} Delivery Pending rows`);
}

function exportVendorInvoicePending() {
  const rows = (checklists.data ?? [])
    .filter((c) => {
      const record = c as unknown as Record<string, unknown>;
      return record.vendorInvoices === "Pending";
    })
    .map((c) => {
      const record = c as unknown as Record<string, unknown>;
      return {
        ...getBaseExportFields(record),
        "Vendor Invoices": record.vendorInvoices ?? "",
      };
    });

  if (!rows.length) {
    toast.info("No Vendor Invoice Pending records.");
    return;
  }

  downloadCSV(`vendor-invoice-pending-${Date.now()}.csv`, toCSV(rows));
  toast.success(`Exported ${rows.length} Vendor Invoice Pending rows`);
}

function exportJobCompletionPending() {
  const rows = (checklists.data ?? [])
    .filter((c) => {
      const record = c as unknown as Record<string, unknown>;
      return (
        record.delivery === "Done" &&
        record.vendorInvoices === "Pending"
      );
    })
    .map((c) => {
      const record = c as unknown as Record<string, unknown>;
      return {
        ...getBaseExportFields(record),
        "Delivery": record.delivery ?? "",
        "Vendor Invoices": record.vendorInvoices ?? "",
        "Job Status": "Pending",
      };
    });

  if (!rows.length) {
    toast.info("No Job Completion Pending records.");
    return;
  }

  downloadCSV(`job-completion-pending-${Date.now()}.csv`, toCSV(rows));
  toast.success(`Exported ${rows.length} Job Completion Pending rows`);
}





// function getJobForChecklist(record: Record<string, unknown>) {
//   return (jobs.data ?? []).find((job) => {
//     return (
//       (record.job_id && job.id === record.job_id) ||
//       (record.jobNo && job.jobNo === record.jobNo) ||
//       (record.job_number && job.jobNo === record.job_number)
//     );
//   });
// }




// function exportChecklists() {
//   const rows = (checklists.data ?? []).map((c) => {
//   const record = c as unknown as Record<string, unknown>;
//   const job = getJobForChecklist(record);

//   const out: Record<string, unknown> = {
//     "Job No": record.jobNo ?? record.job_number ?? job?.jobNo ?? "",
//     "BL No": job?.blNo ?? "",
//   };

//   for (const f of importChecklistsConfig.fields) {
//       const v = (c as unknown as Record<string, unknown>)[f.name];

//       if (f.type === "services" && v && typeof v === "object") {
//         out[f.label] = Object.entries(
//           v as Record<string, unknown>,
//         )
//           .map(([serviceName, serviceValue]) => {
//             if (
//               serviceValue &&
//               typeof serviceValue === "object" &&
//               !Array.isArray(serviceValue)
//             ) {
//               const item = serviceValue as Record<string, unknown>;

//               return [
//                 serviceName,
//                 item.status ? `Status: ${item.status}` : "",
//                 item.tariff !== undefined && item.tariff !== ""
//                   ? `Tariff: ${item.tariff}`
//                   : "",
//                 item.unit ? `Unit: ${item.unit}` : "",
//               ]
//                 .filter(Boolean)
//                 .join(" | ");
//             }

//             return `${serviceName}: ${String(serviceValue ?? "")}`;
//           })
//           .join("; ");
//       } else {
//         out[f.label] = v ?? "";
//       }
//     }

//     return out;
//   });

//   if (!rows.length) {
//     toast.info("No Update Job records to export.");
//     return;
//   }

//   downloadCSV(
//     `import-all-${Date.now()}.csv`,
//     toCSV(rows),
//   );

//   toast.success(`Exported ${rows.length} Import Job rows`);
// }

// function exportCoDeface() {
//   const rows = (checklists.data ?? [])
//     .filter((c) => {
//       const record = c as unknown as Record<string, unknown>;

//       return record.coDefaceRequired === "Yes";
//     })
//     .map((c) => {
//       const record = c as unknown as Record<string, unknown>;
//       const job = getJobForChecklist(record);

//       return {
//         "Job No":
//           record.jobNo ??
//           record.job_number ??
//           job?.jobNo ??
//           "",

//         "BL No": job?.blNo ?? "",

//         "BE No": record.beNo ?? "",

//         "CO Deface Required":
//           record.coDefaceRequired ?? "",

//         "CO Deface":
//           record.coDeface ?? "",
//       };
//     });

//   if (!rows.length) {
//     toast.info("No CO Deface records to export.");
//     return;
//   }

//   downloadCSV(
//     `co-deface-${Date.now()}.csv`,
//     toCSV(rows),
//   );

//   toast.success(
//     `Exported ${rows.length} CO Deface rows`,
//   );
// }


// function exportRmsOc() {
//   const rows = (checklists.data ?? [])
//     .filter((c) => {
//       const record = c as unknown as Record<string, unknown>;
//       const job = getJobForChecklist(record);

//       return record.assessmentType === "RMS";
//     })
//     .map((c) => {
//       const record = c as unknown as Record<string, unknown>;
//       const job = getJobForChecklist(record);

//       return {
//         "Job No": record.jobNo ?? record.job_number ?? job?.jobNo ?? "",
//         "BL No": job?.blNo ?? "",
//         "BE No": record.beNo ?? "",
//         "Assessment Type": record.assessmentType ?? "",
//         "OOC": record.ooc ?? "",
//         "OC Mail": record.ocMail ?? "",
//       };
//     });

//   if (!rows.length) {
//     toast.info("No RMS OC records to export.");
//     return;
//   }

//   downloadCSV(
//     `rms-oc-${Date.now()}.csv`,
//     toCSV(rows),
//   );

//   toast.success(`Exported ${rows.length} RMS OC rows`);
// }


// function exportExamOc() {
//   const rows = (checklists.data ?? [])
//     .filter((c) => {
//       const record = c as unknown as Record<string, unknown>;
//       const job = getJobForChecklist(record);

//       return record.assessmentType === "APR";
//     })
//     .map((c) => {
//       const record = c as unknown as Record<string, unknown>;
//       const job = getJobForChecklist(record);

//       return {
//         "Job No": record.jobNo ?? record.job_number ?? job?.jobNo ?? "",
//         "BL No": job?.blNo ?? "",
//         "BE No": record.beNo ?? "",
//         "Assessment Type": record.assessmentType ?? "",
//         "CFS Name": record.cfsName ?? "",
//         "OOC": record.ooc ?? "",
//         "OC Mail": record.ocMail ?? "",
//       };
//     });

//   if (!rows.length) {
//     toast.info("No Exam OC records to export.");
//     return;
//   }

//   downloadCSV(
//     `exam-oc-${Date.now()}.csv`,
//     toCSV(rows),
//   );

//   toast.success(`Exported ${rows.length} Exam OC rows`);
// }


// function exportDeliveryOrder() {
//   const rows = (checklists.data ?? [])
//     .filter((c) => {
//       const record = c as unknown as Record<string, unknown>;
//       const job = getJobForChecklist(record);

//       return (
//         record.linerInvoice === "Pending" ||
//         record.linerInvoice === "Done" ||
//         record.linerPayment === "Pending" ||
//         record.linerPayment === "Done" ||
//         record.paymentConfirm === "Pending" ||
//         record.paymentConfirm === "Done" ||
//         record.doDocs === "Pending" ||
//         record.doDocs === "Done" ||
//         record.doReceived === "Pending" ||
//         record.doReceived === "Done"
//       );
//     })
//     .map((c) => {
//       const record = c as unknown as Record<string, unknown>;
//       const job = getJobForChecklist(record);

//       return {
//         "Job No": record.jobNo ?? record.job_number ?? job?.jobNo ?? "",
//         "BL No": job?.blNo ?? "",
//         "BE No": record.beNo ?? "",
//         "Liner Invoice": record.linerInvoice ?? "",
//         "Liner Payment": record.linerPayment ?? "",
//         "Payment Confirm": record.paymentConfirm ?? "",
//         "DO Docs": record.doDocs ?? "",
//         "DO Received": record.doReceived ?? "",
//         "DO Validity": record.doValidity ?? "",
//         "DO Type": record.doType ?? "",
//         "DO Process": record.doProcess ?? "",
//       };
//     });

//   if (!rows.length) {
//     toast.info("No Delivery Order records to export.");
//     return;
//   }

//   downloadCSV(
//     `delivery-order-${Date.now()}.csv`,
//     toCSV(rows),
//   );

//   toast.success(`Exported ${rows.length} Delivery Order rows`);
// } 

// function exportStampDuty() {
//   const rows = (checklists.data ?? [])
//     .filter((c) => {
//       const record = c as unknown as Record<string, unknown>;
//       const job = getJobForChecklist(record);

//       return (
//         record.stampDuty === "Pending" ||
//         record.stampDuty === "Done"
//       );
//     })
//     .map((c) => {
//       const record = c as unknown as Record<string, unknown>;
//       const job = getJobForChecklist(record);

//       return {
//         "Job No": record.jobNo ?? record.job_number ?? job?.jobNo ?? "",
//         "BL No": job?.blNo ?? "",
//         "BE No": record.beNo ?? "",
//         "Stamp Duty": record.stampDuty ?? "",
//       };
//     });

//   if (!rows.length) {
//     toast.info("No Stamp Duty records to export.");
//     return;
//   }

//   downloadCSV(
//     `stamp-duty-${Date.now()}.csv`,
//     toCSV(rows),
//   );

//   toast.success(`Exported ${rows.length} Stamp Duty rows`);
// }

// function exportCfsPayment() {
//   const rows = (checklists.data ?? [])
//     .filter((c) => {
//       const record = c as unknown as Record<string, unknown>;
//       const job = getJobForChecklist(record);

//       return (
//         record.cfsPayment === "Pending" ||
//         record.cfsPayment === "Done"
//       );
//     })
//     .map((c) => {
//       const record = c as unknown as Record<string, unknown>;
//       const job = getJobForChecklist(record);

//       return {
//         "Job No": record.jobNo ?? record.job_number ?? job?.jobNo ?? "",
//         "BL No": job?.blNo ?? "",
//         "BE No": record.beNo ?? "",
//         "CFS Name": record.cfsName ?? "",
//         "Performa Invoice": record.performaInvoice ?? "",
//         "CFS Payment": record.cfsPayment ?? "",
//       };
//     });

//   if (!rows.length) {
//     toast.info("No CFS Payment records to export.");
//     return;
//   }

//   downloadCSV(
//     `cfs-payment-${Date.now()}.csv`,
//     toCSV(rows),
//   );

//   toast.success(`Exported ${rows.length} CFS Payment rows`);
// }


// function exportDelivery() {
//   const rows = (checklists.data ?? [])
//     .filter((c) => {
//       const record = c as unknown as Record<string, unknown>;
//       const job = getJobForChecklist(record);

//       return (
//         record.delivery === "Pending" ||
//         record.delivery === "Done"
//       );
//     })
//     .map((c) => {
//       const record = c as unknown as Record<string, unknown>;
//       const job = getJobForChecklist(record);

//       return {
//         "Job No": record.jobNo ?? record.job_number ?? job?.jobNo ?? "",
//         "BL No": job?.blNo ?? "",
//         "BE No": record.beNo ?? "",
//         "Transportation": record.transportation ?? "",
//         "Transporter": record.transporter ?? "",
//         "Delivery": record.delivery ?? "",
//       };
//     });

//   if (!rows.length) {
//     toast.info("No Delivery records to export.");
//     return;
//   }

//   downloadCSV(
//     `delivery-${Date.now()}.csv`,
//     toCSV(rows),
//   );

//   toast.success(`Exported ${rows.length} Delivery rows`);
// }

// function exportVendorInvoice() {
//   const rows = (checklists.data ?? [])
//     .filter((c) => {
//       const record = c as unknown as Record<string, unknown>;
//       const job = getJobForChecklist(record);

//       return (
//         record.vendorInvoices === "Pending" ||
//         record.vendorInvoices === "Done"
//       );
//     })
//     .map((c) => {
//       const record = c as unknown as Record<string, unknown>;
//       const job = getJobForChecklist(record);

//       return {
//         "Job No": record.jobNo ?? record.job_number ?? job?.jobNo ?? "",
//         "BL No": job?.blNo ?? "",
//         "BE No": record.beNo ?? "",
//         "Vendor Invoices": record.vendorInvoices ?? "",
//       };
//     });

//   if (!rows.length) {
//     toast.info("No Vendor Invoice records to export.");
//     return;
//   }

//   downloadCSV(
//     `vendor-invoice-${Date.now()}.csv`,
//     toCSV(rows),
//   );

//   toast.success(`Exported ${rows.length} Vendor Invoice rows`);
// }

// function exportJobCompletion() {
//   const rows = (checklists.data ?? [])
//     .filter((c) => {
//       const record = c as unknown as Record<string, unknown>;
//       const job = getJobForChecklist(record);

//       return (
//         record.delivery === "Done" &&
//         record.vendorInvoices === "Done"
//       );
//     })
//     .map((c) => {
//       const record = c as unknown as Record<string, unknown>;
//       const job = getJobForChecklist(record);

//       return {
//         "Job No": record.jobNo ?? record.job_number ?? job?.jobNo ?? "",
//         "BL No": job?.blNo ?? "",
//         "BE No": record.beNo ?? "",
//         "Delivery": record.delivery ?? "",
//         "Vendor Invoices": record.vendorInvoices ?? "",
//         "Job Status": "Completed",
//       };
//     });

//   if (!rows.length) {
//     toast.info("No completed jobs to export.");
//     return;
//   }

//   downloadCSV(
//     `job-completion-${Date.now()}.csv`,
//     toCSV(rows),
//   );

//   toast.success(`Exported ${rows.length} completed Job rows`);
// }






//   function exportChecklists() {
//   const rows = (checklists.data ?? []).map((c) => {
//   const record = c as unknown as Record<string, unknown>;
//   const job = getJobForChecklist(record);

//   const out: Record<string, unknown> = {
//     "Job No": record.jobNo ?? record.job_number ?? job?.jobNo ?? "",
//     "BL No": job?.blNo ?? "",
//   };

//   for (const f of importChecklistsConfig.fields) {
//       const v = (c as unknown as Record<string, unknown>)[f.name];

//       if (f.type === "services" && v && typeof v === "object") {
//         out[f.label] = Object.entries(
//           v as Record<string, unknown>,
//         )
//           .map(([serviceName, serviceValue]) => {
//             if (
//               serviceValue &&
//               typeof serviceValue === "object" &&
//               !Array.isArray(serviceValue)
//             ) {
//               const item = serviceValue as Record<string, unknown>;

//               return [
//                 serviceName,
//                 item.status ? `Status: ${item.status}` : "",
//                 item.tariff !== undefined && item.tariff !== ""
//                   ? `Tariff: ${item.tariff}`
//                   : "",
//                 item.unit ? `Unit: ${item.unit}` : "",
//               ]
//                 .filter(Boolean)
//                 .join(" | ");
//             }

//             return `${serviceName}: ${String(serviceValue ?? "")}`;
//           })
//           .join("; ");
//       } else {
//         out[f.label] = v ?? "";
//       }
//     }

//     return out;
//   });

//   if (!rows.length) {
//     toast.info("No Update Job records to export.");
//     return;
//   }

//   downloadCSV(
//     `import-all-${Date.now()}.csv`,
//     toCSV(rows),
//   );

//   toast.success(`Exported ${rows.length} Import Job rows`);
// }

// function exportCoDeface() {
//   const rows = (checklists.data ?? [])
//     // .filter((c) => {
//     //   const record = c as unknown as Record<string, unknown>;

//     //   return (
//     //     record.coDefaceRequired === "Yes" ||
//     //     record.coDeface === "Pending" ||
//     //     record.coDeface === "Done"
//     //   );
//     // })
//     .filter((c) => {
//   const record = c as unknown as Record<string, unknown>;

//   return record.coDefaceRequired === "Yes";
// })
//     .map((c) => {
//       const record = c as unknown as Record<string, unknown>;

//       return {
//         "Job No": record.jobNo ?? record.job_number ?? "",
//         "BL No": record.blNo ?? "",
//         "BE No": record.beNo ?? "",
//         "CO Deface Required": record.coDefaceRequired ?? "",
//         "CO Deface": record.coDeface ?? "",
//       };
//     });

//   if (!rows.length) {
//     toast.info("No CO Deface records to export.");
//     return;
//   }

//   downloadCSV(
//     `co-deface-${Date.now()}.csv`,
//     toCSV(rows),
//   );

//   toast.success(`Exported ${rows.length} CO Deface rows`);
// }


// function exportRmsOc() {
//   const rows = (checklists.data ?? [])
//     .filter((c) => {
//       const record = c as unknown as Record<string, unknown>;

//       return record.assessmentType === "RMS";
//     })
//     .map((c) => {
//       const record = c as unknown as Record<string, unknown>;

//       return {
//         "Job No": record.jobNo ?? record.job_number ?? "",
//         "BL No": record.blNo ?? "",
//         "BE No": record.beNo ?? "",
//         "Assessment Type": record.assessmentType ?? "",
//         "OOC": record.ooc ?? "",
//         "OC Mail": record.ocMail ?? "",
//       };
//     });

//   if (!rows.length) {
//     toast.info("No RMS OC records to export.");
//     return;
//   }

//   downloadCSV(
//     `rms-oc-${Date.now()}.csv`,
//     toCSV(rows),
//   );

//   toast.success(`Exported ${rows.length} RMS OC rows`);
// }


// function exportExamOc() {
//   const rows = (checklists.data ?? [])
//     .filter((c) => {
//       const record = c as unknown as Record<string, unknown>;

//       return record.assessmentType === "APR";
//     })
//     .map((c) => {
//       const record = c as unknown as Record<string, unknown>;

//       return {
//         "Job No": record.jobNo ?? record.job_number ?? "",
//         "BL No": record.blNo ?? "",
//         "BE No": record.beNo ?? "",
//         "Assessment Type": record.assessmentType ?? "",
//         "CFS Name": record.cfsName ?? "",
//         "OOC": record.ooc ?? "",
//         "OC Mail": record.ocMail ?? "",
//       };
//     });

//   if (!rows.length) {
//     toast.info("No Exam OC records to export.");
//     return;
//   }

//   downloadCSV(
//     `exam-oc-${Date.now()}.csv`,
//     toCSV(rows),
//   );

//   toast.success(`Exported ${rows.length} Exam OC rows`);
// }


// function exportDeliveryOrder() {
//   const rows = (checklists.data ?? [])
//     .filter((c) => {
//       const record = c as unknown as Record<string, unknown>;

//       return (
//         record.linerInvoice === "Pending" ||
//         record.linerInvoice === "Done" ||
//         record.linerPayment === "Pending" ||
//         record.linerPayment === "Done" ||
//         record.paymentConfirm === "Pending" ||
//         record.paymentConfirm === "Done" ||
//         record.doDocs === "Pending" ||
//         record.doDocs === "Done" ||
//         record.doReceived === "Pending" ||
//         record.doReceived === "Done"
//       );
//     })
//     .map((c) => {
//       const record = c as unknown as Record<string, unknown>;

//       return {
//         "Job No": record.jobNo ?? record.job_number ?? "",
//         "BL No": record.blNo ?? "",
//         "BE No": record.beNo ?? "",
//         "Liner Invoice": record.linerInvoice ?? "",
//         "Liner Payment": record.linerPayment ?? "",
//         "Payment Confirm": record.paymentConfirm ?? "",
//         "DO Docs": record.doDocs ?? "",
//         "DO Received": record.doReceived ?? "",
//         "DO Validity": record.doValidity ?? "",
//         "DO Type": record.doType ?? "",
//         "DO Process": record.doProcess ?? "",
//       };
//     });

//   if (!rows.length) {
//     toast.info("No Delivery Order records to export.");
//     return;
//   }

//   downloadCSV(
//     `delivery-order-${Date.now()}.csv`,
//     toCSV(rows),
//   );

//   toast.success(`Exported ${rows.length} Delivery Order rows`);
// } 

// function exportStampDuty() {
//   const rows = (checklists.data ?? [])
//     .filter((c) => {
//       const record = c as unknown as Record<string, unknown>;

//       return (
//         record.stampDuty === "Pending" ||
//         record.stampDuty === "Done"
//       );
//     })
//     .map((c) => {
//       const record = c as unknown as Record<string, unknown>;

//       return {
//         "Job No": record.jobNo ?? record.job_number ?? "",
//         "BL No": record.blNo ?? "",
//         "BE No": record.beNo ?? "",
//         "Stamp Duty": record.stampDuty ?? "",
//       };
//     });

//   if (!rows.length) {
//     toast.info("No Stamp Duty records to export.");
//     return;
//   }

//   downloadCSV(
//     `stamp-duty-${Date.now()}.csv`,
//     toCSV(rows),
//   );

//   toast.success(`Exported ${rows.length} Stamp Duty rows`);
// }

// function exportCfsPayment() {
//   const rows = (checklists.data ?? [])
//     .filter((c) => {
//       const record = c as unknown as Record<string, unknown>;

//       return (
//         record.cfsPayment === "Pending" ||
//         record.cfsPayment === "Done"
//       );
//     })
//     .map((c) => {
//       const record = c as unknown as Record<string, unknown>;

//       return {
//         "Job No": record.jobNo ?? record.job_number ?? "",
//         "BL No": record.blNo ?? "",
//         "BE No": record.beNo ?? "",
//         "CFS Name": record.cfsName ?? "",
//         "Performa Invoice": record.performaInvoice ?? "",
//         "CFS Payment": record.cfsPayment ?? "",
//       };
//     });

//   if (!rows.length) {
//     toast.info("No CFS Payment records to export.");
//     return;
//   }

//   downloadCSV(
//     `cfs-payment-${Date.now()}.csv`,
//     toCSV(rows),
//   );

//   toast.success(`Exported ${rows.length} CFS Payment rows`);
// }


// function exportDelivery() {
//   const rows = (checklists.data ?? [])
//     .filter((c) => {
//       const record = c as unknown as Record<string, unknown>;

//       return (
//         record.delivery === "Pending" ||
//         record.delivery === "Done"
//       );
//     })
//     .map((c) => {
//       const record = c as unknown as Record<string, unknown>;

//       return {
//         "Job No": record.jobNo ?? record.job_number ?? "",
//         "BL No": record.blNo ?? "",
//         "BE No": record.beNo ?? "",
//         "Transportation": record.transportation ?? "",
//         "Transporter": record.transporter ?? "",
//         "Delivery": record.delivery ?? "",
//       };
//     });

//   if (!rows.length) {
//     toast.info("No Delivery records to export.");
//     return;
//   }

//   downloadCSV(
//     `delivery-${Date.now()}.csv`,
//     toCSV(rows),
//   );

//   toast.success(`Exported ${rows.length} Delivery rows`);
// }

// function exportVendorInvoice() {
//   const rows = (checklists.data ?? [])
//     .filter((c) => {
//       const record = c as unknown as Record<string, unknown>;

//       return (
//         record.vendorInvoices === "Pending" ||
//         record.vendorInvoices === "Done"
//       );
//     })
//     .map((c) => {
//       const record = c as unknown as Record<string, unknown>;

//       return {
//         "Job No": record.jobNo ?? record.job_number ?? "",
//         "BL No": record.blNo ?? "",
//         "BE No": record.beNo ?? "",
//         "Vendor Invoices": record.vendorInvoices ?? "",
//       };
//     });

//   if (!rows.length) {
//     toast.info("No Vendor Invoice records to export.");
//     return;
//   }

//   downloadCSV(
//     `vendor-invoice-${Date.now()}.csv`,
//     toCSV(rows),
//   );

//   toast.success(`Exported ${rows.length} Vendor Invoice rows`);
// }

// function exportJobCompletion() {
//   const rows = (checklists.data ?? [])
//     .filter((c) => {
//       const record = c as unknown as Record<string, unknown>;

//       return (
//         record.delivery === "Done" &&
//         record.vendorInvoices === "Done"
//       );
//     })
//     .map((c) => {
//       const record = c as unknown as Record<string, unknown>;

//       return {
//         "Job No": record.jobNo ?? record.job_number ?? "",
//         "BL No": record.blNo ?? "",
//         "BE No": record.beNo ?? "",
//         "Delivery": record.delivery ?? "",
//         "Vendor Invoices": record.vendorInvoices ?? "",
//         "Job Status": "Completed",
//       };
//     });

//   if (!rows.length) {
//     toast.info("No completed jobs to export.");
//     return;
//   }

//   downloadCSV(
//     `job-completion-${Date.now()}.csv`,
//     toCSV(rows),
//   );

//   toast.success(`Exported ${rows.length} completed Job rows`);
// }




  const headerActions = (
    <button
      onClick={() => {
        setSelectedJobNo("");
        setOpenChecklist(true);
      }}
      className="inline-flex items-center gap-1.5 rounded-lg border border-brand/40 bg-brand/10 px-3 py-1.5 text-xs font-medium text-brand hover:bg-brand/15"
    >
      <ClipboardList className="size-3.5" /> Update Job
    </button>
  );

  return (
    <>
      <ModulePage
  module="Import"
  config={importJobsConfig}
  extraHeaderActions={headerActions}
  hideDefaultExport
 extraExports={[
  { label: "All", handler: exportChecklists },
  { label: "CO Deface Pending", handler: exportCoDefacePending },
  { label: "RMS OC Pending", handler: exportRmsOcPending },
  { label: "Exam OC Pending", handler: exportExamOcPending },
  { label: "Delivery Order Pending", handler: exportDeliveryOrderPending },
  { label: "Stamp Duty Pending", handler: exportStampDutyPending },
  { label: "CFS Payment Pending", handler: exportCfsPaymentPending },
  { label: "Delivery Pending", handler: exportDeliveryPending },
  { label: "Vendor Invoice Pending", handler: exportVendorInvoicePending },
  { label: "Job Completion Pending", handler: exportJobCompletionPending },
]}
/>
      <EntityFormDialog<ImportChecklist>
        open={openChecklist}
        onOpenChange={setOpenChecklist}
        title="Update Job"
        fields={importChecklistsConfig.fields}
        defaultValues={defaults}
        submitLabel="Save"
        watchField="jobNo"
        onWatchChange={setSelectedJobNo}
        banner={banner}

   onSubmit={async (vals) => {
  if (!selectedJob) {
  toast.error("Please select a job.");
  throw new Error("Please select a job.");
}

 const payload: Partial<ImportChecklist> & {
  job_id: string;
  job_number: string;
} = {
  ...vals,

  // Backend fields
  job_id: selectedJob.id,
  job_number: selectedJob.jobNo,

  // Frontend fields
  jobNo: selectedJob.jobNo,
  blNo: selectedJob.blNo,
};

 if (existing) {
  await update.mutateAsync({
    id: existing.id,
    patch: payload,
  });

  return {
    ...selectedJob,
    ...payload,
  };
} else {
  await create.mutateAsync(payload);

  return {
    ...selectedJob,
    ...payload,
  };
}
}}
      />
    </>
  );
}
