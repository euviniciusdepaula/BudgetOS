/** Chaves centralizadas do TanStack Query. */
export const queryKeys = {
  vault: ["vault"] as const,
  currentMonth: ["months", "current"] as const,
  budgets: (monthId: string) => ["budgets", monthId] as const,
  categories: ["categories"] as const,
  fixedExpenses: ["fixed-expenses"] as const,
  payments: (monthId: string) => ["payments", monthId] as const,
  transactions: (monthId: string) => ["transactions", monthId] as const,
  adjustments: (monthId: string) => ["adjustments", monthId] as const,
  months: ["months"] as const,
  aiConversations: ["ai-conversations"] as const,
};
