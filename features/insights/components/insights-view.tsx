"use client";

import { Lightbulb } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";

export function InsightsView() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Insights"
        description="O que os seus números estão tentando te dizer."
      />
      <EmptyState
        icon={Lightbulb}
        title="Ainda não há insights"
        description="Conforme você usa o BudgetOS, padrões e recomendações sobre seus gastos aparecerão aqui."
      />
    </div>
  );
}
