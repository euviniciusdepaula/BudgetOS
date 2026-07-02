"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import {
  transactionRepository,
  type TransactionFilters,
} from "@/services/repositories/transaction-repository";

export function useTransactions(
  monthId: string | undefined,
  filters: TransactionFilters = {}
) {
  return useQuery({
    queryKey: [...queryKeys.transactions(monthId ?? ""), filters],
    queryFn: () => transactionRepository.listByMonth(monthId!, filters),
    enabled: Boolean(monthId),
  });
}
