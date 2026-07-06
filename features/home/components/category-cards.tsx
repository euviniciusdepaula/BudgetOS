"use client";

import { CategoryCard } from "@/components/shared/category-card";
import type { BudgetWithCategory, Category } from "@/types/domain";

interface CategoryCardsProps {
  budgets: BudgetWithCategory[];
  hidden: boolean;
  onCategoryClick: (category: Category) => void;
}

export function CategoryCards({ budgets, hidden, onCategoryClick }: CategoryCardsProps) {
  if (budgets.length === 0) {
    return (
      <p className="rounded-[16px] border border-dashed px-4 py-10 text-center text-sm text-muted-foreground bg-card/15">
        Nenhuma categoria neste mês. Crie categorias na aba Categorias — elas entram no orçamento na abertura do próximo mês.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 md:gap-4 md:grid-cols-2 xl:grid-cols-3">
      {budgets.map((budget) => {
        const limit = budget.current_limit;
        const spent = budget.spent;
        const remaining = budget.remaining;

        return (
          <CategoryCard
            key={budget.id}
            category={budget.category}
            limit={limit}
            spent={spent}
            remaining={remaining}
            hidden={hidden}
            onClick={() => onCategoryClick(budget.category)}
          />
        );
      })}
    </div>
  );
}
