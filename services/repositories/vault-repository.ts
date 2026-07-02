import { createClient } from "@/lib/supabase/client";
import type { Vault } from "@/types/domain";

export const vaultRepository = {
  async find(): Promise<Vault | null> {
    const { data, error } = await createClient()
      .from("vault")
      .select("*")
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  },

  async create(input: {
    name: string;
    access_key_hash: string;
    investment_goal?: number;
  }): Promise<Vault> {
    const { data, error } = await createClient()
      .from("vault")
      .insert(input)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  async updateInvestmentGoal(id: string, investmentGoal: number): Promise<void> {
    const { error } = await createClient()
      .from("vault")
      .update({ investment_goal: investmentGoal })
      .eq("id", id);
    if (error) throw new Error(error.message);
  },
};
