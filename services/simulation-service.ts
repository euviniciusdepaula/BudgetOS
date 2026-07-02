/**
 * simulationService — futuro Modo Simulação: aplicar lançamentos
 * hipotéticos (source = 'simulation') sem afetar os saldos reais,
 * respondendo "e se eu gastasse X?".
 *
 * NÃO implementado ainda; arquitetura preparada.
 */
import type { Month } from "@/types/domain";

export interface SimulationScenario {
  month: Month;
  hypotheticalExpenses: Array<{
    amount: number;
    categoryId: string | null;
    description: string;
  }>;
}

export interface SimulationResult {
  availableBalanceAfter: number;
  overBudgetCategories: string[];
}

export const simulationService = {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async simulate(_scenario: SimulationScenario): Promise<SimulationResult> {
    throw new Error("Modo Simulação ainda não implementado (simulationService).");
  },
};
