"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CategoryDialog } from "@/components/shared/category-dialog";
import { useCategories } from "@/hooks/use-categories";
import { useCategoryMutations } from "@/hooks/use-category-mutations";
import { formatCurrency } from "@/utils/format";
import type { Category } from "@/types/domain";

export function StepCategories({ onDone }: { onDone: () => void }) {
  const { data: categories } = useCategories();
  const { remove } = useCategoryMutations();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);

  const list = categories ?? [];

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        {list.map((category) => (
          <div
            key={category.id}
            className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3"
          >
            <span className="text-lg">{category.emoji}</span>
            <p className="min-w-0 flex-1 truncate text-sm font-medium">
              {category.name}
            </p>
            <span className="text-sm tabular-nums text-muted-foreground">
              {formatCurrency(category.default_limit)}
            </span>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setEditing(category);
                  setDialogOpen(true);
                }}
              >
                <Pencil />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => remove.mutate(category.id)}
              >
                <Trash2 />
              </Button>
            </div>
          </div>
        ))}

        {list.length === 0 && (
          <p className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
            Nenhuma categoria ainda. Alimentação, transporte, lazer…
          </p>
        )}
      </div>

      <Button
        variant="outline"
        className="w-full"
        onClick={() => {
          setEditing(null);
          setDialogOpen(true);
        }}
      >
        <Plus />
        Adicionar categoria
      </Button>

      <Button
        className="w-full"
        onClick={onDone}
        disabled={list.length === 0}
      >
        Concluir configuração
      </Button>

      <CategoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        category={editing}
        nextSortOrder={list.length}
      />
    </div>
  );
}
