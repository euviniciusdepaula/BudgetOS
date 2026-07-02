"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { budgetRepository } from "@/services/repositories/budget-repository";

export function useBudgets(monthId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.budgets(monthId ?? ""),
    queryFn: () => budgetRepository.listByMonth(monthId!),
    enabled: Boolean(monthId),
  });
}
