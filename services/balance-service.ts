import { applyAdjustment } from "@/lib/finance";
import type { AdjustmentType } from "@/types/database";
import type { BalanceAdjustment, Month } from "@/types/domain";
import { adjustmentRepository } from "./repositories/adjustment-repository";
import { monthRepository } from "./repositories/month-repository";

export interface ApplyAdjustmentInput {
  month: Month;
  type: AdjustmentType;
  /** Valor positivo; para `correction` pode ser negativo (para baixo). */
  amount: number;
  description: string;
}

export const balanceService = {
  /**
   * Ajuste de saldo: altera APENAS o saldo bancário (nunca categorias)
   * e recalcula o Dinheiro Disponível.
   */
  async apply(input: ApplyAdjustmentInput): Promise<BalanceAdjustment> {
    if (input.month.closed) throw new Error("Este mês já está fechado.");

    const adjustment = await adjustmentRepository.create({
      month_id: input.month.id,
      type: input.type,
      amount: input.amount,
      description: input.description || null,
    });

    await monthRepository.update(
      input.month.id,
      applyAdjustment(input.month, input.type, input.amount)
    );

    return adjustment;
  },
};
