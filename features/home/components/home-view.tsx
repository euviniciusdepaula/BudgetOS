"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye, EyeOff, PiggyBank, Plus, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { useBudgets } from "@/hooks/use-budgets";
import { useCurrentMonth } from "@/hooks/use-current-month";
import { useVault } from "@/hooks/use-vault";
import { useTransactions } from "@/hooks/use-transactions";
import { useCategoryMutations } from "@/hooks/use-category-mutations";
import { formatCurrency } from "@/utils/format";
import { AiInput } from "./ai-input";
import { CategoryCards } from "./category-cards";
import { ExpenseDialog } from "./expense-dialog";
import { FixedExpensesCard } from "./fixed-expenses-card";
import { RecentTransactions } from "./recent-transactions";
import { BalanceAdjustmentDialog } from "./balance-adjustment-dialog";
import { InvestmentDialog } from "@/components/shared/investment-dialog";
import { CategoryDetailDialog } from "@/components/shared/category-detail-dialog";
import { CategoryDialog } from "@/components/shared/category-dialog";
import type { Category, TransactionWithCategory } from "@/types/domain";

const STORAGE_KEY = "budgetos.hide-available";

function getGreeting() {
  const hr = new Date().getHours();
  if (hr < 12) return "Bom dia";
  if (hr < 18) return "Boa tarde";
  return "Boa noite";
}

