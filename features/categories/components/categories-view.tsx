"use client";

import { useMemo, useState } from "react";
import { Pencil, Plus, Tags, Trash2, TrendingUp, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { CategoryDialog } from "@/components/shared/category-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { useCategories } from "@/hooks/use-categories";
import { useCategoryMutations } from "@/hooks/use-category-mutations";
import { useCurrentMonth } from "@/hooks/use-current-month";
import { useBudgets } from "@/hooks/use-budgets";
import { useTransactions } from "@/hooks/use-transactions";
import { formatCurrency, formatDate } from "@/utils/format";
import { cn } from "@/lib/utils";
import type { Category, BudgetWithCategory, TransactionWithCategory } from "@/types/domain";

export function CategoriesView() {
  const { data: categories } = useCategories();
  const { remove } = useCategoryMutations();
  const { data: month } = useCurrentMonth();
  const { data: budgets } = useBudgets(month?.id);
  const { data: transactions } = useTransactions(month?.id);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);

  const list = categories ?? [];

  // Group budgets by category_id for fast lookup
  const budgetMap = useMemo(() => {
    const map = new Map<string, BudgetWithCategory>();
    for (const b of budgets ?? []) {
      map.set(b.category_id, b);
    }
    return map;
  }, [budgets]);

  // Group transactions by category_id
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

  return (
    <div className="space-y-8">
      <PageHeader
        title="Categorias"
        description="Planejamento padrão — os limites são copiados para cada novo mês."
      >
        <Button
          size="sm"
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          <Plus />
          Nova categoria
        </Button>
      </PageHeader>

      {list.length === 0 ? (
        <EmptyState
          icon={Tags}
          title="Nenhuma categoria criada"
          description="Crie categorias para gerenciar seus gastos. Os limites definidos aqui servem como teto de controle mensal."
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {list.map((category) => {
            const budget = budgetMap.get(category.id);
            const limit = budget ? budget.current_limit : category.default_limit;
            const spent = budget ? budget.spent : 0;
            const remaining = budget ? budget.remaining : limit;
            
            const ratio = limit > 0 ? spent / limit : 0;
            const progressWidth = Math.min(ratio * 100, 100);
            const over = spent > limit;

            const categoryTx = (transactionsMap.get(category.id) ?? []).slice(0, 3);

            // Generated insights
            let trendLabel = "Consumo estável";
            let insight = "Você costuma terminar o mês com saldo positivo nesta categoria.";
            if (over) {
              trendLabel = "Limite ultrapassado";
              insight = `Gastos acima do planejado em ${formatCurrency(spent - limit)}.`;
            } else if (ratio >= 0.85) {
              trendLabel = "Atenção: limite próximo";
              insight = "Restam poucos créditos para o fim do mês.";
            }

            return (
              <Card key={category.id} className="overflow-hidden border-border/40 hover:border-border/80 transition-colors shadow-sm duration-300">
                <CardContent className="p-6 space-y-6">
                  {/* Category Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border bg-card text-xl">
                        {category.emoji}
                      </span>
                      <div>
                        <h3 className="font-semibold text-foreground/90">{category.name}</h3>
                        <p className="text-xs text-muted-foreground">Padrão: {formatCurrency(category.default_limit)}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Editar"
                        onClick={() => {
                          setEditing(category);
                          setDialogOpen(true);
                        }}
                      >
                        <Pencil className="size-4 text-muted-foreground hover:text-foreground" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Excluir"
                        onClick={() => {
                          if (window.confirm(`Deseja realmente excluir a categoria ${category.name}?`)) {
                            remove.mutate(category.id);
                          }
                        }}
                      >
                        <Trash2 className="size-4 text-muted-foreground hover:text-destructive" />
                      </Button>
                    </div>
                  </div>

                  {/* Financial Stats */}
                  <div className="grid grid-cols-3 gap-2 py-1 bg-accent/30 rounded-xl px-4 py-3 text-center">
                    <div>
                      <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Limite</p>
                      <p className="text-sm font-semibold tabular-nums mt-0.5">{formatCurrency(limit)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Gasto</p>
                      <p className={cn("text-sm font-semibold tabular-nums mt-0.5", over ? "text-rose-400" : "text-foreground")}>{formatCurrency(spent)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Restante</p>
                      <p className="text-sm font-semibold tabular-nums mt-0.5 text-primary">{formatCurrency(remaining)}</p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1.5">
                    <div className="h-1.5 overflow-hidden rounded-full bg-accent/60">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          over ? "bg-rose-500" : ratio >= 0.85 ? "bg-amber-500" : "bg-emerald-500"
                        )}
                        style={{ width: `${progressWidth}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-muted-foreground">
                      <span>{Math.round(ratio * 100)}% consumido</span>
                      {over && <span className="text-rose-400 font-semibold">Ultrapassado</span>}
                    </div>
                  </div>

                  {/* Recent Transactions */}
                  <div className="space-y-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Últimos lançamentos</p>
                    {categoryTx.length === 0 ? (
                      <p className="text-xs text-muted-2 italic py-1">Nenhuma transação registrada neste mês.</p>
                    ) : (
                      <div className="divide-y divide-border/10 rounded-lg border border-border/20 bg-background/50 px-3 py-1">
                        {categoryTx.map((tx) => (
                          <div key={tx.id} className="flex justify-between py-2 text-xs">
                            <span className="truncate text-muted-foreground font-medium max-w-[150px]">{tx.description || "Gasto"}</span>
                            <div className="flex items-center gap-2 font-semibold tabular-nums">
                              <span>{formatCurrency(tx.amount)}</span>
                              <span className="text-[10px] text-muted-2 font-normal">{formatDate(`${tx.date}T00:00:00`)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Trends & Insights */}
                  <div className="pt-3 border-t border-border/10 flex gap-2 items-start text-xs text-muted-foreground leading-normal">
                    <Sparkles className="size-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-foreground/80 block mb-0.5">{trendLabel}</span>
                      <p className="font-medium">{insight}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Categorias não reservam dinheiro — são apenas limites de controle.
        Alterações de limites padrão valem a partir do próximo mês aberto.
      </p>

      <CategoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        category={editing}
        nextSortOrder={list.length}
      />
    </div>
  );
}

