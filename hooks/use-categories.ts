"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { categoryRepository } from "@/services/repositories/category-repository";

export function useCategories(enabled = true) {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: () => categoryRepository.list(),
    enabled,
  });
}
