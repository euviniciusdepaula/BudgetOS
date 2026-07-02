"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/lib/query-keys";
import { transactionService } from "@/services/transaction-service";

export function useTransactionMutations(monthId: string | undefined) {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.currentMonth });
    if (monthId) {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions(monthId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.budgets(monthId) });
    }
  };

  const remove = useMutation({
    mutationFn: (id: string) => transactionService.deleteTransaction(id),
    onSuccess: () => {
      invalidate();
      toast.success("Lançamento excluído com sucesso.");
    },
    onError: (error) => toast.error(error.message),
  });

  const update = useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: {
        amount: number;
        categoryId: string | null;
        description: string;
        date: string;
      };
    }) => transactionService.updateTransaction(id, input),
    onSuccess: () => {
      invalidate();
      toast.success("Lançamento atualizado com sucesso.");
    },
    onError: (error) => toast.error(error.message),
  });

  return { remove, update };
}
