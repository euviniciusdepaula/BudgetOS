"use client";

import { useMemo, useState } from "react";
import { Pencil, Plus, Repeat, Trash2, CheckCircle2, Calendar, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
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

  const list = useMemo(() => {
    return [...(expenses ?? [])].sort((a, b) => a.due_day - b.due_day);
  }, [expenses]);

  const activeTotal = list
    .filter((f) => f.active)
    .reduce((sum, f) => sum + f.amount, 0);

  const paidVal = useMemo(() => {
    return list
      .filter((e) => e.active && paidIds.has(e.id))
      .reduce((sum, e) => sum + e.amount, 0);
  }, [list, paidIds]);

  const pendingVal = useMemo(() => {
    return list
      .filter((e) => e.active && !paidIds.has(e.id))
      .reduce((sum, e) => sum + e.amount, 0);
  }, [list, paidIds]);

  const paidCount = list.filter((e) => e.active && paidIds.has(e.id)).length;
  const pendingCount = list.filter((e) => e.active && !paidIds.has(e.id)).length;

  const daysRemaining = useMemo(() => {
    const today = new Date().getDate();
    const unpaidDueDays = list
      .filter((e) => e.active && !paidIds.has(e.id))
      .map((e) => e.due_day);
    if (unpaidDueDays.length === 0) return null;

    const upcoming = unpaidDueDays.filter((d) => d >= today);
    if (upcoming.length > 0) {
      return Math.min(...upcoming) - today;
    }
    return Math.min(...unpaidDueDays) + (30 - today);
  }, [list, paidIds]);

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
        <div className="space-y-8">
          {/* Summary Dashboard Grid */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="border-border/40 bg-accent/10">
              <CardContent className="p-5 flex flex-col justify-between h-full">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Valor Reservado</p>
                <div className="mt-3 flex items-end justify-between">
                  <span className="text-2xl font-bold tracking-tight tabular-nums">{formatCurrency(activeTotal)}</span>
                  <span className="text-xs text-muted-foreground font-medium">{list.filter(e => e.active).length} ativos</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/40 bg-emerald-500/5">
              <CardContent className="p-5 flex flex-col justify-between h-full">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <CheckCircle2 className="size-3.5 text-emerald-400" /> Valor Pago
                </p>
                <div className="mt-3 flex items-end justify-between">
                  <span className="text-2xl font-bold tracking-tight text-emerald-400 tabular-nums">{formatCurrency(paidVal)}</span>
                  <span className="text-xs text-muted-foreground font-medium">{paidCount} pagos</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/40 bg-warning/5">
              <CardContent className="p-5 flex flex-col justify-between h-full">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <Calendar className="size-3.5 text-warning" /> Valor Pendente
                </p>
                <div className="mt-3 flex items-end justify-between">
                  <span className="text-2xl font-bold tracking-tight text-warning tabular-nums">{formatCurrency(pendingVal)}</span>
                  <span className="text-xs text-muted-foreground font-medium">
                    {daysRemaining !== null
                      ? `${daysRemaining === 0 ? "Vence hoje" : `Vence em ${daysRemaining}d`}`
                      : "Tudo pago!"}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Due-Date Timeline */}
          <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-[2px] before:bg-border/30">
            {list.map((expense) => {
              const paid = paidIds.has(expense.id);
              return (
                <div
                  key={expense.id}
                  className={cn(
                    "relative flex items-center gap-4 rounded-xl border bg-card px-4 py-3.5 transition-all hover:bg-surface-hover/30",
                    (!expense.active || paid) && "opacity-65"
                  )}
                >
                  {/* Timeline point indicator */}
                  <span
                    className={cn(
                      "absolute -left-[20.5px] top-1/2 -translate-y-1/2 size-2.5 rounded-full border-2 bg-background transition-colors",
                      paid ? "border-emerald-500 bg-emerald-500" : "border-warning"
                    )}
                  />

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
                        "truncate text-sm font-semibold",
                        paid && "line-through text-muted-foreground"
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
                    <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                      Pago
                    </Badge>
                  )}
                  <span className="text-sm font-semibold tabular-nums">
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
                      <Pencil className="size-4 text-muted-foreground hover:text-foreground" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Excluir"
                      disabled={paid}
                      onClick={() => {
                        if (window.confirm(`Excluir gasto fixo ${expense.name}?`)) {
                          remove.mutate(expense.id);
                        }
                      }}
                    >
                      <Trash2 className="size-4 text-muted-foreground hover:text-destructive" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
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

