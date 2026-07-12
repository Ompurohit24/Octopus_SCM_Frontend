import { createFileRoute } from "@tanstack/react-router";
import { ModulePage } from "@/components/octopus/ModulePage";
import { exportJobsConfig } from "@/lib/entities";

export const Route = createFileRoute("/_app/export")({
  head: () => ({ meta: [{ title: "Export — Octopus SCM" }] }),
  component: () => <ModulePage module="Export" config={exportJobsConfig} />,
});
