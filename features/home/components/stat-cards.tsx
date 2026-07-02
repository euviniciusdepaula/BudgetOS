"use client";

import { useState } from "react";
import { Landmark, PiggyBank, Repeat, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/format";
import type { Month } from "@/types/domain";
import { BalanceAdjustmentDialog } from "./balance-adjustment-dialog";

interface StatCardProps {
  icon: React.ReactNode;
  iconClass: string;
  title: string;
  value: number;
  description: string;
  action?: React.ReactNode;
}

function StatCard({
  icon,
  iconClass,
  title,
  value,
  description,
  action,
}: StatCardProps) {
  return (
    <div className="surface-card surface-hoverable rounded-[16px] p-5">
      <div className="flex items-start justify-between">
        <span
          className={cn(
            "flex size-9 items-center justify-center rounded-[12px]",
            iconClass
          )}
        >
          {icon}
        </span>
        {action}
      </div>
      <p className="mt-4 text-xs font-medium text-muted-foreground">{title}</p>
      <p className="mt-1 text-xl font-semibold tracking-tight tabular-nums">
        {formatCurrency(value)}
      </p>
      <p className="mt-1 text-[11px] text-muted-2">{description}</p>
    </div>
  );
}

export function StatCards({ month }: { month: Month }) {
  const [adjustOpen, setAdjustOpen] = useState(false);

  return (
    <>
      <div className="grid gap-6 sm:grid-cols-3">
        <StatCard
          icon={<Landmark className="size-4.5" />}
          iconClass="bg-primary/12 text-primary"
          title="Saldo bancário"
          value={month.bank_balance}
          description="Tudo o que está na conta"
          action={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Ajustar saldo"
              onClick={() => setAdjustOpen(true)}
              className="-mt-1 -mr-1 text-muted-foreground hover:text-foreground"
            >
              <SlidersHorizontal />
            </Button>
          }
        />
        <StatCard
          icon={<Repeat className="size-4.5" />}
          iconClass="bg-warning/12 text-warning"
          title="Reservado para contas"
          value={month.reserved_fixed_expenses}
          description="Gastos fixos ainda por pagar"
        />
        <StatCard
          icon={<PiggyBank className="size-4.5" />}
          iconClass="bg-info/12 text-info"
          title="Reservado para investir"
          value={month.reserved_investment}
          description="Guardado antes de gastar"
        />
      </div>

      <BalanceAdjustmentDialog
        open={adjustOpen}
        onOpenChange={setAdjustOpen}
        month={month}
      />
    </>
  );
}
