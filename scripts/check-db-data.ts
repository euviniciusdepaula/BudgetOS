import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

const envPath = path.join(__dirname, "../.env.local");
const envContent = fs.readFileSync(envPath, "utf-8");
const url = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)?.[1]?.trim();
const anonKey = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)?.[1]?.trim();

const supabase = createClient(url!, anonKey!);

async function main() {
  const { data: vault } = await supabase.from("vault").select("*");
  console.log("=== Vault ===");
  console.log(vault);
  
  const { data: months } = await supabase.from("months").select("*");
  console.log("\n=== Months ===");
  console.log(months);
  
  const { data: investments } = await supabase.from("investments").select("*");
  console.log("\n=== Investments ===");
  console.log(investments);
}

main().catch((err) => console.error(err));
