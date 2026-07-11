"use client";

import { useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  History,
  Pencil,
  PiggyBank,
  Search,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { TransactionEditDialog } from "@/components/shared/transaction-edit-dialog";
import { useCategories } from "@/hooks/use-categories";
import { useCurrentMonth } from "@/hooks/use-current-month";
import { useTransactions } from "@/hooks/use-transactions";
import { useTransactionMutations } from "@/hooks/use-transaction-mutations";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDate } from "@/utils/format";
import type { TransactionWithCategory } from "@/types/domain";

const ALL_CATEGORIES = "all";

const periods = [
  { value: "month", label: "Mês inteiro" },
  { value: "7d", label: "Esta semana" },
  { value: "today", label: "Hoje" },
  { value: "custom", label: "Personalizado" },
];

const sortOptions = [
  { value: "date-desc", label: "Mais recentes" },
  { value: "date-asc", label: "Mais antigos" },
  { value: "amount-desc", label: "Maior gasto" },
  { value: "amount-asc", label: "Menor gasto" },
];

function periodRange(
  period: string,
  customFrom?: string,
  customTo?: string
): { from?: string; to?: string } {
  const today = new Date();
  const iso = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;
  if (period === "today") return { from: iso(today), to: iso(today) };
  if (period === "7d") {
    const from = new Date(today);
    from.setDate(from.getDate() - 6);
    return { from: iso(from), to: iso(today) };
  }
  if (period === "custom") {
    return { from: customFrom || undefined, to: customTo || undefined };
  }
  return {};
}

function TransactionRow({
  transaction,
  onEdit,
  onDelete,
  deletePending,
}: {
  transaction: TransactionWithCategory;
  onEdit: () => void;
  onDelete: () => void;
  deletePending: boolean;
}) {
  const isExpense = transaction.type === "expense";
  const isIncome = transaction.type === "income";
  const isInvestment = transaction.type === "investment";

  return (
    <div className="group flex items-center gap-3 px-4 py-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-card text-base">
        {transaction.category?.emoji ??
          (isIncome ? (
            <ArrowDownLeft className="size-4 text-emerald-400" />
          ) : isInvestment ? (
            <PiggyBank className="size-4 text-primary" />
          ) : (
            <ArrowUpRight className="size-4 text-muted-foreground" />
          ))}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {transaction.description ||
            transaction.category?.name ||
            (isIncome ? "Receita" : isInvestment ? "Aporte de Investimento" : "Lançamento")}
        </p>
        <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
          <span>{transaction.category?.name ?? (isInvestment ? "Investimento" : "Sem categoria")}</span>
          <span>•</span>
          <span className="tabular-nums">{formatDate(`${transaction.date}T00:00:00`)}</span>
        </p>
      </div>
      <div className="flex items-center gap-4">
        <p
          className={cn(
            "text-sm font-medium tabular-nums",
            isIncome ? "text-emerald-400" : isInvestment ? "text-primary" : "text-foreground"
          )}
        >
          {isExpense ? "−" : isIncome ? "+" : isInvestment ? "−" : ""}
          {formatCurrency(transaction.amount)}
        </p>
        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Editar"
            onClick={onEdit}
            className="text-muted-foreground hover:text-foreground"
          >
            <Pencil className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Excluir"
            onClick={onDelete}
            disabled={deletePending}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function getRelativePeriodLabel(dateStr: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());

  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [year, month, day] = dateStr.split("-").map(Number);
  const targetDate = new Date(year, month - 1, day);

  if (targetDate.getTime() === today.getTime()) {
    return "Hoje";
  }
  if (targetDate.getTime() === yesterday.getTime()) {
    return "Ontem";
  }
  if (targetDate >= startOfWeek) {
    return "Esta semana";
  }
  if (targetDate >= startOfMonth) {
    return "Este mês";
  }

  const monthsBR = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];
  return `${monthsBR[targetDate.getMonth()]} de ${targetDate.getFullYear()}`;
}

