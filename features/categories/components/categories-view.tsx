"use client";

import { useMemo, useState } from "react";
import { Plus, Tags, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/layout/page-header";
import { CategoryDialog } from "@/components/shared/category-dialog";
import { CategoryCard } from "@/components/shared/category-card";
import { CategoryDetailDialog } from "@/components/shared/category-detail-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { useCategories } from "@/hooks/use-categories";
import { useCategoryMutations } from "@/hooks/use-category-mutations";
import { useCurrentMonth } from "@/hooks/use-current-month";
import { useBudgets } from "@/hooks/use-budgets";
import { useTransactions } from "@/hooks/use-transactions";
import { formatCurrency } from "@/utils/format";
import type { Category, BudgetWithCategory, TransactionWithCategory } from "@/types/domain";

type FilterType = "all" | "has_spent" | "no_spent" | "near_limit" | "exceeded";
type SortType = "remaining_desc" | "spent_desc" | "most_used" | "alphabetical";

export function CategoriesView() {
  const { data: categories } = useCategories();
  const { remove } = useCategoryMutations();
  const { data: month } = useCurrentMonth();
  const { data: budgets } = useBudgets(month?.id);
  const { data: transactions } = useTransactions(month?.id);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  
  // Category Details dialog state
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Filters & Sorting state
  const [filter, setFilter] = useState<FilterType>("all");
  const [sortBy, setSortBy] = useState<SortType>("remaining_desc");

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

  // Calculations for summary stats panel
  const summaryStats = useMemo(() => {
    let totalDistributed = 0;
    let totalSpent = 0;
    let totalRemaining = 0; // Clamped remaining to positive numbers to accurately reflect remaining alocation
    
    for (const b of budgets ?? []) {
      totalDistributed += b.current_limit;
      totalSpent += b.spent;
      totalRemaining += Math.max(0, b.remaining);
    }

    // Default categories limits if budgets is empty (e.g. month not opened yet)
    if ((budgets ?? []).length === 0 && (categories ?? []).length > 0) {
      for (const c of categories ?? []) {
        totalDistributed += c.default_limit;
        totalRemaining += c.default_limit;
      }
    }

    const freeMoney = (month?.available_balance ?? 0) - totalRemaining;

    return {
      totalDistributed,
      totalSpent,
      totalRemaining,
      freeMoney,
    };
  }, [budgets, categories, month?.available_balance]);

  // Process list with filter and sorting
  const processedCategories = useMemo(() => {
    let result = [...(categories ?? [])];

    // 1. Filtering
    if (filter !== "all") {
      result = result.filter((category) => {
        const budget = budgetMap.get(category.id);
        const limit = budget ? budget.current_limit : category.default_limit;
        const spent = budget ? budget.spent : 0;
        const ratio = limit > 0 ? spent / limit : 0;

        switch (filter) {
          case "has_spent":
            return spent > 0;
          case "no_spent":
            return spent === 0;
          case "near_limit":
            return ratio >= 0.85 && ratio <= 1.0;
          case "exceeded":
            return spent > limit;
          default:
            return true;
        }
      });
    }

    // 2. Sorting
    result.sort((a, b) => {
      const budgetA = budgetMap.get(a.id);
      const budgetB = budgetMap.get(b.id);

      const limitA = budgetA ? budgetA.current_limit : a.default_limit;
      const limitB = budgetB ? budgetB.current_limit : b.default_limit;

      const spentA = budgetA ? budgetA.spent : 0;
      const spentB = budgetB ? budgetB.spent : 0;

      const remainingA = budgetA ? budgetA.remaining : limitA;
      const remainingB = budgetB ? budgetB.remaining : limitB;

      switch (sortBy) {
        case "remaining_desc":
          return remainingB - remainingA;
        case "spent_desc":
          return spentB - spentA;
        case "most_used": {
          const countA = (transactionsMap.get(a.id) ?? []).length;
          const countB = (transactionsMap.get(b.id) ?? []).length;
          return countB - countA;
        }
        case "alphabetical":
          return a.name.localeCompare(b.name, "pt-BR");
        default:
          return 0;
      }
    });

    return result;
  }, [categories, filter, sortBy, budgetMap, transactionsMap]);

  const handleDeleteCategory = (id: string, name: string) => {
    if (window.confirm(`Deseja realmente excluir a categoria ${name}?`)) {
      remove.mutate(id);
    }
  };

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

      {/* Summary Stats Panel */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/40 bg-accent/5">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Total Distribuído
            </p>
            <span className="text-xl font-bold tracking-tight text-foreground/90 mt-2 tabular-nums">
              {formatCurrency(summaryStats.totalDistributed)}
            </span>
          </CardContent>
        </Card>

        <Card className="border-border/40 bg-rose-500/5">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <p className="text-[10px] font-bold text-rose-400/90 uppercase tracking-wider">
              Gasto nas Categorias
            </p>
            <span className="text-xl font-bold tracking-tight text-rose-400 mt-2 tabular-nums">
              {formatCurrency(summaryStats.totalSpent)}
            </span>
          </CardContent>
        </Card>

        <Card className="border-border/40 bg-primary/5">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <p className="text-[10px] font-bold text-primary uppercase tracking-wider">
              Restante nas Categorias
            </p>
            <span className="text-xl font-bold tracking-tight text-primary mt-2 tabular-nums">
              {formatCurrency(summaryStats.totalRemaining)}
            </span>
          </CardContent>
        </Card>

        <Card className="border-border/40 bg-emerald-500/5">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
              Dinheiro Livre
            </p>
            <span className="text-xl font-bold tracking-tight text-emerald-400 mt-2 tabular-nums">
              {formatCurrency(summaryStats.freeMoney)}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Sorting Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex-1">
          <span className="text-xs font-semibold text-muted-foreground block mb-1">Filtrar por</span>
          <Select
            value={filter}
            onValueChange={(v) => setFilter(v as FilterType)}
          >
            <SelectTrigger className="sm:w-60">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              <SelectItem value="has_spent">Com gasto</SelectItem>
              <SelectItem value="no_spent">Sem gasto</SelectItem>
              <SelectItem value="near_limit">Perto do limite (≥ 85%)</SelectItem>
              <SelectItem value="exceeded">Estouradas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="shrink-0">
          <span className="text-xs font-semibold text-muted-foreground block mb-1">Ordenar por</span>
          <Select
            value={sortBy}
            onValueChange={(v) => setSortBy(v as SortType)}
          >
            <SelectTrigger className="sm:w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="remaining_desc">Maior restante</SelectItem>
              <SelectItem value="spent_desc">Maior gasto</SelectItem>
              <SelectItem value="most_used">Mais usado</SelectItem>
              <SelectItem value="alphabetical">Alfabética</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Categories Grid list */}
      {(categories ?? []).length === 0 ? (
        <EmptyState
          icon={Tags}
          title="Nenhuma categoria criada"
          description="Crie categorias para gerenciar seus gastos. Os limites definidos aqui servem como teto de controle mensal."
        />
      ) : processedCategories.length === 0 ? (
        <p className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground bg-card/20">
          Nenhuma categoria atende aos filtros atuais.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {processedCategories.map((category) => {
            const budget = budgetMap.get(category.id);
            const limit = budget ? budget.current_limit : category.default_limit;
            const spent = budget ? budget.spent : 0;
            const remaining = budget ? budget.remaining : limit;

            return (
              <CategoryCard
                key={category.id}
                category={category}
                limit={limit}
                spent={spent}
                remaining={remaining}
                onClick={() => {
                  setSelectedCategory(category);
                  setDetailOpen(true);
                }}
              />
            );
          })}
        </div>
      )}

      {/* Rule Callout */}
      <div className="flex gap-2.5 items-start rounded-xl border border-border/40 bg-accent/5 p-4 text-xs text-muted-foreground leading-relaxed">
        <span className="font-semibold text-foreground">💡 Regra Importante:</span>
        <span>
          Categorias são apenas envelopes de planejamento. Elas <strong>NÃO</strong> prendem ou bloqueiam dinheiro.
          Planejado ≠ dinheiro bloqueado.
        </span>
      </div>

      <CategoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        category={editing}
        nextSortOrder={(categories ?? []).length}
      />

      {selectedCategory && (
        <CategoryDetailDialog
          open={detailOpen}
          onOpenChange={setDetailOpen}
          category={selectedCategory}
          limit={
            budgetMap.get(selectedCategory.id)?.current_limit ??
            selectedCategory.default_limit
          }
          spent={budgetMap.get(selectedCategory.id)?.spent ?? 0}
          remaining={
            budgetMap.get(selectedCategory.id)?.remaining ??
            selectedCategory.default_limit
          }
          transactions={transactionsMap.get(selectedCategory.id) ?? []}
          onEdit={() => {
            setEditing(selectedCategory);
            setDialogOpen(true);
          }}
          onDelete={() => {
            handleDeleteCategory(selectedCategory.id, selectedCategory.name);
          }}
        />
      )}
    </div>
  );
}
