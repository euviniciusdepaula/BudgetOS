"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowUpRight, CheckCircle2, Repeat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFixedExpenses } from "@/hooks/use-fixed-expenses";
import { usePayments } from "@/hooks/use-payments";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/format";
import type { Month } from "@/types/domain";

const MAX_ITEMS = 4;

export function FixedExpensesCard({
  month,
  className,
}: {
  month: Month;
  className?: string;
}) {
  const { data: expenses } = useFixedExpenses();
  const { data: payments } = usePayments(month.id);

  const paidIds = useMemo(
    () => new Set((payments ?? []).map((p) => p.fixed_expense_id)),
    [payments]
  );

  const active = (expenses ?? []).filter((e) => e.active);
  const upcoming = active
    .filter((e) => !paidIds.has(e.id))
    .sort((a, b) => a.due_day - b.due_day)
    .slice(0, MAX_ITEMS);

  return (
    <section className={cn("surface-card flex flex-col p-7", className)}>
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-[12px] bg-accent text-muted-foreground">
            <Repeat className="size-4.5" />
          </span>
          <div>
            <h2 className="text-sm font-semibold">Gastos fixos</h2>
            <p className="text-xs text-muted-foreground">Próximos vencimentos</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          render={<Link href="/gastos-fixos" />}
        >
          Ver todos
          <ArrowUpRight />
        </Button>
      </div>

      {active.length === 0 ? (
        <p className="rounded-[14px] border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
          Nenhum gasto fixo ativo.
        </p>
      ) : upcoming.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-[14px] border border-dashed px-4 py-8 text-center">
          <CheckCircle2 className="size-5 text-primary" />
          <p className="text-sm text-muted-foreground">
            Tudo pago este mês.
          </p>
        </div>
      ) : (
        <div className="flex-1 space-y-1">
          {upcoming.map((expense) => (
            <div
              key={expense.id}
              className="flex items-center justify-between gap-3 rounded-[14px] px-2.5 py-2 transition-colors hover:bg-surface-hover"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{expense.name}</p>
                <p className="text-[11px] text-muted-2">
                  Dia {expense.due_day} · {formatCurrency(expense.amount)}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-warning/12 px-2.5 py-0.5 text-[11px] font-medium text-warning">
                Pendente
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
