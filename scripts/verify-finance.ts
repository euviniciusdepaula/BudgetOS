/**
 * Sanidade das regras financeiras (funções puras de lib/finance).
 * Rodar com: npx tsx scripts/verify-finance.ts
 */
import {
  applyAdjustment,
  applyExpense,
  applyFixedExpensePayment,
  applyIncome,
  applyInvestment,
  computeMonthOpening,
} from "../lib/finance/calculations";

let failures = 0;

function expectEqual(label: string, actual: number, expected: number) {
  const ok = Math.abs(actual - expected) < 1e-9;
  console.log(`${ok ? "✔" : "✘"} ${label}: ${actual} ${ok ? "" : `(esperado ${expected})`}`);
  if (!ok) failures++;
}

// Abertura do mês: 500 restantes + 5000 salário + 200 extras,
// 1800 de gastos fixos e meta de 1500 de investimento.
// Sob o modelo de reserva, o investimento de meta é subtraído na abertura.
const opening = computeMonthOpening({
  startingBalance: 500,
  salary: 5000,
  extraIncome: 200,
  fixedExpensesTotal: 1800,
  investmentGoal: 1500,
});
expectEqual("abertura: saldo bancário", opening.bank_balance, 5700);
expectEqual("abertura: disponível", opening.available_balance, 2400); // 5700 - 1800 - 1500 = 2400

// Gasto de 52 (iFood): sai do banco e do disponível; reservas intactas.
const afterExpense = applyExpense(opening, 52);
expectEqual("gasto: saldo bancário", afterExpense.bank_balance, 5648);
expectEqual("gasto: disponível", afterExpense.available_balance, 2348);
expectEqual(
  "gasto: reserva fixos intacta",
  afterExpense.reserved_fixed_expenses,
  1800
);

// Receita de 300 (freela): banco e disponível sobem.
const afterIncome = applyIncome(afterExpense, 300);
expectEqual("receita: saldo bancário", afterIncome.bank_balance, 5948);
expectEqual("receita: disponível", afterIncome.available_balance, 2648);

// Pagar gasto fixo de 120: banco e reserva caem juntos; disponível NÃO muda.
const afterPaid = applyFixedExpensePayment(afterIncome, 120, true);
expectEqual("fixo pago: saldo bancário", afterPaid.bank_balance, 5828);
expectEqual("fixo pago: reserva fixos", afterPaid.reserved_fixed_expenses, 1680);
expectEqual("fixo pago: disponível inalterado", afterPaid.available_balance, 2648);

// Desmarcar o pagamento devolve tudo.
const afterUnpaid = applyFixedExpensePayment(afterPaid, 120, false);
expectEqual("fixo desfeito: saldo bancário", afterUnpaid.bank_balance, 5948);
expectEqual("fixo desfeito: disponível", afterUnpaid.available_balance, 2648);

// Ajustes de saldo: só banco + disponível.
expectEqual(
  "ajuste entrada +300",
  applyAdjustment(afterUnpaid, "entry", 300).bank_balance,
  6248
);
expectEqual(
  "ajuste saída 100",
  applyAdjustment(afterUnpaid, "exit", 100).bank_balance,
  5848
);
expectEqual(
  "ajuste correção -50",
  applyAdjustment(afterUnpaid, "correction", -50).bank_balance,
  5898
);
expectEqual(
  "ajuste transferência 200",
  applyAdjustment(afterUnpaid, "transfer", 200).bank_balance,
  5748
);
expectEqual(
  "ajuste entrada muda disponível",
  applyAdjustment(afterUnpaid, "entry", 300).available_balance,
  2948
);

// Aporte efetivado de 1500 (dentro da meta reservada): banco cai, reserva zera, disponível NÃO muda.
const afterInvest = applyInvestment(afterUnpaid, 1500);
expectEqual("aporte: saldo bancário", afterInvest.bank_balance, 4448);
expectEqual("aporte: reserva investimento", afterInvest.reserved_investment, 0); // reserva zerou
expectEqual("aporte: disponível inalterado", afterInvest.available_balance, 2648); // disponível continua 2648

// Aporte excedente de 500 (investimento manual/extra): banco cai, reserva continua 0, disponível cai por 500.
const afterExcess = applyInvestment(afterInvest, 500);
expectEqual("excesso: saldo bancário", afterExcess.bank_balance, 3948);
expectEqual("excesso: reserva investimento", afterExcess.reserved_investment, 0); // continua 0
expectEqual("excesso: disponível cai", afterExcess.available_balance, 2148); // reduziu de 2648 para 2148

// Arredondamento: 0.1 + 0.2 não pode virar 0.30000000000000004.
const rounding = applyExpense(
  { bank_balance: 0.3, reserved_fixed_expenses: 0, reserved_investment: 0, available_balance: 0.3 },
  0.1
);
expectEqual("arredondamento", rounding.bank_balance, 0.2);

if (failures > 0) {
  console.error(`\n${failures} verificação(ões) falharam.`);
  process.exit(1);
}
console.log("\nTodas as regras financeiras verificadas.");
