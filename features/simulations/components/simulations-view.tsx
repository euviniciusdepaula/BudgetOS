"use client";

import { useEffect, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Sparkles,
  Sliders,
  RefreshCw,
  Send,
  Loader2,
  Bot,
  User,
  ArrowRight,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/layout/page-header";
import { useCurrentMonth } from "@/hooks/use-current-month";
import { useBudgets } from "@/hooks/use-budgets";
import { formatCurrency } from "@/utils/format";
import { cn } from "@/lib/utils";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export function SimulationsView() {
  const { data: month } = useCurrentMonth();
  const { data: budgets } = useBudgets(month?.id);

  // Manual simulation state: holds current limit overrides
  const [simulatedLimits, setSimulatedLimits] = useState<Record<string, number>>({});
  
  // AI Simulation Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  // Sync simulated limits when budgets are loaded
  useEffect(() => {
    if (budgets) {
      const initial: Record<string, number> = {};
      for (const b of budgets) {
        initial[b.id] = b.current_limit;
      }
      setSimulatedLimits(initial);
    }
  }, [budgets]);

  // Calculations
  const calculations = useMemo(() => {
    if (!month || !budgets) {
      return { originalTotal: 0, simulatedTotal: 0, difference: 0, newAvailable: 0 };
    }

    const originalTotal = budgets.reduce((sum, b) => sum + b.current_limit, 0);
    const simulatedTotal = budgets.reduce((sum, b) => sum + (simulatedLimits[b.id] ?? b.current_limit), 0);
    const difference = simulatedTotal - originalTotal;
    const newAvailable = Math.max(0, month.available_balance - difference);

    return {
      originalTotal,
      simulatedTotal,
      difference,
      newAvailable,
    };
  }, [month, budgets, simulatedLimits]);

  const handleSliderChange = (budgetId: string, value: number) => {
    setSimulatedLimits((prev) => ({
      ...prev,
      [budgetId]: value,
    }));
  };

  const handleReset = () => {
    if (budgets) {
      const initial: Record<string, number> = {};
      for (const b of budgets) {
        initial[b.id] = b.current_limit;
      }
      setSimulatedLimits(initial);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || chatLoading || !month) return;

    const userMsg = inputMessage;
    setInputMessage("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setChatLoading(true);

    try {
      const res = await fetch("/api/simulacoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg, monthId: month.id }),
      });

      if (!res.ok) {
        throw new Error("Erro ao gerar simulação.");
      }

      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "⚠️ Ocorreu um erro ao conectar com o simulador de IA. Por favor, tente novamente.",
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  if (!month || !budgets) return null;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Simulações"
        description="Ambiente de testes para o seu orçamento. Suas ações aqui não alteram seus dados reais."
      />

      {/* Main split workspace */}
      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left Column: Manual Limits Shifting */}
        <div className="lg:col-span-6 space-y-6">
          <Card className="border-border/40">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Sliders className="size-4 text-primary" /> Simulador Manual
                </CardTitle>
                <CardDescription className="text-xs">Remaneje limites e acompanhe o impacto real.</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={handleReset} className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground">
                <RefreshCw className="size-3.5" /> Resetar
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Display Simulation Summary */}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-accent/20 border border-border/10">
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Original Disponível</p>
                  <p className="text-lg font-bold tabular-nums mt-0.5">{formatCurrency(month.available_balance)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Simulado Disponível</p>
                  <p className={cn(
                    "text-lg font-bold tabular-nums mt-0.5 transition-colors",
                    calculations.newAvailable < month.available_balance ? "text-amber-400" : calculations.newAvailable > month.available_balance ? "text-emerald-400" : "text-foreground"
                  )}>
                    {formatCurrency(calculations.newAvailable)}
                  </p>
                </div>
                {calculations.difference !== 0 && (
                  <div className="col-span-2 pt-2 border-t border-border/10 text-xs flex justify-between items-center text-muted-foreground">
                    <span>Variação de limites:</span>
                    <span className={cn("font-semibold tabular-nums", calculations.difference > 0 ? "text-amber-400" : "text-emerald-400")}>
                      {calculations.difference > 0 ? `+${formatCurrency(calculations.difference)}` : formatCurrency(calculations.difference)}
                    </span>
                  </div>
                )}
              </div>

              {/* Sliders list */}
              <div className="space-y-6 max-h-[420px] overflow-y-auto pr-1">
                {budgets.map((b) => {
                  const currentValue = simulatedLimits[b.id] ?? b.current_limit;
                  const diff = currentValue - b.current_limit;
                  
                  return (
                    <div key={b.id} className="space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{b.category.emoji}</span>
                          <span className="font-semibold text-foreground/80">{b.category.name}</span>
                        </div>
                        <div className="flex items-center gap-2 tabular-nums">
                          <span className="text-muted-foreground">R$ {currentValue.toFixed(0)}</span>
                          {diff !== 0 && (
                            <span className={cn(
                              "text-[10px] font-bold px-1.5 py-0.5 rounded",
                              diff > 0 ? "bg-amber-500/10 text-amber-400" : "bg-emerald-500/10 text-emerald-400"
                            )}>
                              {diff > 0 ? `+${diff.toFixed(0)}` : diff.toFixed(0)}
                            </span>
                          )}
                        </div>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max={Math.max(10000, b.current_limit * 3)}
                        step="50"
                        value={currentValue}
                        onChange={(e) => handleSliderChange(b.id, Number(e.target.value))}
                        className="w-full h-1.5 bg-accent/60 rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: AI Co-pilot simulation */}
        <div className="lg:col-span-6 space-y-6">
          <Card className="border-border/40 flex flex-col h-[585px]">
            <CardHeader className="pb-3 border-b border-border/10">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Sparkles className="size-4 text-primary animate-pulse" /> Simulador de Decisões IA
              </CardTitle>
              <CardDescription className="text-xs">
                Pergunte coisas como "Posso comprar um monitor de R$1500?" ou "E se eu viajar em Setembro?".
              </CardDescription>
            </CardHeader>
            
            {/* Messages body */}
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-3 px-4">
                  <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Bot className="size-5" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground/80">Simulador de Decisões Financeiras</h3>
                  <p className="text-xs text-muted-foreground max-w-[280px] leading-relaxed">
                    Nossa inteligência vai simular a transação, identificar o impacto nos seus limites e propor alternativas antes de você gastar.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((m, index) => (
                    <div
                      key={index}
                      className={cn(
                        "flex gap-3 max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed",
                        m.role === "user"
                          ? "bg-primary text-primary-foreground ml-auto rounded-tr-none"
                          : "bg-accent/30 text-foreground mr-auto rounded-tl-none border border-border/10"
                      )}
                    >
                      {m.role === "assistant" && (
                        <Sparkles className="size-4 text-primary shrink-0 mt-0.5" />
                      )}
                      <div className="space-y-2 whitespace-pre-line overflow-x-auto">
                        {m.content}
                      </div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="flex gap-3 max-w-[85%] bg-accent/30 rounded-2xl rounded-tl-none border border-border/10 px-4 py-3 text-xs mr-auto">
                      <Loader2 className="size-4 text-primary shrink-0 animate-spin" />
                      <span className="text-muted-foreground">Simulando cenários...</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>

            {/* Input form */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-border/10 flex gap-2">
              <Input
                placeholder="Ex.: Posso comprar uma moto de R$ 9.000?"
                value={inputMessage}
                disabled={chatLoading}
                onChange={(e) => setInputMessage(e.target.value)}
                className="flex-1 text-xs"
              />
              <Button type="submit" size="icon" disabled={!inputMessage.trim() || chatLoading} className="rounded-xl">
                <Send className="size-3.5" />
              </Button>
            </form>
          </Card>
        </div>
      </div>
      
      <div className="flex gap-2 items-start text-[11px] text-muted-foreground max-w-2xl bg-accent/20 p-3 rounded-lg border border-border/10">
        <AlertCircle className="size-4 text-muted-2 shrink-0 mt-0.5" />
        <span>
          Aviso: Nenhuma alteração feita nesta aba afetará seus dados permanentes. Todo o progresso e simulações de limites serão redefinidos ao atualizar ou fechar a página.
        </span>
      </div>
    </div>
  );
}
