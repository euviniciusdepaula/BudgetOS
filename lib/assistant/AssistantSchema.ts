export const ASSISTANT_JSON_SCHEMA = {
  name: "assistant_parsed_output",
  strict: true,
  schema: {
    type: "object",
    properties: {
      action: {
        type: "string",
        enum: [
          "create_transaction",
          "create_income",
          "pay_fixed_expense",
          "balance_adjustment",
          "question",
          "simulation",
          "unknown",
        ],
      },
      payload: {
        type: "object",
        properties: {
          category: {
            type: ["string", "null"],
            description: "Nome, emoji ou dica da categoria para transações",
          },
          amount: {
            type: ["number", "null"],
            description: "Valor numérico da transação ou consulta",
          },
          description: {
            type: ["string", "null"],
            description: "Descrição textual simples do lançamento",
          },
          date: {
            type: ["string", "null"],
            description: "Data do lançamento no formato YYYY-MM-DD",
          },
          expense_name: {
            type: ["string", "null"],
            description: "Nome exato ou parcial do gasto fixo a ser pago",
          },
          type: {
            type: ["string", "null"],
            enum: ["entry", "exit", "correction", "transfer", null],
            description: "Tipo de ajuste de saldo (entry, exit, correction, transfer)",
          },
          intent: {
            type: ["string", "null"],
            enum: [
              "available_balance",
              "category_remaining",
              "investment_total",
              "fixed_expenses",
              "salary",
              "monthly_summary",
              "category_summary",
              null,
            ],
            description: "Identificador da pergunta sobre o orçamento",
          },
          reason: {
            type: ["string", "null"],
            description: "Motivo de falha caso a ação seja unknown (ex: category_not_identified)",
          },
        },
        required: [
          "category",
          "amount",
          "description",
          "date",
          "expense_name",
          "type",
          "intent",
          "reason",
        ],
        additionalProperties: false,
      },
    },
    required: ["action", "payload"],
    additionalProperties: false,
  },
};
