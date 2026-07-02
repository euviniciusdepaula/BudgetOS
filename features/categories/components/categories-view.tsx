"use client";

import { useState } from "react";
import { Pencil, Plus, Tags, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { CategoryDialog } from "@/components/shared/category-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { useCategories } from "@/hooks/use-categories";
import { useCategoryMutations } from "@/hooks/use-category-mutations";
import { formatCurrency } from "@/utils/format";
import type { Category } from "@/types/domain";

export function CategoriesView() {
  const { data: categories } = useCategories();
  const { remove } = useCategoryMutations();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);

  const list = categories ?? [];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Categorias"
        description="Planejamento padrão — os limites são copiados para cada novo mês."
      >
        <Button
          size="sm"
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          <Plus />
          Nova categoria
        </Button>
      </PageHeader>

      {list.length === 0 ? (
        <EmptyState
          icon={Tags}
          title="Nenhuma categoria criada"
          description="Crie categorias para dar significado aos seus gastos e alimentar o cálculo do seu orçamento."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {list.map((category) => (
            <Card key={category.id} className="py-4">
              <CardContent className="flex items-center gap-3 px-4">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-card text-base">
                  {category.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {category.name}
                  </p>
                  <p className="text-xs text-muted-foreground tabular-nums">
                    Limite {formatCurrency(category.default_limit)}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Editar"
                    onClick={() => {
                      setEditing(category);
                      setDialogOpen(true);
                    }}
                  >
                    <Pencil />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Excluir"
                    onClick={() => remove.mutate(category.id)}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Categorias não reservam dinheiro — são apenas limites de controle.
        Alterações aqui valem a partir do próximo mês aberto.
      </p>

      <CategoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        category={editing}
        nextSortOrder={list.length}
      />
    </div>
  );
}
