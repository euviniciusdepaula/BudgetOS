"use client";

import { SplashScreen } from "@/components/shared/splash-screen";
import { useCurrentMonth } from "@/hooks/use-current-month";
import { MonthOpeningDialog } from "./month-opening-dialog";

/**
 * Garante que existe um mês financeiro aberto: se o mês corrente
 * ainda não foi criado, exibe o modal de abertura antes do app.
 */
export function MonthGate({ children }: { children: React.ReactNode }) {
  const { data: month, isLoading } = useCurrentMonth();

  if (isLoading) return <SplashScreen />;
  if (!month) {
    return (
      <>
        <SplashScreen />
        <MonthOpeningDialog />
      </>
    );
  }
  return children;
}
