import { createFileRoute } from "@tanstack/react-router";
import { ModulePage } from "@/components/octopus/ModulePage";
import { documentsConfig } from "@/lib/entities";

export const Route = createFileRoute("/_app/documents")({
  head: () => ({ meta: [{ title: "Document Center — Octopus SCM" }] }),
  component: () => <ModulePage module="Documents" config={documentsConfig} />,
});
