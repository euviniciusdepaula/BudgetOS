"use client";

import { Target } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";

export function GoalsView() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Objetivos"
        description="Para onde seu dinheiro está indo de propósito."
      />
      <EmptyState
        icon={Target}
        title="Nenhum objetivo definido"
        description="Crie objetivos — uma viagem, uma reserva, uma compra grande — e acompanhe o progresso de cada um."
      />
    </div>
  );
}
