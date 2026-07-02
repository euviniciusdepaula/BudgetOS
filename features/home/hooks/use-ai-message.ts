"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/lib/query-keys";
import type { AssistantServiceReply } from "@/lib/assistant/AssistantTypes";

export function useAiMessage() {
  const queryClient = useQueryClient();

  return useMutation<
    AssistantServiceReply,
    Error,
    { message: string; monthId: string | null }
  >({
    mutationFn: async ({ message, monthId }) => {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message, monthId }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro ao se comunicar com o assistente.");
      }

      return res.json();
    },
    onSuccess: (data, variables) => {
      // Invalida o histórico do chat
      queryClient.invalidateQueries({ queryKey: queryKeys.aiConversations });

      // Se executou alguma ação que alterou os saldos ou transações, invalida
      if (data.actionExecuted !== "unknown" || data.payload?.reason === "category_not_identified") {
        queryClient.invalidateQueries({ queryKey: queryKeys.currentMonth });
        if (variables.monthId) {
          queryClient.invalidateQueries({ queryKey: queryKeys.budgets(variables.monthId) });
          queryClient.invalidateQueries({ queryKey: queryKeys.transactions(variables.monthId) });
          queryClient.invalidateQueries({ queryKey: queryKeys.payments(variables.monthId) });
          queryClient.invalidateQueries({ queryKey: queryKeys.adjustments(variables.monthId) });
        }
      }
    },
    onError: (error) => toast.error(error.message),
  });
}
