"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/lib/query-keys";
import { categoryRepository } from "@/services/repositories/category-repository";
import type { Database } from "@/types/database";

type CategoryInsert = Database["public"]["Tables"]["categories"]["Insert"];
type CategoryUpdate = Database["public"]["Tables"]["categories"]["Update"];

export function useCategoryMutations() {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.categories });

  const create = useMutation({
    mutationFn: (input: CategoryInsert) => categoryRepository.create(input),
    onSuccess: invalidate,
    onError: (error) => toast.error(error.message),
  });

  const update = useMutation({
    mutationFn: ({ id, ...patch }: CategoryUpdate & { id: string }) =>
      categoryRepository.update(id, patch),
    onSuccess: invalidate,
    onError: (error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => categoryRepository.remove(id),
    onSuccess: invalidate,
    onError: (error) => toast.error(error.message),
  });

  return { create, update, remove };
}
