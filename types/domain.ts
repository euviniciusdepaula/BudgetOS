import type { Database } from "./database";

type Tables = Database["public"]["Tables"];

export type Vault = Tables["vault"]["Row"];
export type Month = Tables["months"]["Row"];
export type FixedExpense = Tables["fixed_expenses"]["Row"];
export type FixedExpensePayment = Tables["fixed_expense_payments"]["Row"];
export type Category = Tables["categories"]["Row"];
export type MonthlyCategoryBudget = Tables["monthly_category_budgets"]["Row"];
export type Transaction = Tables["transactions"]["Row"];
export type BalanceAdjustment = Tables["balance_adjustments"]["Row"];
export type Investment = Tables["investments"]["Row"];
export type AiConversationEntry = Tables["ai_conversations"]["Row"];

/** Orçamento mensal com a categoria associada (join usado na Home). */
export type BudgetWithCategory = MonthlyCategoryBudget & {
  category: Category;
};

/** Transação com a categoria associada (join usado no Histórico). */
export type TransactionWithCategory = Transaction & {
  category: Category | null;
};
