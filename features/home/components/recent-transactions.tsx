"use client";

import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight, ReceiptText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTransactions } from "@/hooks/use-transactions";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDate } from "@/utils/format";
import type { Month } from "@/types/domain";

const MAX_ITEMS = 5;

export function RecentTransactions({
  month,
  className,
}: {
  month: Month;
  className?: string;
}) {
  const { data: transactions } = useTransactions(month.id);
  const recent = (transactions ?? []).slice(0, MAX_ITEMS);

  return (
    <section className={cn("surface-card flex flex-col p-7", className)}>
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-[12px] bg-accent text-muted-foreground">
            <ReceiptText className="size-4.5" />
          </span>
          <div>
            <h2 className="text-sm font-semibold">Últimas transações</h2>
            <p className="text-xs text-muted-foreground">
              Os 5 lançamentos mais recentes
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          render={<Link href="/historico" />}
        >
          Ver todas
          <ArrowUpRight />
        </Button>
      </div>

      {recent.length === 0 ? (
        <p className="rounded-[14px] border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
          Nenhum lançamento ainda. Registre pelo assistente ou pelo botão
          “Registrar gasto”.
        </p>
      ) : (
        <div className="flex-1 space-y-0.5">
          {recent.map((transaction) => {
            const isIncome = transaction.type === "income";
            return (
              <div
                key={transaction.id}
                className="flex items-center gap-3 rounded-[14px] px-2.5 py-2 transition-colors hover:bg-surface-hover"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-accent text-sm">
                  {transaction.category?.emoji ??
                    (isIncome ? (
                      <ArrowDownLeft className="size-4 text-primary" />
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
                  <p className="text-[11px] text-muted-2">
                    {transaction.category?.name ?? "Sem categoria"} ·{" "}
                    {formatDate(`${transaction.date}T00:00:00`)}
                  </p>
                </div>
                <p
                  className={cn(
                    "text-sm font-semibold tabular-nums",
                    isIncome ? "text-primary" : "text-destructive"
                  )}
                >
                  {isIncome ? "+ " : "− "}
                  {formatCurrency(transaction.amount)}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
