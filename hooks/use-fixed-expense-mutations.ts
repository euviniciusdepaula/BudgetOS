"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/lib/query-keys";
import { fixedExpenseRepository } from "@/services/repositories/fixed-expense-repository";
import type { Database } from "@/types/database";

type FixedExpenseInsert =
  Database["public"]["Tables"]["fixed_expenses"]["Insert"];
type FixedExpenseUpdate =
  Database["public"]["Tables"]["fixed_expenses"]["Update"];

export function useFixedExpenseMutations() {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.fixedExpenses });

  const create = useMutation({
    mutationFn: (input: FixedExpenseInsert) =>
      fixedExpenseRepository.create(input),
    onSuccess: invalidate,
    onError: (error) => toast.error(error.message),
  });

  const update = useMutation({
    mutationFn: ({ id, ...patch }: FixedExpenseUpdate & { id: string }) =>
      fixedExpenseRepository.update(id, patch),
    onSuccess: invalidate,
    onError: (error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => fixedExpenseRepository.remove(id),
    onSuccess: invalidate,
    onError: (error) => toast.error(error.message),
  });

  return { create, update, remove };
}
