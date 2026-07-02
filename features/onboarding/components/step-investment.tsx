"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useVault } from "@/hooks/use-vault";
import { queryKeys } from "@/lib/query-keys";
import { vaultRepository } from "@/services/repositories/vault-repository";

const schema = z.object({
  goal: z
    .number({ message: "Informe um valor" })
    .nonnegative("O valor não pode ser negativo"),
});

type FormValues = z.infer<typeof schema>;

export function StepInvestment({ onDone }: { onDone: () => void }) {
  const queryClient = useQueryClient();
  const { data: vault } = useVault();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { goal: undefined },
  });

  const save = useMutation({
    mutationFn: async (values: FormValues) => {
      if (!vault) throw new Error("Vault não encontrado.");
      await vaultRepository.updateInvestmentGoal(vault.id, values.goal);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.vault });
      onDone();
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <form
      onSubmit={form.handleSubmit((values) => save.mutate(values))}
      className="space-y-6"
    >
      <div className="space-y-2">
        <Label htmlFor="investment-goal">Meta mensal de investimento</Label>
        <Input
          id="investment-goal"
          type="number"
          step="0.01"
          min="0"
          placeholder="1500,00"
          autoFocus
          {...form.register("goal", { valueAsNumber: true })}
        />
        {form.formState.errors.goal && (
          <p className="text-sm text-destructive">
            {form.formState.errors.goal.message}
          </p>
        )}
        <p className="text-sm text-muted-foreground">
          Esse valor é reservado todo mês antes de calcular o quanto você pode
          gastar. Você pode ajustar depois em Configurações.
        </p>
      </div>
      <Button type="submit" className="w-full" disabled={save.isPending}>
        Continuar
      </Button>
    </form>
  );
}
