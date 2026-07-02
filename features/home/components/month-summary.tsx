"use client";

import { FileText } from "lucide-react";
import { currentYearMonth, monthLabel } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/format";
import type { Month } from "@/types/domain";

interface SummaryRowProps {
  label: string;
  value: number;
  signed?: "plus" | "minus";
  highlight?: boolean;
}

function SummaryRow({ label, value, signed, highlight }: SummaryRowProps) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span
        className={cn(
          "text-sm",
          highlight ? "font-semibold text-foreground" : "text-muted-foreground"
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          "text-sm font-medium tabular-nums",
          highlight && "text-base font-semibold text-primary"
        )}
      >
        {signed === "minus" && "− "}
        {signed === "plus" && "+ "}
        {formatCurrency(value)}
      </span>
    </div>
  );
}

export function MonthSummary({
  month,
  className,
}: {
  month: Month;
  className?: string;
}) {
  return (
    <section className={cn("surface-card p-7", className)}>
      <div className="mb-5 flex items-center gap-3">
        <span className="flex size-9 items-center justify-center rounded-[12px] bg-accent text-muted-foreground">
          <FileText className="size-4.5" />
        </span>
        <div>
          <h2 className="text-sm font-semibold">Resumo do mês</h2>
          <p className="text-xs text-muted-foreground">
            {monthLabel(currentYearMonth())}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <SummaryRow label="Salário" value={month.salary} signed="plus" />
        <SummaryRow
          label="Receitas extras"
          value={month.extra_income}
          signed="plus"
        />
        <SummaryRow
          label="Contas"
          value={month.reserved_fixed_expenses}
          signed="minus"
        />
        <SummaryRow
          label="Investimentos"
          value={month.reserved_investment}
          signed="minus"
        />
        <div className="my-4 border-t border-dashed" />
        <SummaryRow label="Disponível" value={month.available_balance} highlight />
      </div>
    </section>
  );
}
