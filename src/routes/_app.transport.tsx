import { createFileRoute } from "@tanstack/react-router";
import { ModulePage } from "@/components/octopus/ModulePage";
import { tripsConfig } from "@/lib/entities";

export const Route = createFileRoute("/_app/transport")({
  head: () => ({ meta: [{ title: "Transport — Octopus SCM" }] }),
  component: () => <ModulePage module="Transport" config={tripsConfig} />,
});
