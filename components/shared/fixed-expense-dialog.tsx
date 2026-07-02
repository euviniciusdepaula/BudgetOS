"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { parseCurrencyInput } from "@/utils/format";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFixedExpenseMutations } from "@/hooks/use-fixed-expense-mutations";
import type { FixedExpense } from "@/types/domain";

const schema = z.object({
  name: z.string().min(1, "Informe um nome"),
  amount: z
    .string({ message: "Informe um valor" })
    .transform(parseCurrencyInput)
    .pipe(z.number().positive("O valor deve ser maior que zero")),
  due_day: z
    .number({ message: "Informe o dia" })
    .int("Dia inválido")
    .min(1, "Entre 1 e 31")
    .max(31, "Entre 1 e 31"),
  active: z.boolean(),
});

type FormValues = z.input<typeof schema>;
type OutputValues = z.output<typeof schema>;

interface FixedExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Preenchido para edição; null para criação. */
  expense: FixedExpense | null;
}

export function FixedExpenseDialog({
  open,
  onOpenChange,
  expense,
}: FixedExpenseDialogProps) {
  const { create, update } = useFixedExpenseMutations();

  const form = useForm<FormValues, unknown, OutputValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", amount: "", due_day: undefined, active: true },
  });

  useEffect(() => {
    if (open) {
      form.reset(
        expense
          ? {
              name: expense.name,
              amount: String(expense.amount),
              due_day: expense.due_day,
              active: expense.active,
            }
          : { name: "", amount: "", due_day: undefined, active: true }
      );
    }
  }, [open, expense, form]);

  async function onSubmit(values: OutputValues) {
    if (expense) {
      await update.mutateAsync({ id: expense.id, ...values });
    } else {
      await create.mutateAsync(values);
    }
    onOpenChange(false);
  }

  const pending = create.isPending || update.isPending;
  const errors = form.formState.errors;

  return (
    <Dialog open={open} onOpenChange={(o) => onOpenChange(o)}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {expense ? "Editar gasto fixo" : "Novo gasto fixo"}
          </DialogTitle>
          <DialogDescription>
            Compromissos que se repetem todo mês.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fe-name">Nome</Label>
            <Input
              id="fe-name"
              placeholder="Aluguel"
              {...form.register("name")}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="fe-amount">Valor</Label>
              <Input
                id="fe-amount"
                type="text"
                inputMode="decimal"
                min="0"
                placeholder="0,00"
                {...form.register("amount")}
              />
              {errors.amount && (
                <p className="text-sm text-destructive">
                  {errors.amount.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="fe-due-day">Dia de vencimento</Label>
              <Input
                id="fe-due-day"
                type="number"
                min="1"
                max="31"
                placeholder="10"
                {...form.register("due_day", { valueAsNumber: true })}
              />
              {errors.due_day && (
                <p className="text-sm text-destructive">
                  {errors.due_day.message}
                </p>
              )}
            </div>
          </div>
          {expense && (
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={form.watch("active")}
                onCheckedChange={(checked) =>
                  form.setValue("active", checked === true)
                }
              />
              Ativo (entra na reserva do mês)
            </label>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
