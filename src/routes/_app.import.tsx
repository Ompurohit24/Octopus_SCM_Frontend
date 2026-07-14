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

  function exportChecklists() {
    const rows = (checklists.data ?? []).map((c) => {
      const out: Record<string, unknown> = {};
      for (const f of importChecklistsConfig.fields) {
        const v = (c as unknown as Record<string, unknown>)[f.name];
        if (f.type === "services" && v && typeof v === "object") {
          out[f.label] = Object.entries(v as Record<string, string>)
            .map(([k, s]) => `${k}: ${s}`)
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
    downloadCSV(`update-jobs-${Date.now()}.csv`, toCSV(rows));
    toast.success(`Exported ${rows.length} Update Job rows`);
  }

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
        extraExports={[{ label: "Export Update Job data", handler: exportChecklists }]}
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
