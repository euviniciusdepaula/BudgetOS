"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { paymentRepository } from "@/services/repositories/payment-repository";

export function usePayments(monthId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.payments(monthId ?? ""),
    queryFn: () => paymentRepository.listByMonth(monthId!),
    enabled: Boolean(monthId),
  });
}
