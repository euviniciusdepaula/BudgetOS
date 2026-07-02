"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCategories } from "@/hooks/use-categories";
import { useTransactionMutations } from "@/hooks/use-transaction-mutations";
import { parseCurrencyInput } from "@/utils/format";
import type { TransactionWithCategory } from "@/types/domain";

const schema = z.object({
  amount: z
    .string({ message: "Informe um valor" })
    .transform(parseCurrencyInput)
    .pipe(z.number().positive("O valor deve ser maior que zero")),
  categoryId: z.string().nullable(),
  description: z.string(),
  date: z.string().min(1, "Informe a data"),
});

type FormValues = z.input<typeof schema>;
type OutputValues = z.output<typeof schema>;

interface TransactionEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: TransactionWithCategory | null;
}

export function TransactionEditDialog({
  open,
  onOpenChange,
  transaction,
}: TransactionEditDialogProps) {
  const { data: categories } = useCategories();
  const { update } = useTransactionMutations(transaction?.month_id);

  const form = useForm<FormValues, unknown, OutputValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: "",
      categoryId: null,
      description: "",
      date: "",
    },
  });

  useEffect(() => {
    if (open && transaction) {
      form.reset({
        amount: String(transaction.amount),
        categoryId: transaction.category_id || null,
        description: transaction.description || "",
        date: transaction.date,
      });
    }
  }, [open, transaction, form]);

  const selectItems = (categories ?? []).map((c) => ({
    value: c.id,
    label: `${c.emoji} ${c.name}`,
  }));

  async function onSubmit(values: OutputValues) {
    if (!transaction) return;
    await update.mutateAsync({
      id: transaction.id,
      input: {
        amount: values.amount,
        categoryId: values.categoryId,
        description: values.description,
        date: values.date,
      },
    });
    onOpenChange(false);
  }

  const isExpense = transaction?.type === "expense";
  const errors = form.formState.errors;

  return (
    <Dialog open={open} onOpenChange={(o) => onOpenChange(o)}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Editar lançamento</DialogTitle>
          <DialogDescription>
            Ajuste os valores, categoria ou descrição deste lançamento.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="edit-tx-amount">Valor</Label>
              <Input
                id="edit-tx-amount"
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                autoFocus
                {...form.register("amount")}
              />
              {errors.amount && (
                <p className="text-sm text-destructive">
                  {errors.amount.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-tx-date">Data</Label>
              <Input id="edit-tx-date" type="date" {...form.register("date")} />
            </div>
          </div>

          {isExpense && (
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select
                items={selectItems}
                value={form.watch("categoryId") || null}
                onValueChange={(value) =>
                  form.setValue("categoryId", (value as string) ?? null, {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Escolha uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {selectItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="edit-tx-description">Descrição</Label>
            <Input
              id="edit-tx-description"
              placeholder="Ex.: mercado da semana"
              {...form.register("description")}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={update.isPending}>
              Salvar alterações
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
