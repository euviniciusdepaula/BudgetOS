import { computeMonthOpening } from "@/lib/finance";
import { currentYearMonth, type YearMonth } from "@/lib/dates";
import type { Month } from "@/types/domain";
import { budgetRepository } from "./repositories/budget-repository";
import { categoryRepository } from "./repositories/category-repository";
import { fixedExpenseRepository } from "./repositories/fixed-expense-repository";
import { monthRepository } from "./repositories/month-repository";
import { vaultRepository } from "./repositories/vault-repository";

export interface OpenMonthInput {
  startingBalance: number;
  salary: number;
  extraIncome: number;
}

export const monthService = {
  /** Mês financeiro corrente (null quando ainda não foi aberto). */
  async getCurrentMonth(now: YearMonth = currentYearMonth()): Promise<Month | null> {
    return monthRepository.findByYearMonth(now.year, now.month);
  },

  /** Saldo bancário final do mês anterior — sugestão para a abertura. */
  async getPreviousMonthBalance(
    now: YearMonth = currentYearMonth()
  ): Promise<number | null> {
    const previous = await monthRepository.findLatestBefore(now.year, now.month);
    return previous?.bank_balance ?? null;
  },

  /**
   * Abre o mês corrente: calcula os saldos de abertura e cria os
   * orçamentos mensais copiando os limites padrão das categorias
   * (categories nunca é alterada).
   */
  async openMonth(
    input: OpenMonthInput,
    now: YearMonth = currentYearMonth()
  ): Promise<Month> {
    const [vault, activeFixed, categories] = await Promise.all([
      vaultRepository.find(),
      fixedExpenseRepository.listActive(),
      categoryRepository.list(),
    ]);
    if (!vault) throw new Error("Vault não encontrado.");

    const fixedExpensesTotal = activeFixed.reduce((sum, f) => sum + f.amount, 0);
    const balances = computeMonthOpening({
      startingBalance: input.startingBalance,
      salary: input.salary,
      extraIncome: input.extraIncome,
      fixedExpensesTotal,
      investmentGoal: vault.investment_goal,
    });

    const month = await monthRepository.create({
      year: now.year,
      month: now.month,
      starting_balance: input.startingBalance,
      salary: input.salary,
      extra_income: input.extraIncome,
      ...balances,
    });

    await budgetRepository.createMany(
      categories.map((category) => ({
        month_id: month.id,
        category_id: category.id,
        planned_limit: category.default_limit,
        current_limit: category.default_limit,
        spent: 0,
      }))
    );

    return month;
  },
};
