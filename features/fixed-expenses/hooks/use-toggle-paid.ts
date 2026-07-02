"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/lib/query-keys";
import { fixedExpenseService } from "@/services/fixed-expense-service";
import type { FixedExpense, Month } from "@/types/domain";

export function useTogglePaid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      month,
      expense,
      paid,
    }: {
      month: Month;
      expense: FixedExpense;
      paid: boolean;
    }) => fixedExpenseService.setPaid(month, expense, paid),
    onSuccess: (_data, input) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.currentMonth });
      queryClient.invalidateQueries({
        queryKey: queryKeys.payments(input.month.id),
      });
    },
    onError: (error) => toast.error(error.message),
  });
}
