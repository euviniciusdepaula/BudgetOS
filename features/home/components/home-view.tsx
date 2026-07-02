"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff, Plus, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useBudgets } from "@/hooks/use-budgets";
import { useCurrentMonth } from "@/hooks/use-current-month";
import { useVault } from "@/hooks/use-vault";
import { formatCurrency } from "@/utils/format";
import { AiInput } from "./ai-input";
import { CategoryCards } from "./category-cards";
import { ExpenseDialog } from "./expense-dialog";
import { FixedExpensesCard } from "./fixed-expenses-card";
import { RecentTransactions } from "./recent-transactions";
import { BalanceAdjustmentDialog } from "./balance-adjustment-dialog";

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
  
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [hidden, setHidden] = useState(false);

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
      <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between py-2 border-b border-border/20 pb-8">
        <div className="space-y-4">
          <p className="text-sm font-medium text-muted-foreground">
            {getGreeting()}, <span className="font-semibold text-sidebar-foreground">{vault?.name || "usuário"}</span>
          </p>
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Disponível para gastar
            </p>
            <div className="flex items-center gap-3">
              <span className="text-4xl font-bold tracking-tight text-primary tabular-nums">
                {format(month.available_balance)}
              </span>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={hidden ? "Mostrar saldos" : "Ocultar saldos"}
                onClick={toggleHidden}
                className="text-muted-foreground hover:text-foreground"
              >
                {hidden ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground font-medium">
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
          <CategoryCards budgets={budgets ?? []} hidden={hidden} />
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
    </div>
  );
}

