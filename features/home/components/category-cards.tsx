"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/format";
import type { BudgetWithCategory } from "@/types/domain";

/** Interpola linearmente entre duas cores hex. */
function lerpColor(from: string, to: string, t: number): string {
  const a = from.match(/\w\w/g)!.map((h) => parseInt(h, 16));
  const b = to.match(/\w\w/g)!.map((h) => parseInt(h, 16));
  const mix = a.map((v, i) => Math.round(v + (b[i] - v) * t));
  return `rgb(${mix[0]}, ${mix[1]}, ${mix[2]})`;
}

const GREEN = "63d471";
const YELLOW = "facc15";
const ORANGE = "f5a524";
const RED = "ff6b6b";

/** Verde → amarelo → laranja → vermelho, sem saltos, conforme o uso. */
function barColor(ratio: number): string {
  if (ratio <= 0.5) return `#${GREEN}`;
  if (ratio <= 0.7) return lerpColor(GREEN, YELLOW, (ratio - 0.5) / 0.2);
  if (ratio <= 0.85) return lerpColor(YELLOW, ORANGE, (ratio - 0.7) / 0.15);
  if (ratio <= 1) return lerpColor(ORANGE, RED, (ratio - 0.85) / 0.15);
  return `#${RED}`;
}

function getAiTip(categoryName: string, ratio: number, remaining: number, hidden: boolean): string {
  const formattedRemaining = hidden ? "R$ ••••" : formatCurrency(remaining);
  if (ratio > 1) {
    return `Dica IA: Cuidado! O limite foi ultrapassado. Evite novos gastos em ${categoryName} se possível.`;
  }
  if (ratio >= 0.85) {
    return `Dica IA: Quase lá! Você já usou ${Math.round(ratio * 100)}% de ${categoryName}. Restam ${formattedRemaining}.`;
  }
  if (ratio > 0.5) {
    return `Dica IA: Ritmo moderado. Mantendo a média, você terminará o mês dentro do planejado.`;
  }
  return `Dica IA: Excelente controle! Você costuma fechar o mês com saldo positivo em ${categoryName}.`;
}

function CategoryCard({
  budget,
  index,
  hidden,
}: {
  budget: BudgetWithCategory;
  index: number;
  hidden: boolean;
}) {
  const limit = budget.current_limit;
  const ratio = limit > 0 ? budget.spent / limit : 0;
  const width = Math.min(ratio * 100, 100);
  const color = barColor(ratio);
  const over = budget.spent > limit;
  const nearLimit = ratio >= 0.9;

  const displayRemaining = hidden ? "R$ ••••••" : formatCurrency(budget.remaining);
  const displayLimit = hidden ? "R$ ••••••" : formatCurrency(limit);
  const displaySpent = hidden ? "R$ ••••••" : formatCurrency(budget.spent);

  // Status text & color
  let statusText = "Dentro do limite";
  let statusColor = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
  if (over) {
    statusText = "Acima do limite";
    statusColor = "bg-rose-500/10 text-rose-400 border-rose-500/20";
  } else if (nearLimit) {
    statusText = "Atenção";
    statusColor = "bg-amber-500/10 text-amber-400 border-amber-500/20";
  }

  const aiTip = getAiTip(budget.category.name, ratio, budget.remaining, hidden);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      transition={{ duration: 0.35, delay: index * 0.05, ease: "easeOut" }}
      className="surface-card rounded-[16px] border border-border/40 p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow duration-300"
    >
      <div>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl leading-none">{budget.category.emoji}</span>
            <p className="min-w-0 truncate text-sm font-semibold text-foreground/90">
              {budget.category.name}
            </p>
          </div>
          <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase", statusColor)}>
            {statusText}
          </span>
        </div>

        <p
          className={cn(
            "mt-4 text-2xl font-bold tracking-tight tabular-nums",
            over ? "text-rose-400" : "text-foreground"
          )}
        >
          {displayRemaining}
          <span className="ml-1.5 text-xs font-medium text-muted-2">
            {over ? "acima do limite" : "restantes"}
          </span>
        </p>

        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-accent">
          <motion.div
            initial={{ width: 0 }}
            animate={{
              width: `${width}%`,
              opacity: nearLimit ? [1, 0.65, 1] : 1,
            }}
            transition={{
              width: { duration: 0.8, delay: 0.15 + index * 0.05, ease: "easeOut" },
              opacity: nearLimit
                ? { duration: 2.2, repeat: Infinity, ease: "easeInOut" }
                : { duration: 0.2 },
            }}
            className="h-full rounded-full"
            style={{ backgroundColor: color }}
          />
        </div>

        <div className="mt-3.5 flex items-center justify-between text-xs text-muted-foreground tabular-nums">
          <span>
            Limite{" "}
            <span className="font-semibold text-foreground/80">
              {displayLimit}
            </span>
          </span>
          <span>
            Gasto{" "}
            <span className="font-semibold text-foreground/80">
              {displaySpent}
            </span>
          </span>
        </div>
      </div>

      <div className="mt-4 pt-3.5 border-t border-border/20 flex gap-2 items-start text-[11px] text-muted-foreground leading-relaxed">
        <Sparkles className="size-3.5 text-primary shrink-0 mt-0.5" />
        <span className="font-medium">{aiTip}</span>
      </div>
    </motion.div>
  );
}

export function CategoryCards({ budgets, hidden }: { budgets: BudgetWithCategory[]; hidden: boolean }) {
  if (budgets.length === 0) {
    return (
      <p className="rounded-[16px] border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
        Nenhuma categoria neste mês. Crie categorias em Categorias — elas
        entram no orçamento na abertura do próximo mês.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {budgets.map((budget, index) => (
        <CategoryCard key={budget.id} budget={budget} index={index} hidden={hidden} />
      ))}
    </div>
  );
}
