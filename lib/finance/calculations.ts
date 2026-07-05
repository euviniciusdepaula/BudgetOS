/**
 * Regras financeiras do BudgetOS — funções puras, sem I/O.
 *
 * Conceito central (Opção A):
 *   Dinheiro Disponível = Saldo bancário - Gastos fixos reservados
 *
 * O investimento não é reservado no início do mês.
 * Ao registrar o aporte, o valor é deduzido do disponível.
 */
import type { AdjustmentType } from "@/types/database";
import type { Month } from "@/types/domain";

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export interface MonthBalances {
  bank_balance: number;
  reserved_fixed_expenses: number;
  reserved_investment: number;
  available_balance: number;
}

export function computeAvailable(
  bankBalance: number,
  reservedFixedExpenses: number
): number {
  return round2(bankBalance - reservedFixedExpenses);
}

export interface MonthOpeningInput {
  startingBalance: number;
  salary: number;
  extraIncome: number;
  fixedExpensesTotal: number;
  investmentGoal: number;
}

/** Números de abertura de um novo mês financeiro. */
export function computeMonthOpening(input: MonthOpeningInput): MonthBalances {
  const bankBalance = round2(
    input.startingBalance + input.salary + input.extraIncome
  );
  return {
    bank_balance: bankBalance,
    reserved_fixed_expenses: round2(input.fixedExpensesTotal),
    reserved_investment: 0, // Começa com R$ 0,00 aportados de fato
    available_balance: computeAvailable(
      bankBalance,
      input.fixedExpensesTotal
    ),
  };
}

function rebalance(
  month: Pick<Month, keyof MonthBalances>,
  delta: Partial<MonthBalances>
): MonthBalances {
  const bank_balance = round2(month.bank_balance + (delta.bank_balance ?? 0));
  const reserved_fixed_expenses = round2(
    month.reserved_fixed_expenses + (delta.reserved_fixed_expenses ?? 0)
  );
  const reserved_investment = round2(
    month.reserved_investment + (delta.reserved_investment ?? 0)
  );
  return {
    bank_balance,
    reserved_fixed_expenses,
    reserved_investment,
    available_balance: computeAvailable(
      bank_balance,
      reserved_fixed_expenses
    ),
  };
}

/** Gasto variável: sai do banco e, portanto, do disponível. */
export function applyExpense(
  month: Pick<Month, keyof MonthBalances>,
  amount: number
): MonthBalances {
  return rebalance(month, { bank_balance: -amount });
}

/** Receita: entra no banco e aumenta o disponível. */
export function applyIncome(
  month: Pick<Month, keyof MonthBalances>,
  amount: number
): MonthBalances {
  return rebalance(month, { bank_balance: amount });
}

/**
 * Pagamento de gasto fixo: sai do banco E da reserva ao mesmo tempo —
 * o disponível NÃO muda, pois esse dinheiro já estava reservado.
 * `paid = false` desfaz o pagamento.
 */
export function applyFixedExpensePayment(
  month: Pick<Month, keyof MonthBalances>,
  amount: number,
  paid: boolean
): MonthBalances {
  const signed = paid ? -amount : amount;
  return rebalance(month, {
    bank_balance: signed,
    reserved_fixed_expenses: signed,
  });
}

/**
 * Aporte de investimento efetivado: sai do banco (reduzindo o disponível)
 * e entra no acumulado de investimentos do mês.
 */
export function applyInvestment(
  month: Pick<Month, keyof MonthBalances>,
  amount: number
): MonthBalances {
  return rebalance(month, {
    bank_balance: -amount,
    reserved_investment: amount, // Aumenta o valor investido de fato
  });
}

/** Sinal do efeito de um ajuste de saldo sobre o banco. */
export function adjustmentDelta(type: AdjustmentType, amount: number): number {
  switch (type) {
    case "entry":
      return Math.abs(amount);
    case "exit":
    case "transfer":
      return -Math.abs(amount);
    case "correction":
      return amount;
  }
}

/**
 * Ajuste de saldo: altera APENAS o saldo bancário (nunca categorias)
 * e recalcula o disponível.
 */
export function applyAdjustment(
  month: Pick<Month, keyof MonthBalances>,
  type: AdjustmentType,
  amount: number
): MonthBalances {
  return rebalance(month, { bank_balance: adjustmentDelta(type, amount) });
}

/**
 * Alteração da meta de investimento: no modelo A, a meta não afeta o
 * saldo disponível do mês atual diretamente.
 */
export function applyInvestmentGoalChange(
  month: Pick<Month, keyof MonthBalances>,
  newGoal: number
): MonthBalances {
  // Use parameters to avoid unused warnings
  if (newGoal === 0) {
    // no-op
  }
  return {
    bank_balance: month.bank_balance,
    reserved_fixed_expenses: month.reserved_fixed_expenses,
    reserved_investment: month.reserved_investment,
    available_balance: month.available_balance,
  };
}
