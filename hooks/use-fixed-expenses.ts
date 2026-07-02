"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { fixedExpenseRepository } from "@/services/repositories/fixed-expense-repository";

export function useFixedExpenses(enabled = true) {
  return useQuery({
    queryKey: queryKeys.fixedExpenses,
    queryFn: () => fixedExpenseRepository.list(),
    enabled,
  });
}
