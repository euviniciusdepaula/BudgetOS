"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/lib/query-keys";
import {
  balanceService,
  type ApplyAdjustmentInput,
} from "@/services/balance-service";

export function useBalanceAdjustment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ApplyAdjustmentInput) => balanceService.apply(input),
    onSuccess: (_data, input) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.currentMonth });
      queryClient.invalidateQueries({
        queryKey: queryKeys.adjustments(input.month.id),
      });
      toast.success("Saldo ajustado.");
    },
    onError: (error) => toast.error(error.message),
  });
}
