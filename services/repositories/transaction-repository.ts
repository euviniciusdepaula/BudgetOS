import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";
import type { TransactionWithCategory, Transaction } from "@/types/domain";

type TransactionInsert = Database["public"]["Tables"]["transactions"]["Insert"];

export interface TransactionFilters {
  categoryId?: string;
  search?: string;
  from?: string;
  to?: string;
  ascending?: boolean;
}

export const transactionRepository = {
  async listByMonth(
    monthId: string,
    filters: TransactionFilters = {}
  ): Promise<TransactionWithCategory[]> {
    let query = createClient()
      .from("transactions")
      .select("*, category:categories(*)")
      .eq("month_id", monthId);

    if (filters.categoryId) query = query.eq("category_id", filters.categoryId);
    if (filters.search) query = query.ilike("description", `%${filters.search}%`);
    if (filters.from) query = query.gte("date", filters.from);
    if (filters.to) query = query.lte("date", filters.to);

    const { data, error } = await query
      .order("date", { ascending: filters.ascending ?? false })
      .order("created_at", { ascending: filters.ascending ?? false });
    if (error) throw new Error(error.message);
    return (data ?? []) as TransactionWithCategory[];
  },

  async create(input: TransactionInsert): Promise<Transaction> {
    const { data, error } = await createClient()
      .from("transactions")
      .insert(input)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  async findById(id: string): Promise<Transaction | null> {
    const { data, error } = await createClient()
      .from("transactions")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  },

  async update(
    id: string,
    patch: Database["public"]["Tables"]["transactions"]["Update"]
  ): Promise<Transaction> {
    const { data, error } = await createClient()
      .from("transactions")
      .update(patch)
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  async remove(id: string): Promise<void> {
    const { error } = await createClient()
      .from("transactions")
      .delete()
      .eq("id", id);
    if (error) throw new Error(error.message);
  },
};

