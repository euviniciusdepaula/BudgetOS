import { buildSystemPrompt, type AssistantPromptContext } from "./AssistantPrompt";
import { ASSISTANT_JSON_SCHEMA } from "./AssistantSchema";
import type {
  AssistantAction,
  AssistantParsedOutput,
  AssistantReplyData,
  AssistantServiceReply,
} from "./AssistantTypes";
import { monthRepository } from "@/services/repositories/month-repository";
import { budgetRepository } from "@/services/repositories/budget-repository";
import { fixedExpenseRepository } from "@/services/repositories/fixed-expense-repository";
import { paymentRepository } from "@/services/repositories/payment-repository";
import { investmentRepository } from "@/services/repositories/investment-repository";
import { transactionService } from "@/services/transaction-service";
import { fixedExpenseService } from "@/services/fixed-expense-service";
import { balanceService } from "@/services/balance-service";
import { aiConversationRepository } from "@/services/repositories/ai-conversation-repository";
import { formatCurrency } from "@/utils/format";
import type { Json } from "@/types/database";
import type { BudgetWithCategory, FixedExpense, Month } from "@/types/domain";

function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function matchCategory(
  input: string | null | undefined,
  budgets: BudgetWithCategory[]
): BudgetWithCategory | null {
  if (!input) return null;
  const normInput = normalize(input);

  // 1. Exact match (normalized)
  let found = budgets.find((b) => normalize(b.category.name) === normInput);
  if (found) return found;

  // 2. Substring match (normalized)
  found = budgets.find(
    (b) =>
      normalize(b.category.name).includes(normInput) ||
      normInput.includes(normalize(b.category.name))
  );
  if (found) return found;

  // 3. Emoji match
  found = budgets.find(
    (b) =>
      b.category.emoji &&
      (normInput.includes(normalize(b.category.emoji)) ||
        normalize(b.category.emoji).includes(normInput))
  );
  return found || null;
}

function matchFixedExpense(
  input: string | null | undefined,
  expenses: FixedExpense[]
): FixedExpense | null {
  if (!input) return null;
  const normInput = normalize(input);

  // 1. Exact match (normalized)
  let found = expenses.find((f) => normalize(f.name) === normInput);
  if (found) return found;

  // 2. Substring match (normalized)
  found = expenses.find(
    (f) =>
      normalize(f.name).includes(normInput) ||
      normInput.includes(normalize(f.name))
  );
  return found || null;
}

