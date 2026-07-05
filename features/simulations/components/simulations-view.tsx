"use client";

import { useState, useEffect, useMemo } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Play,
  Check,
  TrendingUp,
  AlertTriangle,
  HelpCircle,
  TrendingDown,
  Info,
  Calendar,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/layout/page-header";
import { useCurrentMonth } from "@/hooks/use-current-month";
import { useBudgets } from "@/hooks/use-budgets";
import { useVault } from "@/hooks/use-vault";
import { formatCurrency } from "@/utils/format";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/query-keys";
import { toast } from "sonner";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

export function SimulationsView() {
  const queryClient = useQueryClient();
  const { data: month } = useCurrentMonth();
  const { data: budgets } = useBudgets(month?.id);
  const { data: vault } = useVault();

  // Input states
  const [decisionText, setDecisionText] = useState("");
  const [valInput, setValInput] = useState("");
  const [selectedCatId, setSelectedCatId] = useState("");
  const [dateInput, setDateInput] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });

  const [simulationResult, setSimulationResult] = useState<{
    categoryName: string;
    categoryEmoji: string;
    categoryId: string;
    amount: number;
    before: { limit: number; spent: number; remaining: number };
    after: { limit: number; spent: number; remaining: number };
    status: "green" | "yellow" | "red";
    statusText: string;
    deficit: number;
    moves: { categoryId: string; budgetId: string; name: string; emoji: string; amount: number; originalLimit: number }[];
    remainingNeeded: number;
    freeMoneyBefore: number;
    freeMoneyAfter: number;
    remainingInvestment: number;
    investmentPossible: boolean;
  } | null>(null);

  // Automatic parsing of input text in real-time
  useEffect(() => {
    if (!budgets || !decisionText) return;
    const lower = decisionText.toLowerCase();

    // 1. Try to extract monetary value (e.g. R$ 1500, R$120, 50 reais, 50.00, etc.)
    const matchVal = decisionText.match(/(?:R\$)?\s*(\d+(?:[.,]\d{2})?)/i);
    if (matchVal) {
      const numStr = matchVal[1].replace(",", ".");
      const parsed = parseFloat(numStr);
      if (!isNaN(parsed) && parsed > 0) {
        setValInput(String(parsed));
      }
    }

    // 2. Try to match category name or keywords
    let matchedCatId = "";
    for (const b of budgets) {
      const catName = b.category.name.toLowerCase();
      if (lower.includes(catName)) {
        matchedCatId = b.category_id;
        break;
      }
    }

    if (!matchedCatId) {
      const keywordMap: Record<string, string[]> = {
        "alimentação": ["lanche", "pizza", "restaurante", "comer", "comida", "almoço", "jantar", "supermercado", "mercado", "mcdonald", "burger", "hamburguer", "iFood"],
        "lazer": ["jogo", "futebol", "cinema", "show", "viagem", "festa", "cerveja", "bar", "balada", "role", "rolê", "teatro", "evento", "ingresso"],
        "transporte": ["uber", "taxi", "gasolina", "combustível", "ônibus", "metro", "viagem", "pedágio", "carro"],
        "saúde": ["remédio", "farmácia", "médico", "consulta", "dentista", "plano", "hospital", "exame"],
        "educação": ["curso", "livro", "faculdade", "mensalidade", "escola", "inscrição"],
        "moradia": ["aluguel", "luz", "água", "internet", "gás", "condomínio", "casa"],
        "eletrônicos": ["monitor", "teclado", "mouse", "computador", "celular", "headset", "tecnologia"],
      };

      for (const [catName, keywords] of Object.entries(keywordMap)) {
        if (keywords.some((k) => lower.includes(k))) {
          const found = budgets.find((b) => b.category.name.toLowerCase().includes(catName));
          if (found) {
            matchedCatId = found.category_id;
            break;
          }
        }
      }
    }

    if (matchedCatId) {
      setSelectedCatId(matchedCatId);
    }
  }, [decisionText, budgets]);

  // Suggest quick pills
  const handlePillClick = (text: string) => {
    setDecisionText(text);
  };

  // Perform Simulation
  const handleSimulate = () => {
    if (!month || !budgets) return;

    const amount = parseFloat(valInput);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Informe um valor válido maior que zero.");
      return;
    }

    if (!selectedCatId) {
      toast.error("Selecione uma categoria para simular.");
      return;
    }

    const budget = budgets.find((b) => b.category_id === selectedCatId);
    if (!budget) {
      toast.error("Categoria não encontrada.");
      return;
    }

    const before = {
      limit: budget.current_limit,
      spent: budget.spent,
      remaining: budget.remaining,
    };

    const afterSpent = budget.spent + amount;
    const afterRemaining = budget.current_limit - afterSpent;
    const after = {
      limit: budget.current_limit,
      spent: afterSpent,
      remaining: afterRemaining,
    };

    // Determine status color state
    let status: "green" | "yellow" | "red" = "green";
    let statusText = "A decisão cabe no seu orçamento";

    const ratio = before.limit > 0 ? afterSpent / before.limit : 0;
    if (afterSpent > before.limit) {
      status = "red";
      statusText = "Passa do limite planejado";
    } else if (ratio >= 0.85) {
      status = "yellow";
      statusText = "Cabe, mas consome grande parte do limite";
    }

    const deficit = Math.max(0, afterSpent - before.limit);

    // Calculate moves if we exceeded the limit
    const moves: {
      categoryId: string;
      budgetId: string;
      name: string;
      emoji: string;
      amount: number;
      originalLimit: number;
    }[] = [];
    let remainingNeeded = deficit;

    if (status === "red" && deficit > 0) {
      // Find other categories with surplus, sorted by remaining descending
      const eligible = budgets
        .filter((b) => b.category_id !== selectedCatId && b.remaining > 0)
        .sort((a, b) => b.remaining - a.remaining);

      if (eligible.length > 0) {
        // Try to split the deficit between the top 2 if possible, or just the top 1
        const count = Math.min(2, eligible.length);
        const share = Math.ceil(deficit / count);

        for (let i = 0; i < count; i++) {
          const b = eligible[i];
          const amountToTake = Math.min(b.remaining, share);
          moves.push({
            categoryId: b.category_id,
            budgetId: b.id,
            name: b.category.name,
            emoji: b.category.emoji,
            amount: amountToTake,
            originalLimit: b.current_limit,
          });
          remainingNeeded -= amountToTake;
        }

        // If deficit is still not fully covered, take remaining from whatever is left
        if (remainingNeeded > 0) {
          for (const b of eligible) {
            const move = moves.find((m) => m.categoryId === b.category_id);
            const currentTaken = move ? move.amount : 0;
            const availableLeft = b.remaining - currentTaken;
            if (availableLeft > 0) {
              const additional = Math.min(availableLeft, remainingNeeded);
              if (move) {
                move.amount += additional;
              } else {
                moves.push({
                  categoryId: b.category_id,
                  budgetId: b.id,
                  name: b.category.name,
                  emoji: b.category.emoji,
                  amount: additional,
                  originalLimit: b.current_limit,
                });
              }
              remainingNeeded -= additional;
            }
            if (remainingNeeded <= 0) break;
          }
        }
      }
    }

    // Calculations of impact on free money and goals
    const totalRemaining = budgets.reduce((sum, b) => sum + b.remaining, 0);
    const freeMoneyBefore = month.available_balance - totalRemaining;
    const freeMoneyAfter = freeMoneyBefore - amount;

    // In Option A, remaining investment to be made is vault goal - actual reserved
    const remainingInvestment = Math.max(0, (vault?.investment_goal ?? 0) - month.reserved_investment);
    const investmentPossible = (month.available_balance - amount) >= remainingInvestment;

    setSimulationResult({
      categoryName: budget.category.name,
      categoryEmoji: budget.category.emoji,
      categoryId: budget.category_id,
      amount,
      before,
      after,
      status,
      statusText,
      deficit,
      moves,
      remainingNeeded,
      freeMoneyBefore,
      freeMoneyAfter,
      remainingInvestment,
      investmentPossible,
    });
  };

  // Mutation to apply adjustments in the database
  const applyAdjustmentMutation = useMutation({
    mutationFn: async (adjustments: { id: string; newLimit: number }[]) => {
      const supabase = createClient();
      const promises = adjustments.map((adj) =>
        supabase
          .from("monthly_category_budgets")
          .update({ current_limit: adj.newLimit })
          .eq("id", adj.id)
      );
      const results = await Promise.all(promises);
      for (const res of results) {
        if (res.error) throw new Error(res.error.message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.currentMonth });
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      toast.success("Ajuste de limites aplicado com sucesso para o mês atual!");
      setSimulationResult(null);
      setDecisionText("");
      setValInput("");
    },
    onError: (error: any) => {
      toast.error(`Falha ao aplicar ajuste: ${error.message}`);
    },
  });

  const handleApplyAdjustment = () => {
    if (!simulationResult || !budgets) return;

    const targetBudget = budgets.find((b) => b.category_id === simulationResult.categoryId);
    if (!targetBudget) return;

    // Target category gets increased by the deficit that was covered by donor moves
    const coveredAmount = simulationResult.deficit - simulationResult.remainingNeeded;
    const adjustments = [
      { id: targetBudget.id, newLimit: targetBudget.current_limit + coveredAmount },
      ...simulationResult.moves.map((m) => ({ id: m.budgetId, newLimit: m.originalLimit - m.amount })),
    ];

    applyAdjustmentMutation.mutate(adjustments);
  };

  if (!month || !budgets) return null;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Simulações"
        description="Teste uma decisão antes de gastar. Nada aqui altera seu orçamento."
      />

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left Column: Conversational Input & Optional Fields */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="border-border/40 bg-card">
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Sparkles className="size-4 text-primary" /> Planejamento de Decisão
              </CardTitle>
              <CardDescription className="text-xs">
                Descreva sua ideia e nós estimamos o impacto nos seus envelopes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Question Text Input */}
              <div className="space-y-2">
                <Label htmlFor="decision" className="text-xs font-semibold text-muted-foreground">
                  O que você está pensando em fazer?
                </Label>
                <Input
                  id="decision"
                  placeholder="Ex: Comprar um monitor de R$1500"
                  value={decisionText}
                  onChange={(e) => setDecisionText(e.target.value)}
                  className="text-xs"
                />
              </div>

              {/* Suggestion Quick Pills */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                  Exemplos rápidos:
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handlePillClick("Comprar um monitor de R$1500")}
                    className="text-[11px] px-2.5 py-1 rounded-full bg-accent/40 border border-border/10 hover:bg-accent/80 hover:border-border/30 transition text-muted-foreground hover:text-foreground"
                  >
                    📺 Comprar um monitor de R$1500
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePillClick("Sair para ver o jogo e gastar R$120")}
                    className="text-[11px] px-2.5 py-1 rounded-full bg-accent/40 border border-border/10 hover:bg-accent/80 hover:border-border/30 transition text-muted-foreground hover:text-foreground"
                  >
                    ⚽ Sair para ver o jogo e gastar R$120
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePillClick("Pedir um lanche de R$50")}
                    className="text-[11px] px-2.5 py-1 rounded-full bg-accent/40 border border-border/10 hover:bg-accent/80 hover:border-border/30 transition text-muted-foreground hover:text-foreground"
                  >
                    🍔 Pedir um lanche de R$50
                  </button>
                </div>
              </div>

              {/* Optional Fields Row */}
              <div className="pt-4 border-t border-border/10 space-y-4">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                  Informações da simulação (ajustadas automaticamente):
                </span>

                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Value */}
                  <div className="space-y-2">
                    <Label htmlFor="sim-value" className="text-xs">
                      Valor (R$)
                    </Label>
                    <div className="relative">
                      <DollarSign className="absolute left-2.5 top-2.5 size-3.5 text-muted-2" />
                      <Input
                        id="sim-value"
                        type="number"
                        placeholder="0.00"
                        value={valInput}
                        onChange={(e) => setValInput(e.target.value)}
                        className="pl-8 text-xs font-semibold tabular-nums"
                      />
                    </div>
                  </div>

                  {/* Date */}
                  <div className="space-y-2">
                    <Label htmlFor="sim-date" className="text-xs">
                      Data do Gasto
                    </Label>
                    <div className="relative">
                      <Calendar className="absolute left-2.5 top-2.5 size-3.5 text-muted-2" />
                      <Input
                        id="sim-date"
                        type="date"
                        value={dateInput}
                        onChange={(e) => setDateInput(e.target.value)}
                        className="pl-8 text-xs font-semibold"
                      />
                    </div>
                  </div>
                </div>

                {/* Category Dropdown */}
                <div className="space-y-2">
                  <Label htmlFor="sim-category" className="text-xs">
                    Categoria Afetada
                  </Label>
                  <Select value={selectedCatId} onValueChange={(v) => { if (v) setSelectedCatId(v); }}>
                    <SelectTrigger id="sim-category" className="text-xs w-full">
                      <SelectValue placeholder="Selecione a categoria..." />
                    </SelectTrigger>
                    <SelectContent>
                      {budgets.map((b) => (
                        <SelectItem key={b.category_id} value={b.category_id} className="text-xs">
                          <span className="mr-2">{b.category.emoji}</span>
                          {b.category.name} (resta: {formatCurrency(b.remaining)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Simulation trigger */}
              <Button onClick={handleSimulate} className="w-full gap-2 mt-2">
                <Play className="size-4" /> Simular Impacto
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Simulation Result & Impact Card */}
        <div className="lg:col-span-7 space-y-6">
          <AnimatePresence mode="wait">
            {simulationResult ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.96, height: "auto" }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                <Card className="border-border/40 bg-card overflow-hidden">
                  <CardHeader className="border-b border-border/10 pb-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{simulationResult.categoryEmoji}</span>
                        <div>
                          <CardTitle className="text-sm font-semibold">
                            Impacto em {simulationResult.categoryName}
                          </CardTitle>
                          <CardDescription className="text-xs">
                            Análise do impacto financeiro do gasto de {formatCurrency(simulationResult.amount)}.
                          </CardDescription>
                        </div>
                      </div>
                      <span
                        className={cn(
                          "text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border",
                          simulationResult.status === "green" && "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                          simulationResult.status === "yellow" && "bg-amber-500/10 text-amber-400 border-amber-500/20",
                          simulationResult.status === "red" && "bg-rose-500/10 text-rose-400 border-rose-500/20"
                        )}
                      >
                        {simulationResult.statusText}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    {/* Before vs After stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 rounded-xl bg-accent/20 border border-border/10">
                      <div>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                          Antes da Decisão
                        </span>
                        <dl className="mt-2 space-y-1 text-xs">
                          <div className="flex justify-between">
                            <dt className="text-muted-foreground">Limite:</dt>
                            <dd className="font-semibold tabular-nums">{formatCurrency(simulationResult.before.limit)}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-muted-foreground">Gasto:</dt>
                            <dd className="font-semibold tabular-nums">{formatCurrency(simulationResult.before.spent)}</dd>
                          </div>
                          <div className="flex justify-between border-t border-border/10 pt-1 font-medium">
                            <dt className="text-emerald-400">Resta:</dt>
                            <dd className="text-emerald-400 tabular-nums">{formatCurrency(simulationResult.before.remaining)}</dd>
                          </div>
                        </dl>
                      </div>

                      <div className="border-t sm:border-t-0 sm:border-l border-border/10 pt-4 sm:pt-0 sm:pl-6">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                          Depois da Decisão
                        </span>
                        <dl className="mt-2 space-y-1 text-xs">
                          <div className="flex justify-between">
                            <dt className="text-muted-foreground">Novo Gasto:</dt>
                            <dd className="font-semibold tabular-nums">{formatCurrency(simulationResult.after.spent)}</dd>
                          </div>
                          <div className="flex justify-between border-t border-border/10 pt-1 font-medium">
                            <dt className={simulationResult.after.remaining >= 0 ? "text-emerald-400" : "text-rose-400"}>
                              Resta Livre:
                            </dt>
                            <dd className={cn("tabular-nums font-semibold", simulationResult.after.remaining >= 0 ? "text-emerald-400" : "text-rose-400")}>
                              {formatCurrency(simulationResult.after.remaining)}
                            </dd>
                          </div>
                        </dl>
                      </div>
                    </div>

                    {/* Progress Bar Visual */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-semibold text-muted-foreground">
                        <span>Uso do Limite</span>
                        <span>
                          {simulationResult.before.limit > 0
                            ? Math.round((simulationResult.after.spent / simulationResult.before.limit) * 100)
                            : 0}
                          %
                        </span>
                      </div>
                      <div className="h-2.5 w-full bg-accent/30 rounded-full overflow-hidden border border-border/10 relative">
                        {/* Current spent */}
                        <div
                          className="h-full bg-primary/70 transition-all duration-500 absolute left-0"
                          style={{
                            width: `${Math.min(
                              100,
                              (simulationResult.before.spent / Math.max(1, simulationResult.before.limit)) * 100
                            )}%`,
                          }}
                        />
                        {/* Simulated amount */}
                        <div
                          className={cn(
                            "h-full transition-all duration-500 absolute",
                            simulationResult.status === "green" && "bg-emerald-400",
                            simulationResult.status === "yellow" && "bg-amber-400",
                            simulationResult.status === "red" && "bg-rose-400"
                          )}
                          style={{
                            left: `${Math.min(
                              100,
                              (simulationResult.before.spent / Math.max(1, simulationResult.before.limit)) * 100
                            )}%`,
                            width: `${Math.min(
                              100 - (simulationResult.before.spent / Math.max(1, simulationResult.before.limit)) * 100,
                              (simulationResult.amount / Math.max(1, simulationResult.before.limit)) * 100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Red state suggestions (Redistribution) */}
                    {simulationResult.status === "red" && (
                      <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 space-y-4">
                        <div className="flex gap-2.5 items-start">
                          <AlertTriangle className="size-4 text-rose-400 shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <h4 className="text-xs font-bold text-rose-400">Limite da categoria excedido!</h4>
                            <p className="text-xs text-muted-foreground">
                              Esta decisão estoura a categoria em{" "}
                              <strong className="text-rose-400 font-semibold tabular-nums">
                                {formatCurrency(simulationResult.deficit)}
                              </strong>
                              .
                            </p>
                          </div>
                        </div>

                        {simulationResult.moves.length > 0 ? (
                          <div className="pt-3 border-t border-rose-500/10 space-y-3">
                            <p className="text-xs text-muted-foreground">
                              💡 <strong>Sugestão de remanejamento para caber no orçamento:</strong>
                            </p>
                            <div className="bg-background/40 border border-border/10 p-3 rounded-lg space-y-2 text-xs">
                              {simulationResult.moves.map((m) => (
                                <div key={m.categoryId} className="flex justify-between items-center text-muted-foreground">
                                  <span className="flex items-center gap-1.5">
                                    <span>{m.emoji}</span>
                                    <span>Retirar de {m.name}:</span>
                                  </span>
                                  <span className="font-semibold text-rose-400 tabular-nums">
                                    − {formatCurrency(m.amount)}
                                  </span>
                                </div>
                              ))}
                              {simulationResult.remainingNeeded > 0 && (
                                <p className="text-[11px] text-rose-400/80 pt-1 border-t border-border/10">
                                  Atenção: Sobram apenas R${" "}
                                  {(simulationResult.deficit - simulationResult.remainingNeeded).toFixed(2)} nas outras
                                  categorias. Você ainda precisará de mais R${" "}
                                  {simulationResult.remainingNeeded.toFixed(2)} para caber inteiramente.
                                </p>
                              )}
                            </div>

                            {/* Before/After list for category limits */}
                            <div className="space-y-1.5 text-xs text-muted-foreground pl-1">
                              <p className="font-medium text-foreground/80">Novos limites propostos:</p>
                              {/* Target Category */}
                              <div className="flex justify-between items-center">
                                <span className="flex items-center gap-1">
                                  <span>{simulationResult.categoryEmoji}</span>
                                  <span>{simulationResult.categoryName} (receptora):</span>
                                </span>
                                <span className="tabular-nums font-semibold text-emerald-400">
                                  {formatCurrency(simulationResult.before.limit)} ➔{" "}
                                  {formatCurrency(
                                    simulationResult.before.limit +
                                      (simulationResult.deficit - simulationResult.remainingNeeded)
                                  )}
                                </span>
                              </div>
                              {/* Donors */}
                              {simulationResult.moves.map((m) => (
                                <div key={m.categoryId} className="flex justify-between items-center">
                                  <span className="flex items-center gap-1">
                                    <span>{m.emoji}</span>
                                    <span>{m.name}:</span>
                                  </span>
                                  <span className="tabular-nums">
                                    {formatCurrency(m.originalLimit)} ➔{" "}
                                    {formatCurrency(m.originalLimit - m.amount)}
                                  </span>
                                </div>
                              ))}
                            </div>

                            <Button
                              onClick={handleApplyAdjustment}
                              disabled={applyAdjustmentMutation.isPending}
                              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white mt-1 gap-2"
                              size="sm"
                            >
                              <Check className="size-4" /> Aplicar ajuste neste mês
                            </Button>
                          </div>
                        ) : (
                          <p className="text-[11px] text-rose-400/80 border-t border-rose-500/10 pt-2">
                            ⚠️ Não há saldo restante em nenhuma outra categoria para sugerir um remanejamento neste mês.
                          </p>
                        )}
                      </div>
                    )}

                    {/* Impact on Goals & Investments */}
                    <div className="pt-4 border-t border-border/10 space-y-4">
                      <h4 className="text-xs font-bold text-foreground/80 flex items-center gap-1.5">
                        <TrendingUp className="size-4 text-primary" /> Impacto nas Metas Gerais
                      </h4>

                      <div className="grid gap-4 sm:grid-cols-2 text-xs">
                        {/* Free Money */}
                        <div className="p-3 rounded-lg border border-border/10 bg-accent/10 space-y-2">
                          <span className="text-muted-foreground block font-medium">Dinheiro Livre</span>
                          <div className="flex justify-between items-baseline font-semibold tabular-nums mt-1">
                            <span className="text-muted-foreground text-[10px]">
                              Antes: {formatCurrency(simulationResult.freeMoneyBefore)}
                            </span>
                            <span className={simulationResult.freeMoneyAfter >= 0 ? "text-emerald-400 text-sm" : "text-rose-400 text-sm"}>
                              Depois: {formatCurrency(simulationResult.freeMoneyAfter)}
                            </span>
                          </div>
                          <p className="text-[10px] text-muted-foreground leading-relaxed">
                            {simulationResult.freeMoneyAfter >= 0
                              ? "Você ainda terminará o mês com saldo positivo fora das categorias planejadas."
                              : "Essa decisão fará você consumir dinheiro que estaria livre no fim do mês."}
                          </p>
                        </div>

                        {/* Investments viability */}
                        <div className="p-3 rounded-lg border border-border/10 bg-accent/10 space-y-2">
                          <span className="text-muted-foreground block font-medium">Aporte Planejado</span>
                          <div className="flex items-center gap-1.5 mt-1 font-semibold text-xs">
                            {simulationResult.investmentPossible ? (
                              <span className="text-emerald-400 flex items-center gap-1">
                                <Check className="size-3.5" /> Garantido
                              </span>
                            ) : (
                              <span className="text-amber-400 flex items-center gap-1">
                                <AlertTriangle className="size-3.5" /> Sob risco
                              </span>
                            )}
                            <span className="text-[10px] text-muted-foreground font-normal tabular-nums">
                              (restam R$ {simulationResult.remainingInvestment.toFixed(2)})
                            </span>
                          </div>
                          <p className="text-[10px] text-muted-foreground leading-relaxed">
                            {simulationResult.investmentPossible
                              ? "O seu saldo disponível continua suficiente para realizar o aporte planejado."
                              : "Seu disponível cairá abaixo da meta de investimentos restante do mês."}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center h-full text-center space-y-4 p-8 border border-dashed border-border/30 rounded-2xl bg-accent/5 min-h-[300px]"
              >
                <div className="size-12 rounded-2xl bg-accent/20 flex items-center justify-center text-muted-foreground/60 border border-border/10">
                  <HelpCircle className="size-6" />
                </div>
                <div className="space-y-1 max-w-[280px]">
                  <h3 className="text-sm font-semibold text-foreground/80">Aguardando Decisão</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Escreva o gasto que está planejando no formulário ao lado para simularmos o impacto.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Info Alert footer */}
      <div className="flex gap-2 items-start text-[11px] text-muted-foreground max-w-2xl bg-accent/20 p-3 rounded-lg border border-border/10">
        <Info className="size-4 text-muted-2 shrink-0 mt-0.5" />
        <span>
          Aviso: Nenhuma simulação ou valor alterado nesta aba afeta seus dados reais no banco de dados, exceto se você
          utilizar a opção explícita de "Aplicar ajuste de limites" sugerida em simulações que ultrapassem os limites.
        </span>
      </div>
    </div>
  );
}
