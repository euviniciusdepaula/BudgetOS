"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/lib/query-keys";
import {
  transactionService,
  type RegisterExpenseInput,
} from "@/services/transaction-service";

export function useRegisterExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: RegisterExpenseInput) =>
      transactionService.registerExpense(input),
    onSuccess: (_data, input) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.currentMonth });
      queryClient.invalidateQueries({
        queryKey: queryKeys.budgets(input.month.id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.transactions(input.month.id),
      });
      toast.success("Gasto registrado.");
    },
    onError: (error) => toast.error(error.message),
  });
}
