import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";
import type { Category } from "@/types/domain";

type CategoryInsert = Database["public"]["Tables"]["categories"]["Insert"];
type CategoryUpdate = Database["public"]["Tables"]["categories"]["Update"];

export const categoryRepository = {
  async list(): Promise<Category[]> {
    const { data, error } = await createClient()
      .from("categories")
      .select("*")
      .order("sort_order")
      .order("created_at");
    if (error) throw new Error(error.message);
    return data;
  },

  async create(input: CategoryInsert): Promise<Category> {
    const { data, error } = await createClient()
      .from("categories")
      .insert(input)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  async update(id: string, patch: CategoryUpdate): Promise<Category> {
    const { data, error } = await createClient()
      .from("categories")
      .update(patch)
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  async remove(id: string): Promise<void> {
    const { error } = await createClient()
      .from("categories")
      .delete()
      .eq("id", id);
    if (error) throw new Error(error.message);
  },
};
