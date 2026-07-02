"use client";

import { TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";

export function InvestmentsView() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Investimentos"
        description="O que você guarda antes de decidir o que pode gastar."
      />
      <EmptyState
        icon={TrendingUp}
        title="Nenhum investimento registrado"
        description="Defina seus aportes recorrentes para que eles sejam reservados antes do orçamento do dia."
      />
    </div>
  );
}
