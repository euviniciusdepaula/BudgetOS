"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/utils/format";
import { cn } from "@/lib/utils";
import type { Category } from "@/types/domain";

interface CategoryCardProps {
  category: Category;
  limit: number;
  spent: number;
  remaining: number;
  onClick?: () => void;
  hidden?: boolean;
}

export function CategoryCard({
  category,
  limit,
  spent,
  remaining,
  onClick,
  hidden = false,
}: CategoryCardProps) {
  const ratio = limit > 0 ? spent / limit : 0;
  const percent = Math.round(ratio * 100);
  const over = spent > limit;

  const displayRemaining = hidden ? "R$ ••••••" : formatCurrency(remaining);
  const displayLimit = hidden ? "R$ ••••••" : formatCurrency(limit);
  const displaySpent = hidden ? "R$ ••••••" : formatCurrency(spent);

  return (
    <Card
      onClick={onClick}
      className={cn(
        "group cursor-pointer overflow-hidden border-border/40 hover:border-primary/30 hover:shadow-md transition-all duration-300 bg-card select-none",
        over && "hover:border-destructive/30 border-rose-500/20"
      )}
    >
      <CardContent className="p-4 space-y-3">
        {/* Emoji & Name */}
        <div className="flex items-center gap-2">
          <span className="text-xl shrink-0 leading-none">{category.emoji}</span>
          <span className="font-semibold text-sm truncate text-foreground/90 group-hover:text-foreground transition-colors">
            {category.name}
          </span>
        </div>

        {/* Restante */}
        <div className="space-y-0.5">
          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
            Restante
          </p>
          <p
            className={cn(
              "text-lg font-bold tracking-tight tabular-nums",
              over ? "text-rose-400" : remaining === 0 ? "text-muted-foreground" : "text-primary"
            )}
          >
            {displayRemaining}
          </p>
        </div>

        <Separator className="bg-border/30" />

        {/* Progress Bar & Percentage */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground font-semibold">
            <span>Uso</span>
            <span className={cn("tabular-nums", over ? "text-rose-400 font-bold" : "text-foreground/80")}>
              {percent}%
            </span>
          </div>
          <Progress
            value={Math.min(ratio * 100, 100)}
            className="h-1.5 bg-accent"
          />
        </div>

        {/* Limit & Spent Grid */}
        <div className="grid grid-cols-2 gap-2 pt-0.5 text-xs">
          <div className="space-y-0.5">
            <span className="text-[10px] text-muted-foreground block">Limite</span>
            <span className="font-medium tabular-nums text-foreground/80">
              {displayLimit}
            </span>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] text-muted-foreground block">Gasto</span>
            <span
              className={cn(
                "font-semibold tabular-nums",
                over ? "text-rose-400" : "text-foreground/80"
              )}
            >
              {displaySpent}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
