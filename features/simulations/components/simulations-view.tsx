"use client";

import { useState, useEffect, useMemo } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  AlertTriangle,
  HelpCircle,
  TrendingDown,
  Info,
  Check,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/layout/page-header";
import { useCurrentMonth } from "@/hooks/use-current-month";
import { useBudgets } from "@/hooks/use-budgets";
import { formatCurrency } from "@/utils/format";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/query-keys";
import { toast } from "sonner";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { round2 } from "@/lib/finance";

export function SimulationsView() {
  const queryClient = useQueryClient();
  const { data: month } = useCurrentMonth();
  const { data: budgets } = useBudgets(month?.id);

  // Conversational decision text input
  const [decisionText, setDecisionText] = useState("");
  const [valInput, setValInput] = useState("");
  const [selectedCatId, setSelectedCatId] = useState("");
  const [showCategorySelector, setShowCategorySelector] = useState(false);

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
    freeMoneyBefore: number;
    freeMoneyAfter: number;
  } | null>(null);

  // 1. Natural Language Parser (Value & Category extraction in real-time)
  useEffect(() => {
    if (!budgets || !decisionText) {
      setValInput("");
      setSelectedCatId("");
      return;
    }
    const lower = decisionText.toLowerCase();

    // Value parsing (Extracts numbers after R$, $, or just floating numbers like 302, 120.50, 500)
    const matchVal = decisionText.match(/(?:R\$)?\s*(\d+(?:[.,]\d{2})?)/i);
    if (matchVal) {
      const numStr = matchVal[1].replace(",", ".");
      const parsed = parseFloat(numStr);
      if (!isNaN(parsed) && parsed > 0) {
        setValInput(String(parsed));
      } else {
        setValInput("");
      }
    } else {
      setValInput("");
    }

    // Category parsing (Match exact name or known financial keywords)
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
        "alimentação": ["lanche", "pizza", "restaurante", "comer", "comida", "almoço", "jantar", "supermercado", "mercado", "mcdonald", "burger", "hamburguer", "ifood", "janta", "marmita", "marmitas"],
        "lazer": ["jogo", "futebol", "cinema", "show", "viagem", "festa", "cerveja", "bar", "balada", "role", "rolê", "teatro", "evento", "ingresso", "churrasco", "ingresso", "copo"],
        "transporte": ["uber", "taxi", "gasolina", "combustível", "ônibus", "metro", "viagem", "pedágio", "carro", "moto", "99taxi", "passagem"],
        "saúde": ["remédio", "farmácia", "médico", "consulta", "dentista", "plano", "hospital", "exame", "drogaria", "remédios"],
        "educação": ["curso", "livro", "faculdade", "mensalidade", "escola", "inscrição", "mensalidade", "estudo"],
        "moradia": ["aluguel", "luz", "água", "internet", "gás", "condomínio", "casa", "energia"],
        "eletrônicos": ["monitor", "teclado", "mouse", "computador", "celular", "headset", "tecnologia", "hardware", "placa"],
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
    } else {
      // If we couldn't match, keep previous selection only if it was selected manually
      if (!showCategorySelector) {
        setSelectedCatId("");
      }
    }
  }, [decisionText, budgets]);

  // 2. Real-time Simulation Engine
  useEffect(() => {
    if (!month || !budgets) return;

    const amount = parseFloat(valInput);
    if (isNaN(amount) || amount <= 0 || !selectedCatId) {
      setSimulationResult(null);
      return;
    }

    const budget = budgets.find((b) => b.category_id === selectedCatId);
    if (!budget) {
      setSimulationResult(null);
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

    let status: "green" | "yellow" | "red" = "green";
    let statusText = "Cabe no orçamento";
    const ratio = before.limit > 0 ? afterSpent / before.limit : 0;

    if (afterSpent > before.limit) {
      status = "red";
      statusText = "Excede o limite";
    } else if (ratio >= 0.85) {
      status = "yellow";
      statusText = "Perto do limite";
    }

    const deficit = Math.max(0, afterSpent - before.limit);

    const totalRemaining = budgets.reduce((sum, b) => sum + Math.max(0, b.remaining), 0);
    const freeMoneyBefore = month.available_balance - totalRemaining;
    const freeMoneyAfter = freeMoneyBefore - amount;

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
      freeMoneyBefore,
      freeMoneyAfter,
    });
  }, [valInput, selectedCatId, month, budgets]);

  // Suggest pills click
  const handlePillClick = (text: string) => {
    setDecisionText(text);
  };

  // Mutation to register the real expense directly from the simulation
  const registerExpenseMutation = useMutation({
    mutationFn: async () => {
      if (!simulationResult || !month || !budgets) return;
      const supabase = createClient();

      const todayStr = new Date().toISOString().split("T")[0];
      const desc = decisionText || `Simulado: Gasto em ${simulationResult.categoryName}`;

      // 1. Insert transaction
      const { error: txErr } = await supabase.from("transactions").insert({
        month_id: month.id,
        category_id: simulationResult.categoryId,
        type: "expense",
        amount: simulationResult.amount,
        description: desc,
        date: todayStr,
        source: "manual",
      });
      if (txErr) throw new Error(txErr.message);

      // 2. Update category budget's spent value
      const targetBudget = budgets.find((b) => b.category_id === simulationResult.categoryId);
      if (targetBudget) {
        const newSpent = round2(targetBudget.spent + simulationResult.amount);
        const { error: budgErr } = await supabase
          .from("monthly_category_budgets")
          .update({ spent: newSpent })
          .eq("id", targetBudget.id);
        if (budgErr) throw new Error(budgErr.message);
      }

      // 3. Update month's bank balance and available balance
      const newBankBalance = round2(month.bank_balance - simulationResult.amount);
      const newAvailable = round2(month.available_balance - simulationResult.amount);
      const { error: monthErr } = await supabase
        .from("months")
        .update({
          bank_balance: newBankBalance,
          available_balance: newAvailable,
        })
        .eq("id", month.id);
      if (monthErr) throw new Error(monthErr.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.currentMonth });
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      toast.success("Gasto registrado no seu orçamento!");
      setDecisionText("");
      setValInput("");
      setSimulationResult(null);
    },
    onError: (error: any) => {
      toast.error(`Falha ao registrar gasto: ${error.message}`);
    },
  });

  const handleRegisterExpense = () => {
    if (!simulationResult) return;
    registerExpenseMutation.mutate();
  };

  if (!month || !budgets) return null;

  // Usage percentage calculated
  const usagePercent = simulationResult && simulationResult.before.limit > 0
    ? Math.round((simulationResult.after.spent / simulationResult.before.limit) * 100)
    : 0;

  return (
    <div className="space-y-6 max-w-lg mx-auto md:max-w-4xl pb-[72px] md:pb-0">
      <PageHeader
        title="Simular Gasto"
        description="Teste uma decisão antes de gastar para entender o impacto no seu orçamento."
      />

      <div className="grid gap-6 md:grid-cols-12 items-start">
        {/* Left/Main Area: Conversational simulator */}
        <div className="md:col-span-6 space-y-4">
          <Card className="border-border/40 bg-card rounded-[24px]">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Sparkles className="size-4 text-primary" /> Planejador Conversacional
              </CardTitle>
              <CardDescription className="text-xs">
                Descreva sua ideia e analisaremos os valores e a categoria correspondente.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Question Label & Chat input field */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                  O que você está pensando em fazer?
                </label>
                <Input
                  placeholder="Ex: Comprar 20 marmitas por R$302"
                  value={decisionText}
                  onChange={(e) => setDecisionText(e.target.value)}
                  className="text-xs p-5 rounded-[16px] bg-accent/15 border-border/30 placeholder:text-muted-foreground/60 focus:ring-primary/20"
                />
              </div>

              {/* Suggestions quick pill links */}
              <div className="space-y-1.5">
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">
                  Ideias rápidas:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => handlePillClick("Pedir um ifood de R$85")}
                    className="text-[10px] px-3 py-1.5 rounded-full bg-accent/20 border border-border/10 hover:bg-accent/40 text-muted-foreground hover:text-foreground transition-all"
                  >
                    🍔 iFood por R$85
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePillClick("Comprar monitor por R$1500")}
                    className="text-[10px] px-3 py-1.5 rounded-full bg-accent/20 border border-border/10 hover:bg-accent/40 text-muted-foreground hover:text-foreground transition-all"
                  >
                    📺 Monitor por R$1500
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePillClick("Sair com amigos e gastar R$120 no lazer")}
                    className="text-[10px] px-3 py-1.5 rounded-full bg-accent/20 border border-border/10 hover:bg-accent/40 text-muted-foreground hover:text-foreground transition-all"
                  >
                    🍻 Lazer por R$120
                  </button>
                </div>
              </div>

              {/* Fallback Selector for Category and Value (shown if parsed successfully or editable) */}
              {valInput && (
                <div className="pt-3 border-t border-border/10 space-y-3">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      Valor detectado:{" "}
                      <strong className="text-foreground font-semibold tabular-nums">
                        {formatCurrency(parseFloat(valInput))}
                      </strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowCategorySelector(!showCategorySelector)}
                      className="text-primary hover:underline font-semibold flex items-center gap-0.5 text-[11px]"
                    >
                      Categoria: {selectedCatId ? budgets.find(b => b.category_id === selectedCatId)?.category.name : "Nenhuma"} <ChevronDown className="size-3" />
                    </button>
                  </div>

                  {showCategorySelector && (
                    <div className="space-y-1.5">
                      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">
                        Selecione a Categoria Manualmente:
                      </span>
                      <Select value={selectedCatId} onValueChange={(v) => { if (v) { setSelectedCatId(v); setShowCategorySelector(false); } }}>
                        <SelectTrigger className="text-xs rounded-xl w-full">
                          <SelectValue placeholder="Escolha a categoria..." />
                        </SelectTrigger>
                        <SelectContent>
                          {budgets.map((b) => (
                            <SelectItem key={b.category_id} value={b.category_id} className="text-xs">
                              <span className="mr-2">{b.category.emoji}</span>
                              {b.category.name} (Resta: {formatCurrency(b.remaining)})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Area: Dynamic Real-time Output / Results */}
        <div className="md:col-span-6">
          <AnimatePresence mode="wait">
            {simulationResult ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <Card className="border-border/40 bg-card rounded-[24px] overflow-hidden">
                  <div className="p-5 space-y-4">
                    {/* Header */}
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl leading-none">{simulationResult.categoryEmoji}</span>
                        <div>
                          <h4 className="text-sm font-bold text-foreground">
                            {simulationResult.categoryName}
                          </h4>
                          <span className="text-[10px] text-muted-foreground font-semibold">
                            Simulação de compra
                          </span>
                        </div>
                      </div>

                      <span
                        className={cn(
                          "text-[9px] font-bold uppercase tracking-wider px-2.5 py-0.8 rounded-full border",
                          simulationResult.status === "green" && "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                          simulationResult.status === "yellow" && "bg-amber-500/10 text-amber-400 border-amber-500/20",
                          simulationResult.status === "red" && "bg-rose-500/10 text-rose-400 border-rose-500/20"
                        )}
                      >
                        {simulationResult.statusText}
                      </span>
                    </div>

                    {/* Stats Gasto atual -> Gasto depois */}
                    <div className="grid grid-cols-2 gap-4 py-3 border-t border-b border-border/10 text-xs">
                      <div>
                        <span className="text-[9px] text-muted-foreground block uppercase font-bold tracking-wider mb-0.5">
                          Gasto Atual
                        </span>
                        <span className="font-semibold tabular-nums text-foreground/80">
                          {formatCurrency(simulationResult.before.spent)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] text-muted-foreground block uppercase font-bold tracking-wider mb-0.5">
                          Pós-Compra
                        </span>
                        <span className={cn("font-bold tabular-nums", simulationResult.status === "red" ? "text-rose-400" : "text-foreground")}>
                          {formatCurrency(simulationResult.after.spent)}
                        </span>
                      </div>
                    </div>

                    {/* Sobra no limite */}
                    <div className="flex justify-between items-center text-xs">
                      <div>
                        <span className="text-[9px] text-muted-foreground block uppercase font-bold tracking-wider mb-0.5">
                          Quanto sobra no limite
                        </span>
                        <span
                          className={cn(
                            "text-base font-bold tabular-nums tracking-tight",
                            simulationResult.status === "red" ? "text-rose-400" : "text-primary"
                          )}
                        >
                          {formatCurrency(simulationResult.after.remaining)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] text-muted-foreground block uppercase font-bold tracking-wider mb-0.5">
                          Consumo Limite
                        </span>
                        <span className={cn("font-bold tabular-nums text-sm", simulationResult.status === "red" && "text-rose-400")}>
                          {usagePercent}%
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <Progress
                      value={Math.min(usagePercent, 100)}
                      className={cn(
                        "h-2 bg-accent",
                        simulationResult.status === "red" && "bg-rose-500/10"
                      )}
                    />

                    {/* Exceeded limit alert */}
                    {simulationResult.status === "red" && (
                      <div className="p-3.5 rounded-[16px] border border-rose-500/20 bg-rose-500/5 text-xs flex gap-2.5 items-start">
                        <AlertTriangle className="size-4 text-rose-400 shrink-0 mt-0.5" />
                        <div className="space-y-0.5">
                          <p className="font-bold text-rose-400 leading-none">Atenção: Passa do limite planejado</p>
                          <p className="text-[11px] text-muted-foreground leading-relaxed mt-1">
                            Este gasto estoura o envelope da categoria em{" "}
                            <strong className="text-rose-400 font-bold tabular-nums">
                              {formatCurrency(simulationResult.deficit)}
                            </strong>
                            .
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="pt-2">
                      <Button
                        onClick={handleRegisterExpense}
                        disabled={registerExpenseMutation.isPending}
                        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-[16px] font-bold text-xs h-11 shadow-lg shadow-emerald-500/10 gap-1.5 transition-all"
                      >
                        <Check className="size-4" /> Registrar esse gasto
                      </Button>
                    </div>
                  </div>
                </Card>

                {/* Free money warning */}
                {simulationResult.freeMoneyAfter < 0 && (
                  <div className="p-3.5 rounded-[16px] border border-amber-500/20 bg-amber-500/5 text-xs flex gap-2.5 items-start">
                    <TrendingDown className="size-4 text-amber-400 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <p className="font-bold text-amber-400 leading-none">Consumo de Dinheiro Livre</p>
                      <p className="text-[11px] text-muted-foreground leading-relaxed mt-1">
                        Essa decisão fará você consumir dinheiro que estaria livre no fim do mês (Dinheiro Livre residual ficará negativo).
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center h-full text-center space-y-4 p-8 border border-dashed border-border/30 rounded-[24px] bg-accent/5 min-h-[220px]"
              >
                <div className="size-11 rounded-2xl bg-accent/20 flex items-center justify-center text-muted-foreground/60 border border-border/10">
                  <HelpCircle className="size-5" />
                </div>
                <div className="space-y-1 max-w-[240px]">
                  <h3 className="text-xs font-semibold text-foreground/80">Simulador de Decisão</h3>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Digite sua ideia no formulário ao lado para calcular o impacto nas suas categorias instantaneamente.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Info Callout */}
      <div className="flex gap-2 items-start text-[10px] text-muted-foreground max-w-xl bg-accent/10 p-3 rounded-lg border border-border/10 mx-auto">
        <Info className="size-3.5 text-muted-2 shrink-0 mt-0.5" />
        <span>
          O simulador serve para te apoiar a tomar decisões de gastos antes de efetuá-los. Nenhuma ação simulada altera seus dados reais, a menos que você clique em "Registrar esse gasto".
        </span>
      </div>
    </div>
  );
}
