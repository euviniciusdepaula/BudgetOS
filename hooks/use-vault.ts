"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { vaultRepository } from "@/services/repositories/vault-repository";

export function useVault(enabled = true) {
  return useQuery({
    queryKey: queryKeys.vault,
    queryFn: () => vaultRepository.find(),
    staleTime: Infinity,
    enabled,
  });
}
