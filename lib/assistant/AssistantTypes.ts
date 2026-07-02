import type { Category } from "@/types/domain";

export type AssistantAction =
  | "create_transaction"
  | "create_income"
  | "pay_fixed_expense"
  | "balance_adjustment"
  | "question"
  | "simulation"
  | "unknown";

export interface AssistantPayload {
  category?: string | null;
  amount?: number | null;
  description?: string | null;
  date?: string | null;
  expense_name?: string | null;
  type?: "entry" | "exit" | "correction" | "transfer" | null;
  intent?:
    | "available_balance"
    | "category_remaining"
    | "investment_total"
    | "fixed_expenses"
    | "salary"
    | "monthly_summary"
    | "category_summary"
    | null;
  reason?: string | null;
}

export interface AssistantParsedOutput {
  actions: {
    action: AssistantAction;
    payload: AssistantPayload;
  }[];
}


export interface AssistantReplyData {
  categories?: Category[];
  amount?: number;
  description?: string;
  date?: string;
  transaction?: unknown;
  fixedExpense?: unknown;
  adjustment?: unknown;
}

export interface AssistantServiceReply {
  content: string;
  actionExecuted: AssistantAction;
  payload: AssistantPayload;
  data?: AssistantReplyData | null;
}
