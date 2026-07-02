/**
 * budgetAllocator — futuro responsável por redistribuir orçamento
 * entre categorias dentro de um mês (mexe apenas em current_limit de
 * monthly_category_budgets; categories nunca é alterada e nenhum
 * dinheiro real se move — limites são só controle).
 *
 * NÃO implementado ainda; arquitetura preparada.
 */

export interface BudgetReallocation {
  monthId: string;
  fromCategoryId: string;
  toCategoryId: string;
  amount: number;
}

export const budgetAllocator = {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async reallocate(_input: BudgetReallocation): Promise<never> {
    throw new Error(
      "Redistribuição de orçamento ainda não implementada (budgetAllocator)."
    );
  },
};
