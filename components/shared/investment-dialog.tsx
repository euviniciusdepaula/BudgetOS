"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
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
import { queryKeys } from "@/lib/query-keys";
import { toISODate } from "@/lib/dates";
import { parseCurrencyInput } from "@/utils/format";
import { transactionService } from "@/services/transaction-service";
import type { Month } from "@/types/domain";

const schema = z.object({
  amount: z
    .string({ message: "Informe um valor" })
    .transform(parseCurrencyInput)
    .pipe(z.number().positive("O valor deve ser maior que zero")),
  description: z.string().min(1, "Informe uma descrição"),
  date: z.string().min(1, "Informe a data"),
});

type FormValues = z.input<typeof schema>;
type OutputValues = z.output<typeof schema>;

interface InvestmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  month: Month;
}

export function InvestmentDialog({
  open,
  onOpenChange,
  month,
}: InvestmentDialogProps) {
  const queryClient = useQueryClient();

  const form = useForm<FormValues, unknown, OutputValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: "",
      description: "Aporte de Investimento",
      date: toISODate(),
    },
  });

  const register = useMutation({
    mutationFn: (values: OutputValues) =>
      transactionService.registerInvestment({
        month,
        amount: values.amount,
        description: values.description,
        date: values.date,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.currentMonth });
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions(month.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.months });
      queryClient.invalidateQueries({ queryKey: ["investments"] });
      toast.success("Aporte de investimento registrado com sucesso!");
      form.reset({
        amount: "",
        description: "Aporte de Investimento",
        date: toISODate(),
      });
      onOpenChange(false);
    },
    onError: (error) => toast.error(error.message),
  });

  function onSubmit(values: OutputValues) {
    register.mutate(values);
  }

  const errors = form.formState.errors;

  return (
    <Dialog open={open} onOpenChange={(o) => onOpenChange(o)}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Registrar aporte de investimento</DialogTitle>
          <DialogDescription>
            Este valor será debitado do seu saldo bancário e da reserva mensal de investimentos.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="inv-amount">Valor</Label>
              <Input
                id="inv-amount"
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
              <Label htmlFor="inv-date">Data</Label>
              <Input id="inv-date" type="date" {...form.register("date")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="inv-description">Descrição</Label>
            <Input
              id="inv-description"
              placeholder="Ex.: Aporte Tesouro Direto"
              {...form.register("description")}
            />
            {errors.description && (
              <p className="text-sm text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={register.isPending}>
              Confirmar aporte
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
