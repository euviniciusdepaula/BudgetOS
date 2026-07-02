"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useBudgets } from "@/hooks/use-budgets";
import { useCurrentMonth } from "@/hooks/use-current-month";
import { AiInput } from "./ai-input";
import { AvailableHero } from "./available-hero";
import { CategoryCards } from "./category-cards";
import { ExpenseDialog } from "./expense-dialog";
import { FixedExpensesCard } from "./fixed-expenses-card";
import { MonthSummary } from "./month-summary";
import { RecentTransactions } from "./recent-transactions";
import { StatCards } from "./stat-cards";

export function HomeView() {
  const { data: month } = useCurrentMonth();
  const { data: budgets, isLoading: budgetsLoading } = useBudgets(month?.id);
  const [expenseOpen, setExpenseOpen] = useState(false);

  if (!month) return null; // MonthGate garante o mês antes de renderizar.

  return (
    <div className="space-y-10">
      {/* 1 — Quanto posso gastar? */}
      <div className="grid grid-cols-12 gap-6">
        <AvailableHero
          available={month.available_balance}
          className="col-span-12 lg:col-span-6"
        />
        <div className="col-span-12 flex flex-col gap-6 lg:col-span-6">
          <StatCards month={month} />
          <MonthSummary month={month} className="flex-1" />
        </div>
      </div>

      {/* 2 — Registrar algo com a IA */}
      <AiInput month={month} />

      {/* 3 — Como estão minhas categorias? */}
      <section>
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold">Categorias</h2>
            <p className="text-xs text-muted-foreground">
              Limites de controle — não reservam dinheiro.
            </p>
          </div>
          <Button size="sm" onClick={() => setExpenseOpen(true)}>
            <Plus />
            Registrar gasto
          </Button>
        </div>
        {budgetsLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            <Skeleton className="h-40 rounded-[16px]" />
            <Skeleton className="h-40 rounded-[16px]" />
            <Skeleton className="h-40 rounded-[16px]" />
          </div>
        ) : (
          <CategoryCards budgets={budgets ?? []} />
        )}
      </section>

      {/* 4 — O que aconteceu recentemente? */}
      <div className="grid grid-cols-12 gap-6">
        <FixedExpensesCard
          month={month}
          className="col-span-12 lg:col-span-5"
        />
        <RecentTransactions
          month={month}
          className="col-span-12 lg:col-span-7"
        />
      </div>

      <ExpenseDialog
        open={expenseOpen}
        onOpenChange={setExpenseOpen}
        month={month}
        categories={(budgets ?? []).map((b) => b.category)}
      />
    </div>
  );
}
