"use client";

import { useMemo, useState } from "react";
import {
  ArrowDownUp,
  ArrowDownLeft,
  ArrowUpRight,
  History,
  Search,
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
import { useCategories } from "@/hooks/use-categories";
import { useCurrentMonth } from "@/hooks/use-current-month";
import { useTransactions } from "@/hooks/use-transactions";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDate } from "@/utils/format";
import type { TransactionWithCategory } from "@/types/domain";

const ALL_CATEGORIES = "all";
const periods = [
  { value: "month", label: "Mês inteiro" },
  { value: "7d", label: "Últimos 7 dias" },
  { value: "today", label: "Hoje" },
];

function periodRange(period: string): { from?: string; to?: string } {
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
  return {};
}

function TransactionRow({ transaction }: { transaction: TransactionWithCategory }) {
  const isExpense = transaction.type === "expense";
  const isIncome = transaction.type === "income";

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-card text-base">
        {transaction.category?.emoji ??
          (isIncome ? (
            <ArrowDownLeft className="size-4 text-emerald-400" />
          ) : (
            <ArrowUpRight className="size-4 text-muted-foreground" />
          ))}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {transaction.description ||
            transaction.category?.name ||
            (isIncome ? "Receita" : "Lançamento")}
        </p>
        <p className="text-xs text-muted-foreground">
          {transaction.category?.name ?? "Sem categoria"}
        </p>
      </div>
      <p
        className={cn(
          "text-sm font-medium tabular-nums",
          isIncome ? "text-emerald-400" : "text-foreground"
        )}
      >
        {isExpense ? "−" : isIncome ? "+" : ""}
        {formatCurrency(transaction.amount)}
      </p>
    </div>
  );
}

export function HistoryView() {
  const { data: month } = useCurrentMonth();
  const { data: categories } = useCategories();

  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string>(ALL_CATEGORIES);
  const [period, setPeriod] = useState("month");
  const [ascending, setAscending] = useState(false);

  const range = periodRange(period);
  const { data: transactions, isLoading } = useTransactions(month?.id, {
    categoryId: categoryId === ALL_CATEGORIES ? undefined : categoryId,
    search: search.trim() || undefined,
    from: range.from,
    to: range.to,
    ascending,
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

  const groups = useMemo(() => {
    const byDate = new Map<string, TransactionWithCategory[]>();
    for (const t of transactions ?? []) {
      const list = byDate.get(t.date) ?? [];
      list.push(t);
      byDate.set(t.date, list);
    }
    return Array.from(byDate.entries());
  }, [transactions]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Histórico"
        description="Sua linha do tempo de gastos e decisões."
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Pesquisar por descrição…"
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
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
        <Button
          variant="outline"
          size="sm"
          onClick={() => setAscending((v) => !v)}
        >
          <ArrowDownUp />
          {ascending ? "Mais antigos" : "Mais recentes"}
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
        </div>
      ) : groups.length === 0 ? (
        <EmptyState
          icon={History}
          title="Nenhum lançamento encontrado"
          description="Registre um gasto na Home ou ajuste os filtros acima."
        />
      ) : (
        <div className="space-y-6">
          {groups.map(([date, items]) => (
            <section key={date}>
              <h3 className="mb-2 text-xs font-medium text-muted-foreground uppercase">
                {formatDate(`${date}T00:00:00`)}
              </h3>
              <div className="divide-y rounded-xl border bg-card">
                {items.map((transaction) => (
                  <TransactionRow
                    key={transaction.id}
                    transaction={transaction}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
