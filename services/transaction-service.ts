import { applyExpense, applyIncome, round2 } from "@/lib/finance";
import { toISODate } from "@/lib/dates";
import type { TransactionSource } from "@/types/database";
import type { Month, Transaction } from "@/types/domain";
import { budgetRepository } from "./repositories/budget-repository";
import { monthRepository } from "./repositories/month-repository";
import { transactionRepository } from "./repositories/transaction-repository";

export interface RegisterExpenseInput {
  month: Month;
  amount: number;
  categoryId: string | null;
  description: string;
  date?: string;
  source?: TransactionSource;
}

export interface RegisterIncomeInput {
  month: Month;
  amount: number;
  description: string;
  date?: string;
  source?: TransactionSource;
}

export const transactionService = {
  /**
   * Registra um gasto: cria a transação, soma no `spent` da categoria
   * do mês e recalcula saldo bancário + disponível.
   */
  async registerExpense(input: RegisterExpenseInput): Promise<Transaction> {
    if (input.month.closed) throw new Error("Este mês já está fechado.");

    const transaction = await transactionRepository.create({
      month_id: input.month.id,
      category_id: input.categoryId,
      type: "expense",
      amount: input.amount,
      description: input.description || null,
      source: input.source ?? "manual",
      date: input.date ?? toISODate(),
    });

    if (input.categoryId) {
      const budget = await budgetRepository.findByMonthAndCategory(
        input.month.id,
        input.categoryId
      );
      if (budget) {
        await budgetRepository.updateSpent(
          budget.id,
          round2(budget.spent + input.amount)
        );
      }
    }

    await monthRepository.update(
      input.month.id,
      applyExpense(input.month, input.amount)
    );

    return transaction;
  },

  /** Registra uma receita: entra no banco e aumenta o disponível. */
  async registerIncome(input: RegisterIncomeInput): Promise<Transaction> {
    if (input.month.closed) throw new Error("Este mês já está fechado.");

    const transaction = await transactionRepository.create({
      month_id: input.month.id,
      category_id: null,
      type: "income",
      amount: input.amount,
      description: input.description || null,
      source: input.source ?? "manual",
      date: input.date ?? toISODate(),
    });

    await monthRepository.update(
      input.month.id,
      applyIncome(input.month, input.amount)
    );

    return transaction;
  },
};
