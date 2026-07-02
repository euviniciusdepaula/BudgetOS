"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { KeyRound, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { hashAccessKey } from "@/lib/crypto";
import { storeKeyHash } from "@/lib/vault-session";
import type { Vault } from "@/types/domain";

interface LockScreenProps {
  vault: Vault;
  onUnlock: () => void;
}

export function LockScreen({ vault, onUnlock }: LockScreenProps) {
  const [key, setKey] = useState("");
  const [error, setError] = useState(false);
  const [checking, setChecking] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!key.trim()) return;
    setChecking(true);
    const hash = await hashAccessKey(key);
    if (hash === vault.access_key_hash) {
      storeKeyHash(hash);
      onUnlock();
    } else {
      setError(true);
      setChecking(false);
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-background px-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="w-full max-w-sm rounded-xl border bg-card p-8"
      >
        <span className="mb-5 flex size-11 items-center justify-center rounded-xl bg-primary">
          <LockKeyhole className="size-5 text-primary-foreground" />
        </span>
        <h1 className="text-lg font-semibold tracking-tight">{vault.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Digite sua chave de acesso para abrir o cofre.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="access-key">Chave de acesso</Label>
            <Input
              id="access-key"
              type="password"
              autoFocus
              autoComplete="off"
              placeholder="bgt_…"
              value={key}
              onChange={(e) => {
                setKey(e.target.value);
                setError(false);
              }}
              aria-invalid={error}
            />
            {error && (
              <p className="text-sm text-destructive">
                Chave incorreta. Tente novamente.
              </p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={checking}>
            <KeyRound />
            Desbloquear
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
