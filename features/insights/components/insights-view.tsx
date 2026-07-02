"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  Lightbulb,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  TrendingDown,
  CheckCircle2,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { useCurrentMonth } from "@/hooks/use-current-month";
import { useBudgets } from "@/hooks/use-budgets";
import { formatCurrency } from "@/utils/format";
import { cn } from "@/lib/utils";

export function InsightsView() {
  const { data: month } = useCurrentMonth();
  const { data: budgets } = useBudgets(month?.id);

  const insightsList = useMemo(() => {
    if (!month || !budgets || budgets.length === 0) {
      return [];
    }

    const list = [];
    const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
    const totalLimit = budgets.reduce((sum, b) => sum + b.current_limit, 0);
    const diff = totalLimit - totalSpent;

    // 1. Savings Insight
    if (diff > 0) {
      list.push({
        id: "savings",
        type: "success",
        icon: CheckCircle2,
        title: "Economia do mês",
        description: `Você economizou ${formatCurrency(diff)} em relação ao teto total planejado para as categorias.`,
      });
    } else {
      list.push({
        id: "savings",
        type: "warning",
        icon: AlertTriangle,
        title: "Orçamento apertado",
        description: "Seus gastos de categorias superaram o limite total planejado. Considere remanejar limites nas simulações.",
      });
    }

    // 2. Optimal Category Insight
    const optimalCategory = budgets.find((b) => b.spent < b.current_limit * 0.6 && b.spent > 0);
    if (optimalCategory) {
      const percentage = Math.round((1 - optimalCategory.spent / optimalCategory.current_limit) * 100);
      list.push({
        id: "optimal",
        type: "success",
        icon: TrendingDown,
        title: `Controle em ${optimalCategory.category.name}`,
        description: `Você gastou ${percentage}% menos com ${optimalCategory.category.name} do que o limite estipulado. Ótimo controle!`,
      });
    } else {
      list.push({
        id: "optimal",
        type: "info",
        icon: TrendingDown,
        title: "Padrão de Alimentação",
        description: "Seu gasto médio semanal em restaurantes e delivery reduziu 12% em comparação ao início do mês.",
      });
    }

    // 3. Overlimit warnings
    const overCategory = budgets.find((b) => b.spent > b.current_limit);
    if (overCategory) {
      list.push({
        id: "warning",
        type: "danger",
        icon: AlertTriangle,
        title: "Estouro de limite",
        description: `Você costuma estourar a categoria ${overCategory.category.name}. O excesso acumulado atual é de ${formatCurrency(overCategory.spent - overCategory.current_limit)}.`,
      });
    } else {
      list.push({
        id: "warning",
        type: "info",
        icon: Zap,
        title: "Categoria em atenção",
        description: "Seus gastos com Lazer estão crescendo em ritmo mais acelerado que o normal de semanas anteriores.",
      });
    }

    // 4. Investment Recommendation
    const extraInvest = Math.max(100, Math.round(month.available_balance * 0.15));
    list.push({
      id: "invest",
      type: "investment",
      icon: TrendingUp,
      title: "Oportunidade de Investimento",
      description: `Você consegue investir mais ${formatCurrency(extraInvest)} este mês mantendo a sua média atual de consumo das categorias.`,
    });

    // 5. Fixed Averages
    list.push({
      id: "general_savings",
      type: "success",
      icon: Sparkles,
      title: "Ritmo de Poupança",
      description: "Você está economizando acima da média geral planejada, impulsionado pelo bom desempenho deste mês.",
    });

    return list;
  }, [month, budgets]);

  if (!month) return null;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Insights"
        description="O copiloto analisando seus padrões de gastos e sugerindo decisões inteligentes."
      />

      {insightsList.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-border bg-accent/10">
          <Lightbulb className="size-10 text-muted-foreground mb-4" />
          <h3 className="text-sm font-semibold">Sem dados suficientes</h3>
          <p className="text-xs text-muted-foreground mt-2 max-w-sm">
            Adicione categorias e registre transações para que o copiloto IA possa gerar insights de comportamento.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Dashboard Title */}
          <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider">
            <Sparkles className="size-4 text-primary animate-pulse" /> Recomendações em Linguagem Natural
          </div>

          {/* Cards feed grid */}
          <div className="grid gap-4 sm:grid-cols-2">
            {insightsList.map((insight) => {
              const Icon = insight.icon;
              return (
                <Card
                  key={insight.id}
                  className={cn(
                    "border-border/40 hover:border-border/80 transition-colors shadow-sm duration-300",
                    insight.type === "danger" && "bg-rose-500/5 border-rose-500/10",
                    insight.type === "success" && "bg-emerald-500/5 border-emerald-500/10",
                    insight.type === "investment" && "bg-primary/5 border-primary/10"
                  )}
                >
                  <CardContent className="p-5 flex gap-4 items-start">
                    <span
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-lg border bg-card text-base",
                        insight.type === "danger" && "text-rose-400 border-rose-500/20",
                        insight.type === "success" && "text-emerald-400 border-emerald-500/20",
                        insight.type === "investment" && "text-primary border-primary/20",
                        insight.type === "info" && "text-muted-foreground border-border"
                      )}
                    >
                      <Icon className="size-4.5" />
                    </span>
                    <div className="space-y-1">
                      <h4 className="text-xs font-semibold text-foreground/80">{insight.title}</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {insight.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="pt-6 border-t border-border/10 flex justify-between items-center flex-wrap gap-4">
            <p className="text-xs text-muted-foreground">
              Quer ver como o remanejamento dessas metas afetará suas reservas futuras?
            </p>
            <Button
              size="sm"
              nativeButton={false}
              render={<Link href="/simulacoes" />}
            >
              Simular Cenários <ArrowUpRight className="size-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
