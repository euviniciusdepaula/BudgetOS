"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LockKeyhole, PiggyBank, Vault as VaultIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/layout/page-header";
import { useVault } from "@/hooks/use-vault";
import { queryKeys } from "@/lib/query-keys";
import { clearVaultSession } from "@/lib/vault-session";
import { vaultRepository } from "@/services/repositories/vault-repository";
import { formatDate } from "@/utils/format";

export function SettingsView() {
  const queryClient = useQueryClient();
  const { data: vault } = useVault();
  const [goal, setGoal] = useState("");

  useEffect(() => {
    if (vault) setGoal(String(vault.investment_goal));
  }, [vault]);

  const saveGoal = useMutation({
    mutationFn: async () => {
      if (!vault) throw new Error("Vault não encontrado.");
      const value = Number(goal);
      if (Number.isNaN(value) || value < 0) {
        throw new Error("Informe um valor válido.");
      }
      await vaultRepository.updateInvestmentGoal(vault.id, value);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.vault });
      toast.success("Meta de investimento atualizada.");
    },
    onError: (error) => toast.error(error.message),
  });

  function lockVault() {
    clearVaultSession();
    window.location.reload();
  }

  if (!vault) return null;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Configurações"
        description="Conta, preferências e integrações."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <span className="mb-1 flex size-9 items-center justify-center rounded-lg border bg-card">
              <VaultIcon className="size-4 text-muted-foreground" />
            </span>
            <CardTitle>{vault.name}</CardTitle>
            <CardDescription>
              Cofre criado em {formatDate(vault.created_at)}. Protegido por
              chave de acesso — apenas o hash fica salvo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm" onClick={lockVault}>
              <LockKeyhole />
              Bloquear cofre
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <span className="mb-1 flex size-9 items-center justify-center rounded-lg border bg-card">
              <PiggyBank className="size-4 text-muted-foreground" />
            </span>
            <CardTitle>Meta de investimento</CardTitle>
            <CardDescription>
              Reservada todo mês antes do cálculo do disponível. Vale a partir
              do próximo mês aberto.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="flex items-end gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                saveGoal.mutate();
              }}
            >
              <div className="flex-1 space-y-2">
                <Label htmlFor="settings-goal">Valor mensal</Label>
                <Input
                  id="settings-goal"
                  type="number"
                  step="0.01"
                  min="0"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                />
              </div>
              <Button type="submit" size="sm" disabled={saveGoal.isPending}>
                Salvar
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
