"use client";

import { useMemo, useState } from "react";
import { Pencil, Plus, Repeat, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { FixedExpenseDialog } from "@/components/shared/fixed-expense-dialog";
import { useCurrentMonth } from "@/hooks/use-current-month";
import { useFixedExpenses } from "@/hooks/use-fixed-expenses";
import { useFixedExpenseMutations } from "@/hooks/use-fixed-expense-mutations";
import { usePayments } from "@/hooks/use-payments";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/format";
import type { FixedExpense } from "@/types/domain";
import { useTogglePaid } from "../hooks/use-toggle-paid";

export function FixedExpensesView() {
  const { data: month } = useCurrentMonth();
  const { data: expenses } = useFixedExpenses();
  const { data: payments } = usePayments(month?.id);
  const { remove } = useFixedExpenseMutations();
  const togglePaid = useTogglePaid();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<FixedExpense | null>(null);

  const paidIds = useMemo(
    () => new Set((payments ?? []).map((p) => p.fixed_expense_id)),
    [payments]
  );

  const list = expenses ?? [];
  const activeTotal = list
    .filter((f) => f.active)
    .reduce((sum, f) => sum + f.amount, 0);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Gastos Fixos"
        description="Compromissos recorrentes que saem antes de qualquer decisão."
      >
        <Button
          size="sm"
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          <Plus />
          Novo gasto fixo
        </Button>
      </PageHeader>

      {list.length === 0 ? (
        <EmptyState
          icon={Repeat}
          title="Nenhum gasto fixo cadastrado"
          description="Aluguel, assinaturas, contas — cadastre aqui o que se repete todo mês para o cálculo ficar realista."
        />
      ) : (
        <div className="space-y-2">
          {list.map((expense) => {
            const paid = paidIds.has(expense.id);
            return (
              <div
                key={expense.id}
                className={cn(
                  "flex items-center gap-4 rounded-xl border bg-card px-4 py-3.5 transition-opacity",
                  (!expense.active || paid) && "opacity-60"
                )}
              >
                <Checkbox
                  aria-label={`Marcar ${expense.name} como pago`}
                  checked={paid}
                  disabled={!month || !expense.active || togglePaid.isPending}
                  onCheckedChange={(checked) => {
                    if (!month) return;
                    togglePaid.mutate({
                      month,
                      expense,
                      paid: checked === true,
                    });
                  }}
                />
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "truncate text-sm font-medium",
                      paid && "line-through"
                    )}
                  >
                    {expense.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Vence dia {expense.due_day}
                  </p>
                </div>
                {!expense.active && <Badge variant="outline">Inativo</Badge>}
                {paid && (
                  <Badge className="bg-emerald-500/15 text-emerald-400">
                    Pago
                  </Badge>
                )}
                <span className="text-sm font-medium tabular-nums">
                  {formatCurrency(expense.amount)}
                </span>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Editar"
                    onClick={() => {
                      setEditing(expense);
                      setDialogOpen(true);
                    }}
                  >
                    <Pencil />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Excluir"
                    disabled={paid}
                    onClick={() => remove.mutate(expense.id)}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </div>
            );
          })}

          <p className="pt-2 text-sm text-muted-foreground">
            Total reservado por mês:{" "}
            <span className="font-medium text-foreground tabular-nums">
              {formatCurrency(activeTotal)}
            </span>
          </p>
        </div>
      )}

      <FixedExpenseDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        expense={editing}
      />
    </div>
  );
}
