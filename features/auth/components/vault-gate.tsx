"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SplashScreen } from "@/components/shared/splash-screen";
import { useVault } from "@/hooks/use-vault";
import { isSupabaseConfigured } from "@/lib/env";
import { getStoredKeyHash } from "@/lib/vault-session";
import { SetupScreen } from "@/components/shared/setup-screen";
import { LockScreen } from "./lock-screen";

/**
 * Porteiro do Vault:
 * 1. Sem Supabase configurado → instruções de setup.
 * 2. Sem Vault criado → redireciona para o onboarding.
 * 3. Vault bloqueado → tela de chave de acesso.
 */
export function VaultGate({ children }: { children: React.ReactNode }) {
  const configured = isSupabaseConfigured();
  const router = useRouter();
  const { data: vault, isLoading, isError, error } = useVault(configured);
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    if (vault) {
      setUnlocked(getStoredKeyHash() === vault.access_key_hash);
    }
  }, [vault]);

  useEffect(() => {
    if (configured && !isLoading && !isError && vault === null) {
      router.replace("/onboarding");
    }
  }, [configured, isLoading, isError, vault, router]);

  if (!configured) return <SetupScreen />;
  if (isError) {
    return (
      <div className="flex min-h-svh items-center justify-center px-6">
        <p className="max-w-sm text-center text-sm text-muted-foreground">
          Não foi possível conectar ao Supabase: {error.message}
        </p>
      </div>
    );
  }
  if (isLoading || !vault) return <SplashScreen />;
  if (!unlocked) {
    return <LockScreen vault={vault} onUnlock={() => setUnlocked(true)} />;
  }
  return children;
}
