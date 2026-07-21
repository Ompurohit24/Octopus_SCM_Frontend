import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
// import { apiClient, type ListQuery } from "./storage"; 
import { apiClient, type ListQuery } from "./storage";
import type { EntityKey, EntityMap, ID } from "./types";
import { toast } from "sonner";



export const qk = {
  list: (key: EntityKey, q?: ListQuery) => [key, "list", q ?? {}] as const,
  all: (key: EntityKey) => [key, "all"] as const,
  one: (key: EntityKey, id: ID) => [key, "one", id] as const,
};



export function useEntityList<K extends EntityKey>(key: K, query: ListQuery = {}) {
  return useQuery({
    queryKey: qk.list(key, query),
    queryFn: () => apiClient.list(key, query),
    placeholderData: keepPreviousData,
    staleTime: 10_000,
  });
}
export function useNextCustomerCode() {
  return useQuery({
    queryKey: ["customers", "next-code"],
    queryFn: () => apiClient.getNextCustomerCode(),
    staleTime: 0,
  });
}

export function useNextVendorCode() {
  return useQuery({
    queryKey: ["vendors", "next-code"],
    queryFn: () => apiClient.getNextVendorCode(),
    staleTime: 0,
  });
}

export function useNextImportJobNumber() {
  return useQuery({
    queryKey: ["import-jobs", "next-number"],
    queryFn: () => apiClient.getNextImportJobNumber(),
    staleTime: 0,
  });
}



export function useEntityAll<K extends EntityKey>(key: K) {
  return useQuery<EntityMap[K][]>({
    queryKey: qk.all(key),
    queryFn: () => apiClient.all(key),
    staleTime: 10_000,
  });
}

// export function useNextCustomerCode() {
//   return useQuery({
//     queryKey: ["next-customer-code"],
//     queryFn: () => apiClient.getNextCustomerCode(),
//     staleTime: 0,
//   });
// }

export function useCreateEntity<K extends EntityKey>(key: K, label = "Record") {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<EntityMap[K]>) => apiClient.create(key, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [key] });
      toast.success(`${label} created`);
    },
    onError: (e: Error) => toast.error(e.message || `Failed to create ${label}`),
  });
}

export function useUpdateEntity<K extends EntityKey>(key: K, label = "Record") {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: ID; patch: Partial<EntityMap[K]> }) =>
      apiClient.update(key, id, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [key] });
      toast.success(`${label} updated`);
    },
    onError: (e: Error) => toast.error(e.message || `Failed to update ${label}`),
  });
}

export function useDeleteEntity<K extends EntityKey>(
  key: K,
  label = "Record",
) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: ID) =>
      apiClient.remove(key, id),

    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: [key],
      });

      toast.success(
        `${label} deleted`,
      );
    },

    onError: (e: Error) => {
      // These modules display business-rule deletion
      // errors using a centered dialog in ModulePage.
      if (
        key === "importJobs" ||
        key === "customers" ||
        key === "vendors"
      ) {
        return;
      }

      toast.error(
        e.message ||
          `Failed to delete ${label}`,
      );
    },
  });
}

export function useBulkDelete<K extends EntityKey>(
  key: K,
  label = "Records",
) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (ids: ID[]) =>
      apiClient.removeMany(
        key,
        ids,
      ),

    onSuccess: (_, ids) => {
      qc.invalidateQueries({
        queryKey: [key],
      });

      toast.success(
        `${ids.length} ${label.toLowerCase()} deleted`,
      );
    },

    onError: (e: Error) => {
      // These modules display business-rule deletion
      // errors using a centered dialog in ModulePage.
      if (
        key === "importJobs" ||
        key === "customers" ||
        key === "vendors"
      ) {
        return;
      }

      toast.error(
        e.message ||
          `Failed to delete ${label}`,
      );
    },
  });
}

export function useBulkCreate<K extends EntityKey>(key: K, label = "Records") {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (inputs: Partial<EntityMap[K]>[]) => apiClient.bulkCreate(key, inputs),
    onSuccess: (_, inputs) => {
      qc.invalidateQueries({ queryKey: [key] });
      toast.success(`${inputs.length} ${label.toLowerCase()} imported`);
    },
    onError: (e: Error) => toast.error(e.message || `Failed to import ${label}`),
  });
}
// export function useNextCustomerCode() {
//   return useQuery({
//     queryKey: ["customers", "next-code"],
//     queryFn: () => apiClient.getNextCustomerCode(),
//   });
// }