export const AssistantService = {
  async processMessage(
    message: string,
    monthId: string | null
  ): Promise<AssistantServiceReply> {
    // 1. Obter o mês correspondente
    let month: Month | null = null;
    if (monthId) {
      const allMonths = await monthRepository.list();
      month = allMonths.find((m) => m.id === monthId) || null;
    } else {
      const now = new Date();
      month = await monthRepository.findByYearMonth(
        now.getFullYear(),
        now.getMonth() + 1
      );
    }

    if (!month) {
      const errMsg = "Não encontrei nenhum mês financeiro aberto para processar a sua mensagem.";
      return {
        content: errMsg,
        actionExecuted: "unknown",
        payload: { reason: "no_active_month" },
      };
    }

    const currentMonthId = month.id;

    // 2. Coletar dados reais do banco para o contexto da IA
    const [budgets, activeFixedExpenses, payments, investments] = await Promise.all([
      budgetRepository.listByMonth(currentMonthId),
      fixedExpenseRepository.listActive(),
      paymentRepository.listByMonth(currentMonthId),
      investmentRepository.listByMonth(currentMonthId),
    ]);

    const investmentTotal = investments.reduce((sum, inv) => sum + Number(inv.amount), 0);
    const paidExpenseIds = new Set(payments.map((p) => p.fixed_expense_id));

    const promptContext: AssistantPromptContext = {
      year: month.year,
      month: month.month,
      bankBalance: Number(month.bank_balance),
      availableBalance: Number(month.available_balance),
      currentDate: new Date().toLocaleDateString("pt-BR"),
      investmentTotal,
      categories: budgets.map((b) => ({
        id: b.category_id,
        name: b.category.name,
        emoji: b.category.emoji,
        limit: Number(b.current_limit),
        spent: Number(b.spent),
        remaining: Number(b.remaining),
      })),
      fixedExpenses: activeFixedExpenses.map((f) => ({
        id: f.id,
        name: f.name,
        amount: Number(f.amount),
        paid: paidExpenseIds.has(f.id),
      })),
    };

    // 3. Chamar a API da OpenAI com Structured Outputs
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("A variável de ambiente OPENAI_API_KEY não está configurada.");
    }

    const systemPrompt = buildSystemPrompt(promptContext);
    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        response_format: {
          type: "json_schema",
          json_schema: ASSISTANT_JSON_SCHEMA,
        },
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Erro na API da OpenAI: ${response.status} - ${errText}`);
    }

    const responseData = await response.json();
    const parsedRaw = responseData.choices?.[0]?.message?.content;
    if (!parsedRaw) {
      throw new Error("Resposta da OpenAI veio vazia.");
    }

    const aiOutput: AssistantParsedOutput = JSON.parse(parsedRaw);
    const { action, payload } = aiOutput;

    let content = "";
    let actionExecuted: AssistantAction = action;
    let extraData: AssistantReplyData | null = null;

    // 4. Executar as intenções e construir resposta baseada em dados reais
    try {
      if (action === "create_transaction") {
        const amount = payload.amount;
        if (!amount || amount <= 0) {
          throw new Error("Valor do gasto inválido.");
        }

        const matched = matchCategory(payload.category, budgets);
        if (!matched) {
          // Categoria ambígua ou não encontrada -> fallback para unknown
          actionExecuted = "unknown";
          payload.reason = "category_not_identified";
          content = "Não identifiquei uma categoria correspondente para esse gasto. Por favor, selecione uma das opções abaixo para registrar.";
          extraData = {
            categories: budgets.map((b) => b.category),
            amount,
            description: payload.description || message,
            date: payload.date || new Date().toISOString().split("T")[0],
          };
        } else {
          // Registrar transação na Finance Engine
          const tx = await transactionService.registerExpense({
            month,
            amount,
            categoryId: matched.category_id,
            description: payload.description || message,
            date: payload.date || undefined,
            source: "ai",
          });

          // Buscar dados atualizados do mês
          const updatedMonths = await monthRepository.list();
          const updatedMonth = updatedMonths.find((m) => m.id === currentMonthId)!;
          const updatedBudgets = await budgetRepository.listByMonth(currentMonthId);
          const updatedBudget = updatedBudgets.find(
            (b) => b.category_id === matched.category_id
          )!;

          content = `Registro realizado.
Categoria:
${matched.category.emoji} ${matched.category.name}
Valor:
${formatCurrency(amount)}
Restante na categoria:
${formatCurrency(Number(updatedBudget.remaining))}
Disponível para gastar:
${formatCurrency(Number(updatedMonth.available_balance))}`;

          extraData = { transaction: tx };
        }
      } else if (action === "create_income") {
        const amount = payload.amount;
        if (!amount || amount <= 0) {
          throw new Error("Valor da receita inválido.");
        }

        const tx = await transactionService.registerIncome({
          month,
          amount,
          description: payload.description || message,
          date: payload.date || undefined,
          source: "ai",
        });

        const updatedMonths = await monthRepository.list();
        const updatedMonth = updatedMonths.find((m) => m.id === currentMonthId)!;

        content = `Receita registrada com sucesso!
Valor:
${formatCurrency(amount)}
Disponível para gastar:
${formatCurrency(Number(updatedMonth.available_balance))}`;

        extraData = { transaction: tx };
      } else if (action === "pay_fixed_expense") {
        const matched = matchFixedExpense(payload.expense_name, activeFixedExpenses);

        if (!matched) {
          content = `Não encontrei nenhum gasto fixo pendente correspondente a "${payload.expense_name}".`;
          actionExecuted = "unknown";
          payload.reason = "fixed_expense_not_found";
        } else {
          const isAlreadyPaid = paidExpenseIds.has(matched.id);
          if (isAlreadyPaid) {
            content = `O gasto fixo "${matched.name}" já está marcado como pago neste mês.`;
          } else {
            await fixedExpenseService.setPaid(month, matched, true);

            const updatedMonths = await monthRepository.list();
            const updatedMonth = updatedMonths.find((m) => m.id === currentMonthId)!;

            content = `Marquei o gasto fixo "${matched.name}" (${formatCurrency(
              Number(matched.amount)
            )}) como pago!
Saldo disponível inalterado (já estava reservado):
${formatCurrency(Number(updatedMonth.available_balance))}`;
          }
          extraData = { fixedExpense: matched };
        }
      } else if (action === "balance_adjustment") {
        const amount = payload.amount;
        const type = payload.type;
        if (!amount || !type) {
          throw new Error("Dados de ajuste de saldo inválidos.");
        }

        const adj = await balanceService.apply({
          month,
          type,
          amount,
          description: payload.description || message,
        });

        const updatedMonths = await monthRepository.list();
        const updatedMonth = updatedMonths.find((m) => m.id === currentMonthId)!;

        const typeLabels: Record<string, string> = {
          entry: "Entrada",
          exit: "Saída",
          correction: "Correção de Saldo",
          transfer: "Transferência",
        };

        content = `Ajuste de saldo (${typeLabels[type]}) realizado com sucesso!
Valor:
${formatCurrency(amount)}
Novo Saldo Bancário:
${formatCurrency(Number(updatedMonth.bank_balance))}
Disponível para gastar:
${formatCurrency(Number(updatedMonth.available_balance))}`;

        extraData = { adjustment: adj };
      } else if (action === "question") {
        const intent = payload.intent;
        if (intent === "available_balance") {
          content = `Seu dinheiro disponível para gastar hoje é de ${formatCurrency(
            Number(month.available_balance)
          )}.
(Saldo bancário: ${formatCurrency(
            Number(month.bank_balance)
          )} - Reservas fixas: ${formatCurrency(
            Number(month.reserved_fixed_expenses)
          )} - Meta de investimento: ${formatCurrency(
            Number(month.reserved_investment)
          )})`;
        } else if (intent === "category_remaining") {
          const matched = matchCategory(payload.category, budgets);
          if (matched) {
            content = `Você ainda tem ${formatCurrency(
              Number(matched.remaining)
            )} disponíveis na categoria ${matched.category.emoji} ${
              matched.category.name
            } (Limite: ${formatCurrency(
              Number(matched.current_limit)
            )} | Gasto: ${formatCurrency(Number(matched.spent))})`;
          } else {
            const categoriesStatus = budgets
              .map(
                (b) =>
                  `${b.category.emoji} ${b.category.name}: ${formatCurrency(
                    Number(b.remaining)
                  )} restantes`
              )
              .join("\n");
            content = `Aqui está o saldo restante das suas categorias:\n${categoriesStatus}`;
          }
        } else if (intent === "investment_total") {
          content = `Você aportou um total de ${formatCurrency(
            investmentTotal
          )} em investimentos este mês. A sua meta mensal definida é de ${formatCurrency(
            Number(month.reserved_investment)
          )}.`;
        } else if (intent === "fixed_expenses") {
          const unpaid = activeFixedExpenses.filter((f) => !paidExpenseIds.has(f.id));
          const totalUnpaid = unpaid.reduce((sum, f) => sum + Number(f.amount), 0);
          content = `Você possui ${unpaid.length} gastos fixos pendentes de pagamento neste mês, totalizando ${formatCurrency(
            totalUnpaid
          )}.\n${unpaid
            .map((f) => `- ${f.name} (${formatCurrency(Number(f.amount))})`)
            .join("\n")}`;
        } else if (intent === "salary") {
          content = `Seu salário cadastrado para este mês é de ${formatCurrency(
            Number(month.salary)
          )} (Receitas extras: ${formatCurrency(Number(month.extra_income))})`;
        } else if (intent === "monthly_summary") {
          content = `Resumo Financeiro do Mês:
- Saldo Bancário: ${formatCurrency(Number(month.bank_balance))}
- Disponível para Gastar: ${formatCurrency(Number(month.available_balance))}
- Reservado para Gastos Fixos: ${formatCurrency(Number(month.reserved_fixed_expenses))}
- Meta de Investimento: ${formatCurrency(Number(month.reserved_investment))}
- Aportes Realizados: ${formatCurrency(investmentTotal)}`;
        } else if (intent === "category_summary") {
          const summary = budgets
            .map(
              (b) =>
                `- ${b.category.emoji} ${b.category.name}: Gasto ${formatCurrency(
                  Number(b.spent)
                )} de ${formatCurrency(Number(b.current_limit))}`
            )
            .join("\n");
          content = `Resumo de gastos por categoria:\n${summary}`;
        } else {
          content = `Não entendi qual informação sobre o orçamento você deseja consultar. Você pode perguntar sobre "saldo disponível", "restante em alimentação", "investimentos" ou "gastos fixos".`;
        }
      } else if (action === "simulation") {
        content = `Simulação de lançamento recebida: "${
          payload.description || "Gasto"
        }" de ${formatCurrency(payload.amount || 0)} na categoria "${
          payload.category || "Geral"
        }". Esta funcionalidade de simulações e projeções será ativada nas próximas versões.`;
      } else {
        // Unknown ou erro de interpretação
        actionExecuted = "unknown";
        content = `Desculpe, não consegui compreender a sua mensagem ou identificar a ação desejada. Tente falar algo como: "Pedi um iFood de 58 reais", "Recebi um pix de 150", ou "Paguei o aluguel".`;
      }
    } catch (e) {
      console.error(e);
      const message = e instanceof Error ? e.message : String(e);
      content = `Ocorreu um erro ao processar a operação financeira: ${message}`;
      actionExecuted = "unknown";
    }

    // 5. Persistir conversa em ai_conversations
    await Promise.all([
      aiConversationRepository.append({
        month_id: currentMonthId,
        role: "user",
        content: message,
      }),
      aiConversationRepository.append({
        month_id: currentMonthId,
        role: "assistant",
        content,
        metadata: JSON.parse(
          JSON.stringify({ action: actionExecuted, payload, extraData })
        ) as Json,
      }),
    ]);

    return {
      content,
      actionExecuted,
      payload,
      data: extraData,
    };
  },
};
