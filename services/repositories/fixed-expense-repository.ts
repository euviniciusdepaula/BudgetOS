import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";
import type { FixedExpense } from "@/types/domain";

type FixedExpenseInsert =
  Database["public"]["Tables"]["fixed_expenses"]["Insert"];
type FixedExpenseUpdate =
  Database["public"]["Tables"]["fixed_expenses"]["Update"];

export const fixedExpenseRepository = {
  async list(): Promise<FixedExpense[]> {
    const { data, error } = await createClient()
      .from("fixed_expenses")
      .select("*")
      .order("due_day")
      .order("created_at");
    if (error) throw new Error(error.message);
    return data;
  },

  async listActive(): Promise<FixedExpense[]> {
    const { data, error } = await createClient()
      .from("fixed_expenses")
      .select("*")
      .eq("active", true)
      .order("due_day");
    if (error) throw new Error(error.message);
    return data;
  },

  async create(input: FixedExpenseInsert): Promise<FixedExpense> {
    const { data, error } = await createClient()
      .from("fixed_expenses")
      .insert(input)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  async update(id: string, patch: FixedExpenseUpdate): Promise<FixedExpense> {
    const { data, error } = await createClient()
      .from("fixed_expenses")
      .update(patch)
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  async remove(id: string): Promise<void> {
    const { error } = await createClient()
      .from("fixed_expenses")
      .delete()
      .eq("id", id);
    if (error) throw new Error(error.message);
  },
};
