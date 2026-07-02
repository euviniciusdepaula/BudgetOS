"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { monthService } from "@/services/month-service";

export function useCurrentMonth(enabled = true) {
  return useQuery({
    queryKey: queryKeys.currentMonth,
    queryFn: () => monthService.getCurrentMonth(),
    enabled,
  });
}
