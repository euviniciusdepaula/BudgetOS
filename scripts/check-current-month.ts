import fs from "fs";
import path from "path";
import { createClient } from "../lib/supabase/client";

// Load .env.local manually
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const idx = trimmed.indexOf("=");
      if (idx !== -1) {
        const k = trimmed.substring(0, idx).trim();
        const v = trimmed.substring(idx + 1).trim().replace(/^['"]|['"]$/g, "");
        process.env[k] = v;
      }
    }
  }
}

async function run() {
  const supabase = createClient();
  const { data: vault, error: vaultError } = await supabase
    .from("vault")
    .select("*")
    .limit(1)
    .single();

  if (vaultError) {
    console.error("Erro Vault:", vaultError);
    return;
  }

  console.log("Vault no Banco:");
  console.log(JSON.stringify(vault, null, 2));
}

run();