export function HistoryView() {
  const { data: month } = useCurrentMonth();
  const { data: categories } = useCategories();
  const { remove } = useTransactionMutations(month?.id);

  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string>(ALL_CATEGORIES);
  const [period, setPeriod] = useState("month");
  
  // Custom period states
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  // Sort state
  const [sortBy, setSortBy] = useState("date-desc");

  const [editingTransaction, setEditingTransaction] = useState<TransactionWithCategory | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const range = useMemo(() => periodRange(period, customFrom, customTo), [period, customFrom, customTo]);

  const { data: transactions, isLoading } = useTransactions(month?.id, {
    categoryId: categoryId === ALL_CATEGORIES ? undefined : categoryId,
    search: search.trim() || undefined,
    from: range.from,
    to: range.to,
  });

  const categoryItems = useMemo(
    () => [
      { value: ALL_CATEGORIES, label: "Todas as categorias" },
      ...(categories ?? []).map((c) => ({
        value: c.id,
        label: `${c.emoji} ${c.name}`,
      })),
    ],
    [categories]
  );

  const sortedTransactions = useMemo(() => {
    const list = [...(transactions ?? [])];
    list.sort((a, b) => {
      if (sortBy === "amount-desc") {
        return b.amount - a.amount;
      }
      if (sortBy === "amount-asc") {
        return a.amount - b.amount;
      }
      if (sortBy === "date-asc") {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      }
      // date-desc (default)
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
    return list;
  }, [transactions, sortBy]);

  const isSortedByAmount = sortBy.startsWith("amount");

  const groups = useMemo(() => {
    if (isSortedByAmount) return [];

    const byPeriod = new Map<string, TransactionWithCategory[]>();
    for (const t of sortedTransactions) {
      const label = getRelativePeriodLabel(t.date);
      const list = byPeriod.get(label) ?? [];
      list.push(t);
      byPeriod.set(label, list);
    }
    return Array.from(byPeriod.entries());
  }, [sortedTransactions, isSortedByAmount]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Histórico"
        description="Sua linha do tempo de gastos e decisões."
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Pesquisar por descrição…"
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Category Filter */}
        <Select
          items={categoryItems}
          value={categoryId}
          onValueChange={(v) => setCategoryId((v as string) ?? ALL_CATEGORIES)}
        >
          <SelectTrigger className="sm:w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categoryItems.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Period Filter */}
        <Select
          items={periods}
          value={period}
          onValueChange={(v) => setPeriod((v as string) ?? "month")}
        >
          <SelectTrigger className="sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {periods.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sort select dropdown */}
        <Select
          value={sortBy}
          onValueChange={(v) => { if (v) setSortBy(v); }}
        >
          <SelectTrigger className="sm:w-44">
            <SelectValue placeholder="Ordenar por..." />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Date Pickers for Custom Period */}
      {period === "custom" && (
        <div className="flex items-center gap-2 mt-2 sm:mt-0 p-3 rounded-lg border bg-accent/10 border-border/40 w-fit">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">De:</span>
            <Input
              type="date"
              className="w-36 h-9 py-1"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Até:</span>
            <Input
              type="date"
              className="w-36 h-9 py-1"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
            />
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
        </div>
      ) : sortedTransactions.length === 0 ? (
        <EmptyState
          icon={History}
          title="Nenhum lançamento encontrado"
          description="Registre um gasto na Home ou ajuste os filtros acima."
        />
      ) : isSortedByAmount ? (
        /* Flat list display for amount-based sorting */
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Ordenado por valor
          </h3>
          <div className="divide-y rounded-xl border bg-card">
            {sortedTransactions.map((transaction) => (
              <TransactionRow
                key={transaction.id}
                transaction={transaction}
                onEdit={() => {
                  setEditingTransaction(transaction);
                  setEditDialogOpen(true);
                }}
                onDelete={() => {
                  if (window.confirm("Deseja realmente excluir este lançamento?")) {
                    remove.mutate(transaction.id);
                  }
                }}
                deletePending={remove.isPending && remove.variables === transaction.id}
              />
            ))}
          </div>
        </div>
      ) : (
        /* Grouped list display for date-based sorting */
        <div className="space-y-6">
          {groups.map(([periodLabel, items]) => (
            <section key={periodLabel}>
              <h3 className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {periodLabel}
              </h3>
              <div className="divide-y rounded-xl border bg-card">
                {items.map((transaction) => (
                  <TransactionRow
                    key={transaction.id}
                    transaction={transaction}
                    onEdit={() => {
                      setEditingTransaction(transaction);
                      setEditDialogOpen(true);
                    }}
                    onDelete={() => {
                      if (window.confirm("Deseja realmente excluir este lançamento?")) {
                        remove.mutate(transaction.id);
                      }
                    }}
                    deletePending={remove.isPending && remove.variables === transaction.id}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <TransactionEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        transaction={editingTransaction}
      />
    </div>
  );
}
