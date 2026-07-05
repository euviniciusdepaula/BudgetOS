"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/lib/query-keys";
import { categoryRepository } from "@/services/repositories/category-repository";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type CategoryInsert = Database["public"]["Tables"]["categories"]["Insert"];
type CategoryUpdate = Database["public"]["Tables"]["categories"]["Update"];

export function useCategoryMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.categories });
    queryClient.invalidateQueries({ queryKey: queryKeys.currentMonth });
    queryClient.invalidateQueries({ queryKey: ["budgets"] });
  };

  const create = useMutation({
    mutationFn: (input: CategoryInsert) => categoryRepository.create(input),
    onSuccess: invalidate,
    onError: (error) => toast.error(error.message),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...patch }: CategoryUpdate & { id: string }) => {
      // 1. Update category default limit
      const updatedCategory = await categoryRepository.update(id, patch);

      // 2. Synchronize with the current month budget if it exists and limit changed
      if (patch.default_limit !== undefined) {
        const supabase = createClient();
        
        // Find latest open month
        const { data: month } = await supabase
          .from("months")
          .select("id")
          .eq("closed", false)
          .order("year", { ascending: false })
          .order("month", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (month) {
          // Find the category budget for this month
          const { data: budget } = await supabase
            .from("monthly_category_budgets")
            .select("id")
            .eq("month_id", month.id)
            .eq("category_id", id)
            .maybeSingle();

          if (budget) {
            // Update current_limit and planned_limit
            const { error: budgetError } = await supabase
              .from("monthly_category_budgets")
              .update({
                planned_limit: patch.default_limit,
                current_limit: patch.default_limit,
              })
              .eq("id", budget.id);

            if (budgetError) throw new Error(budgetError.message);
          }
        }
      }

      return updatedCategory;
    },
    onSuccess: invalidate,
    onError: (error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => categoryRepository.remove(id),
    onSuccess: invalidate,
    onError: (error) => toast.error(error.message),
  });

  return { create, update, remove };
}