export function HomeView() {
  const { data: month } = useCurrentMonth();
  const { data: budgets, isLoading: budgetsLoading } = useBudgets(month?.id);
  const { data: vault } = useVault();
  const { data: transactions } = useTransactions(month?.id);
  const { remove: removeCategory } = useCategoryMutations();
  
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [investmentOpen, setInvestmentOpen] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [hidden, setHidden] = useState(false);

  // Category dialog states
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);

  // Group transactions by category_id for details
  const transactionsMap = useMemo(() => {
    const map = new Map<string, TransactionWithCategory[]>();
    for (const t of transactions ?? []) {
      if (t.category_id) {
        const list = map.get(t.category_id) ?? [];
        list.push(t);
        map.set(t.category_id, list);
      }
    }
    return map;
  }, [transactions]);

  // Calculations for summaries
  const totalDistributed = useMemo(() => {
    return (budgets ?? []).reduce((sum, b) => sum + b.current_limit, 0);
  }, [budgets]);

  const totalRemaining = useMemo(() => {
    return (budgets ?? []).reduce((sum, b) => sum + Math.max(0, b.remaining), 0);
  }, [budgets]);

  const freeMoney = useMemo(() => {
    return (month?.available_balance ?? 0) - totalRemaining;
  }, [month?.available_balance, totalRemaining]);

  useEffect(() => {
    setHidden(window.localStorage.getItem(STORAGE_KEY) === "1");
  }, []);

  function toggleHidden() {
    setHidden((current) => {
      window.localStorage.setItem(STORAGE_KEY, current ? "0" : "1");
      return !current;
    });
  }

  const format = (val: number) => {
    return hidden ? "R$ ••••••" : formatCurrency(val);
  };

  if (!month) return null; // MonthGate garante o mês antes de renderizar.

  return (
    <div className="space-y-10">
      {/* 1 — Header Financeiro (Estilo Wallet Digital) */}
      <header className="flex flex-col gap-6 py-4 border-b border-border/20 pb-8">
        <div className="space-y-4">
          <p className="text-sm font-medium text-muted-foreground">
            {getGreeting()}, <span className="font-semibold text-sidebar-foreground">{vault?.name || "usuário"}</span>
          </p>

          <div className="grid gap-4 sm:grid-cols-3">
            {/* Disponível */}
            <Card className="border-border/40 bg-accent/5">
              <CardContent className="p-4 flex flex-col justify-between h-full space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Disponível para gastar
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold tracking-tight text-primary tabular-nums">
                    {format(month.available_balance)}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={hidden ? "Mostrar saldos" : "Ocultar saldos"}
                    onClick={toggleHidden}
                    className="text-muted-foreground hover:text-foreground h-8 w-8 shrink-0"
                  >
                    {hidden ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Distribuído */}
            <Card className="border-border/40 bg-accent/5">
              <CardContent className="p-4 flex flex-col justify-between h-full space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Distribuído em Categorias
                </p>
                <span className="text-2xl font-bold tracking-tight text-foreground/90 tabular-nums">
                  {format(totalDistributed)}
                </span>
              </CardContent>
            </Card>

            {/* Livre */}
            <Card className="border-border/40 bg-emerald-500/5">
              <CardContent className="p-4 flex flex-col justify-between h-full space-y-2">
                <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                  Livre fora de Categorias
                </p>
                <span className="text-2xl font-bold tracking-tight text-emerald-400 tabular-nums">
                  {format(freeMoney)}
                </span>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground font-medium pt-2">
            <span className="flex items-center gap-1.5">
              Saldo bancário: <span className="text-foreground font-semibold tabular-nums">{format(month.bank_balance)}</span>
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label="Ajustar saldo"
                onClick={() => setAdjustOpen(true)}
                className="text-muted-2 hover:text-foreground inline-flex ml-0.5"
              >
                <SlidersHorizontal className="size-3.5" />
              </Button>
            </span>
            <span className="text-muted-2/60">•</span>
            <span>
              Contas: <span className="text-foreground font-semibold tabular-nums">{format(month.reserved_fixed_expenses)}</span>
            </span>
            <span className="text-muted-2/60">•</span>
            <span>
              Investimentos: <span className="text-foreground font-semibold tabular-nums">{format(month.reserved_investment)}</span>
            </span>
          </div>
        </div>
      </header>

      {/* 2 — Chat Copiloto Financeiro */}
      <AiInput month={month} />

      {/* 3 — Grid de Categorias */}
      <section>
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold">Categorias</h2>
            <p className="text-xs text-muted-foreground">
              Limites de controle — não reservam dinheiro.
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setInvestmentOpen(true)}>
              <PiggyBank className="size-4 mr-1.5" />
              Registrar aporte
            </Button>
            <Button size="sm" onClick={() => setExpenseOpen(true)}>
              <Plus />
              Registrar gasto
            </Button>
          </div>
        </div>
        {budgetsLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            <Skeleton className="h-40 rounded-[16px]" />
            <Skeleton className="h-40 rounded-[16px]" />
            <Skeleton className="h-40 rounded-[16px]" />
          </div>
        ) : (
          <CategoryCards
            budgets={budgets ?? []}
            hidden={hidden}
            onCategoryClick={(category) => {
              setSelectedCategory(category);
              setDetailOpen(true);
            }}
          />
        )}
      </section>

      {/* 4 — Gastos Fixos e Transações Recentes */}
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

      <BalanceAdjustmentDialog
        open={adjustOpen}
        onOpenChange={setAdjustOpen}
        month={month}
      />

      <InvestmentDialog
        open={investmentOpen}
        onOpenChange={setInvestmentOpen}
        month={month}
      />

      {selectedCategory && (
        <CategoryDetailDialog
          open={detailOpen}
          onOpenChange={setDetailOpen}
          category={selectedCategory}
          limit={
            (budgets ?? []).find((b) => b.category_id === selectedCategory.id)
              ?.current_limit ?? selectedCategory.default_limit
          }
          spent={
            (budgets ?? []).find((b) => b.category_id === selectedCategory.id)
              ?.spent ?? 0
          }
          remaining={
            (budgets ?? []).find((b) => b.category_id === selectedCategory.id)
              ?.remaining ?? selectedCategory.default_limit
          }
          transactions={transactionsMap.get(selectedCategory.id) ?? []}
          onEdit={() => {
            setEditingCategory(selectedCategory);
            setCategoryDialogOpen(true);
          }}
          onDelete={() => {
            if (
              window.confirm(
                `Deseja realmente excluir a categoria ${selectedCategory.name}?`
              )
            ) {
              removeCategory.mutate(selectedCategory.id);
            }
          }}
        />
      )}

      <CategoryDialog
        open={categoryDialogOpen}
        onOpenChange={setCategoryDialogOpen}
        category={editingCategory}
        nextSortOrder={(budgets ?? []).length}
      />
    </div>
  );
}

