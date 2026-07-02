"use client";

import { motion } from "framer-motion";
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

function CategoryCard({
  budget,
  index,
}: {
  budget: BudgetWithCategory;
  index: number;
}) {
  const limit = budget.current_limit;
  const ratio = limit > 0 ? budget.spent / limit : 0;
  const width = Math.min(ratio * 100, 100);
  const color = barColor(ratio);
  const over = budget.spent > limit;
  const nearLimit = ratio >= 0.9;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05, ease: "easeOut" }}
      className="surface-card surface-hoverable rounded-[16px] p-5"
    >
      <div className="flex items-center gap-3">
        <span className="text-3xl leading-none">{budget.category.emoji}</span>
        <p className="min-w-0 flex-1 truncate text-sm font-medium text-muted-foreground">
          {budget.category.name}
        </p>
      </div>

      <p
        className={cn(
          "mt-4 text-2xl font-bold tracking-tight tabular-nums",
          over ? "text-destructive" : "text-foreground"
        )}
      >
        {formatCurrency(budget.remaining)}
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
          <span className="font-medium text-foreground/80">
            {formatCurrency(limit)}
          </span>
        </span>
        <span>
          Gasto{" "}
          <span className="font-medium text-foreground/80">
            {formatCurrency(budget.spent)}
          </span>
        </span>
      </div>
    </motion.div>
  );
}

export function CategoryCards({ budgets }: { budgets: BudgetWithCategory[] }) {
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
        <CategoryCard key={budget.id} budget={budget} index={index} />
      ))}
    </div>
  );
}
