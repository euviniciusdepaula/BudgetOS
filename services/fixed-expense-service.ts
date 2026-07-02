import { applyFixedExpensePayment } from "@/lib/finance";
import type { FixedExpense, Month } from "@/types/domain";
import { monthRepository } from "./repositories/month-repository";
import { paymentRepository } from "./repositories/payment-repository";

export const fixedExpenseService = {
  /**
   * Marca/desmarca um gasto fixo como pago no mês.
   * O pagamento sai do saldo bancário E da reserva de gastos fixos —
   * o Dinheiro Disponível não muda (já estava reservado).
   */
  async setPaid(
    month: Month,
    expense: FixedExpense,
    paid: boolean
  ): Promise<void> {
    if (month.closed) throw new Error("Este mês já está fechado.");

    if (paid) {
      await paymentRepository.create({
        month_id: month.id,
        fixed_expense_id: expense.id,
        amount: expense.amount,
      });
    } else {
      await paymentRepository.remove(month.id, expense.id);
    }

    await monthRepository.update(
      month.id,
      applyFixedExpensePayment(month, expense.amount, paid)
    );
  },
};
