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
import type { AdjustmentType } from "@/types/database";
import type { Month } from "@/types/domain";
import { useBalanceAdjustment } from "../hooks/use-balance-adjustment";

const adjustmentTypes: Array<{ value: AdjustmentType; label: string }> = [
  { value: "entry", label: "Entrada" },
  { value: "exit", label: "Saída" },
  { value: "correction", label: "Correção" },
  { value: "transfer", label: "Transferência" },
];

const schema = z.object({
  type: z.enum(["entry", "exit", "correction", "transfer"]),
  amount: z
    .number({ message: "Informe um valor" })
    .refine((v) => v !== 0, "O valor não pode ser zero"),
  description: z.string(),
});

type FormValues = z.infer<typeof schema>;

interface BalanceAdjustmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  month: Month;
}

export function BalanceAdjustmentDialog({
  open,
  onOpenChange,
  month,
}: BalanceAdjustmentDialogProps) {
  const adjust = useBalanceAdjustment();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { type: "entry", amount: undefined, description: "" },
  });

  useEffect(() => {
    if (open) {
      form.reset({ type: "entry", amount: undefined, description: "" });
    }
  }, [open, form]);

  const type = form.watch("type");

  async function onSubmit(values: FormValues) {
    await adjust.mutateAsync({
      month,
      type: values.type,
      amount: values.amount,
      description: values.description,
    });
    onOpenChange(false);
  }

  const errors = form.formState.errors;

  return (
    <Dialog open={open} onOpenChange={(o) => onOpenChange(o)}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Ajustar saldo bancário</DialogTitle>
          <DialogDescription>
            Ajustes alteram apenas o saldo bancário — nunca as categorias. O
            disponível é recalculado automaticamente.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select
              items={adjustmentTypes}
              value={type}
              onValueChange={(value) =>
                form.setValue("type", value as AdjustmentType)
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {adjustmentTypes.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="adj-amount">Valor</Label>
            <Input
              id="adj-amount"
              type="number"
              step="0.01"
              placeholder="0,00"
              {...form.register("amount", { valueAsNumber: true })}
            />
            {errors.amount && (
              <p className="text-sm text-destructive">{errors.amount.message}</p>
            )}
            {type === "correction" && (
              <p className="text-xs text-muted-foreground">
                Use valor negativo para corrigir o saldo para baixo.
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="adj-description">Descrição</Label>
            <Input
              id="adj-description"
              placeholder="Ex.: reembolso, saque…"
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
            <Button type="submit" disabled={adjust.isPending}>
              Aplicar ajuste
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
