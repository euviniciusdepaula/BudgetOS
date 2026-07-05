"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/utils/format";
import { cn } from "@/lib/utils";
import type { Category, TransactionWithCategory } from "@/types/domain";
import { Pencil, Trash2, Calendar } from "lucide-react";

interface CategoryDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: Category;
  limit: number;
  spent: number;
  remaining: number;
  transactions: TransactionWithCategory[];
  onEdit: () => void;
  onDelete: () => void;
}

export function CategoryDetailDialog({
  open,
  onOpenChange,
  category,
  limit,
  spent,
  remaining,
  transactions,
  onEdit,
  onDelete,
}: CategoryDetailDialogProps) {
  const over = spent > limit;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] flex flex-col p-6 overflow-hidden">
        {/* Header with Emoji, Name, Edit & Delete */}
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-border/40">
          <div className="flex items-center gap-3">
            <span className="text-3xl leading-none">{category.emoji}</span>
            <div>
              <DialogTitle className="text-lg font-bold">{category.name}</DialogTitle>
              <DialogDescription className="text-xs">
                Detalhes e histórico deste mês
              </DialogDescription>
            </div>
          </div>
          <div className="flex gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => {
                onOpenChange(false);
                onEdit();
              }}
              title="Editar categoria"
            >
              <Pencil className="size-4 text-muted-foreground hover:text-foreground" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => {
                onOpenChange(false);
                onDelete();
              }}
              title="Excluir categoria"
              className="hover:bg-destructive/10"
            >
              <Trash2 className="size-4 text-destructive" />
            </Button>
          </div>
        </DialogHeader>

        {/* Month Summary Stats */}
        <div className="py-4 grid grid-cols-3 gap-2 text-center border-b border-border/20">
          <div>
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
              Limite
            </span>
            <p className="text-sm font-semibold tabular-nums mt-0.5">
              {formatCurrency(limit)}
            </p>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
              Gasto
            </span>
            <p className={cn("text-sm font-semibold tabular-nums mt-0.5", over ? "text-rose-400" : "text-foreground")}>
              {formatCurrency(spent)}
            </p>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
              Restante
            </span>
            <p
              className={cn(
                "text-sm font-semibold tabular-nums mt-0.5",
                over ? "text-rose-400 font-bold" : remaining === 0 ? "text-muted-foreground" : "text-primary"
              )}
            >
              {formatCurrency(remaining)}
            </p>
          </div>
        </div>

        {/* Transactions List */}
        <div className="flex-1 overflow-y-auto pt-4 space-y-3 pr-1">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Calendar className="size-3.5" /> Histórico dessa categoria
          </h4>

          {transactions.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-8 text-center bg-accent/5 rounded-xl border border-border/10">
              Nenhum gasto nesta categoria este mês.
            </p>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx) => {
                const isExpense = tx.type === "expense";
                const isIncome = tx.type === "income";
                const isInvestment = tx.type === "investment";

                let sourceLabel = "Manual";
                if (tx.source === "ai") sourceLabel = "IA";
                if (tx.source === "simulation") sourceLabel = "Simulação";

                return (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border/20 bg-background/50 hover:bg-background/80 transition-colors"
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="truncate text-xs font-medium text-foreground">
                        {tx.description || "Sem descrição"}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span className="tabular-nums">
                          {formatDate(`${tx.date}T00:00:00`)}
                        </span>
                        <span>•</span>
                        <span
                          className={cn(
                            "px-1.5 py-0.2 rounded border text-[9px] font-semibold uppercase tracking-wider",
                            tx.source === "ai"
                              ? "bg-primary/5 text-primary border-primary/10"
                              : "bg-accent text-muted-foreground border-border/40"
                          )}
                        >
                          {sourceLabel}
                        </span>
                      </div>
                    </div>
                    <div className="ml-3 text-right">
                      <p
                        className={cn(
                          "text-xs font-semibold tabular-nums",
                          isIncome ? "text-emerald-400" : isInvestment ? "text-primary" : "text-foreground"
                        )}
                      >
                        {isExpense ? "−" : isIncome ? "+" : isInvestment ? "−" : ""}
                        {formatCurrency(tx.amount)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
