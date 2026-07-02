"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FixedExpenseDialog } from "@/components/shared/fixed-expense-dialog";
import { useFixedExpenses } from "@/hooks/use-fixed-expenses";
import { useFixedExpenseMutations } from "@/hooks/use-fixed-expense-mutations";
import { formatCurrency } from "@/utils/format";
import type { FixedExpense } from "@/types/domain";

export function StepFixedExpenses({ onDone }: { onDone: () => void }) {
  const { data: expenses } = useFixedExpenses();
  const { remove } = useFixedExpenseMutations();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<FixedExpense | null>(null);

  const total = (expenses ?? []).reduce((sum, f) => sum + f.amount, 0);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        {(expenses ?? []).map((expense) => (
          <div
            key={expense.id}
            className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{expense.name}</p>
              <p className="text-xs text-muted-foreground">
                Vence dia {expense.due_day}
              </p>
            </div>
            <span className="text-sm tabular-nums">
              {formatCurrency(expense.amount)}
            </span>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setEditing(expense);
                  setDialogOpen(true);
                }}
              >
                <Pencil />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => remove.mutate(expense.id)}
              >
                <Trash2 />
              </Button>
            </div>
          </div>
        ))}

        {(expenses ?? []).length === 0 && (
          <p className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
            Nenhum gasto fixo ainda. Aluguel, assinaturas, contas…
          </p>
        )}
      </div>

      <Button
        variant="outline"
        className="w-full"
        onClick={() => {
          setEditing(null);
          setDialogOpen(true);
        }}
      >
        <Plus />
        Adicionar gasto fixo
      </Button>

      {total > 0 && (
        <p className="text-center text-sm text-muted-foreground">
          Total reservado por mês:{" "}
          <span className="font-medium text-foreground">
            {formatCurrency(total)}
          </span>
        </p>
      )}

      <Button className="w-full" onClick={onDone}>
        Continuar
      </Button>

      <FixedExpenseDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        expense={editing}
      />
    </div>
  );
}
