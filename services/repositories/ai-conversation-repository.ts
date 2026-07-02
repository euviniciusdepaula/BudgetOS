import { createClient } from "@/lib/supabase/client";
import type { Json } from "@/types/database";
import type { AiConversationEntry } from "@/types/domain";

export const aiConversationRepository = {
  async append(input: {
    month_id: string | null;
    role: "user" | "assistant";
    content: string;
    metadata?: Json;
  }): Promise<AiConversationEntry> {
    const { data, error } = await createClient()
      .from("ai_conversations")
      .insert(input)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  async listRecent(limit = 50): Promise<AiConversationEntry[]> {
    const { data, error } = await createClient()
      .from("ai_conversations")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw new Error(error.message);
    return data;
  },
};
