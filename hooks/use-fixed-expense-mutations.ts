"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/lib/query-keys";
import { fixedExpenseService } from "@/services/fixed-expense-service";
import { useCurrentMonth } from "./use-current-month";
import type { Database } from "@/types/database";

type FixedExpenseInsert =
  Database["public"]["Tables"]["fixed_expenses"]["Insert"];
type FixedExpenseUpdate =
  Database["public"]["Tables"]["fixed_expenses"]["Update"];

export function useFixedExpenseMutations() {
  const queryClient = useQueryClient();
  const { data: month } = useCurrentMonth();
  const currentMonthId = month?.id ?? null;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.fixedExpenses });
    queryClient.invalidateQueries({ queryKey: queryKeys.currentMonth });
  };

  const create = useMutation({
    mutationFn: (input: FixedExpenseInsert) =>
      fixedExpenseService.create(input, currentMonthId),
    onSuccess: invalidate,
    onError: (error) => toast.error(error.message),
  });

  const update = useMutation({
    mutationFn: ({ id, ...patch }: FixedExpenseUpdate & { id: string }) =>
      fixedExpenseService.update(id, patch, currentMonthId),
    onSuccess: invalidate,
    onError: (error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => fixedExpenseService.remove(id, currentMonthId),
    onSuccess: invalidate,
    onError: (error) => toast.error(error.message),
  });

  return { create, update, remove };
}
