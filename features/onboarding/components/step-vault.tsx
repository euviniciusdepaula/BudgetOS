"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Check, Copy, KeyRound, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { generateAccessKey, hashAccessKey } from "@/lib/crypto";
import { queryKeys } from "@/lib/query-keys";
import { storeKeyHash } from "@/lib/vault-session";
import { vaultRepository } from "@/services/repositories/vault-repository";

export function StepVault({ onDone }: { onDone: () => void }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [accessKey, setAccessKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [creating, setCreating] = useState(false);

  async function copyKey() {
    if (!accessKey) return;
    await navigator.clipboard.writeText(accessKey);
    setCopied(true);
    toast.success("Chave copiada.");
  }

  async function createVault() {
    if (!accessKey) return;
    setCreating(true);
    try {
      const hash = await hashAccessKey(accessKey);
      await vaultRepository.create({ name: name.trim(), access_key_hash: hash });
      storeKeyHash(hash);
      onDone();
      queryClient.invalidateQueries({ queryKey: queryKeys.vault });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao criar o cofre");
      setCreating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="vault-name">Nome do cofre</Label>
        <Input
          id="vault-name"
          placeholder="Finanças do Vinicius"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={accessKey !== null}
          autoFocus
        />
      </div>

      {accessKey === null ? (
        <Button
          onClick={() => setAccessKey(generateAccessKey())}
          disabled={name.trim().length === 0}
        >
          <KeyRound />
          Gerar chave de acesso
        </Button>
      ) : (
        <div className="space-y-4">
          <div className="rounded-lg border bg-muted/40 p-4">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-amber-400">
              <TriangleAlert className="size-3.5" />
              Esta chave aparece apenas uma vez. Guarde-a em local seguro.
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 truncate rounded-md bg-background px-3 py-2 font-mono text-sm">
                {accessKey}
              </code>
              <Button variant="outline" size="icon" onClick={copyKey}>
                {copied ? <Check className="text-emerald-400" /> : <Copy />}
              </Button>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={confirmed}
              onCheckedChange={(checked) => setConfirmed(checked === true)}
            />
            Salvei minha chave em um lugar seguro
          </label>

          <Button
            className="w-full"
            disabled={!confirmed || creating}
            onClick={createVault}
          >
            Criar cofre
          </Button>
        </div>
      )}
    </div>
  );
}
