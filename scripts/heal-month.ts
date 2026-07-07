import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

const envPath = path.join(__dirname, "../.env.local");
const envContent = fs.readFileSync(envPath, "utf-8");
const url = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)?.[1]?.trim();
const anonKey = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)?.[1]?.trim();

const supabase = createClient(url!, anonKey!);

async function main() {
  // 1. Obter o mês ativo atual (aberto)
  const { data: months, error: monthErr } = await supabase
    .from("months")
    .select("*")
    .eq("closed", false)
    .limit(1);

  if (monthErr || !months || months.length === 0) {
    console.error("Mês ativo não encontrado:", monthErr);
    return;
  }

  const month = months[0];
  console.log("=== Mês Encontrado ===");
  console.log(`ID: ${month.id}`);
  console.log(`Nome: ${month.name}`);
  console.log(`Saldo Bancário: R$ ${month.bank_balance}`);
  console.log(`Reserva Contas (Antes): R$ ${month.reserved_fixed_expenses}`);
  console.log(`Reserva Investimento: R$ ${month.reserved_investment}`);
  console.log(`Saldo Disponível (Antes): R$ ${month.available_balance}`);

  // 2. Obter despesas fixas ativas
  const { data: expenses, error: expErr } = await supabase
    .from("fixed_expenses")
    .select("*")
    .eq("active", true);

  if (expErr || !expenses) {
    console.error("Erro ao buscar despesas fixas:", expErr);
    return;
  }

  // 3. Obter pagamentos do mês
  const { data: payments, error: payErr } = await supabase
    .from("fixed_expense_payments")
    .select("*")
    .eq("month_id", month.id);

  if (payErr || !payments) {
    console.error("Erro ao buscar pagamentos:", payErr);
    return;
  }

  const paidIds = new Set(payments.map((p) => p.fixed_expense_id));

  // 4. Calcular o total pendente real (ativos não pagos)
  const unpaidExpenses = expenses.filter((e) => !paidIds.has(e.id));
  const unpaidTotal = unpaidExpenses.reduce((sum, e) => sum + e.amount, 0);

  const roundedUnpaid = Math.round(unpaidTotal * 100) / 100;
  const newAvailable = Math.round((month.bank_balance - roundedUnpaid - month.reserved_investment) * 100) / 100;

  console.log("\n=== Novo Cálculo ===");
  console.log(`Contas pendentes encontradas: ${unpaidExpenses.length}`);
  console.log(`Reserva Contas (Correto): R$ ${roundedUnpaid}`);
  console.log(`Saldo Disponível (Correto): R$ ${newAvailable}`);

  // 5. Atualizar no Supabase
  const { data: updatedMonth, error: updErr } = await supabase
    .from("months")
    .update({
      reserved_fixed_expenses: roundedUnpaid,
      available_balance: newAvailable
    })
    .eq("id", month.id)
    .select()
    .single();

  if (updErr) {
    console.error("Erro ao atualizar banco de dados:", updErr);
    return;
  }

  console.log("\n✔ Banco de dados atualizado com sucesso!");
  console.log(`Reserva Contas no DB: R$ ${updatedMonth.reserved_fixed_expenses}`);
  console.log(`Saldo Disponível no DB: R$ ${updatedMonth.available_balance}`);
}

main().catch((err) => console.error("Erro na execução:", err));
