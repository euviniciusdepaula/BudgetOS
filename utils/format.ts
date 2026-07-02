const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

export function formatDate(date: Date | string): string {
  const parsed = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(
    parsed
  );
}

/**
 * Converte string de valor monetário para número.
 * Aceita separadores no formato pt-BR (vírgula) e en-US (ponto).
 * Exemplos: "10,50" → 10.5 | "1.500,00" → 1500 | "10.50" → 10.5
 */
export function parseCurrencyInput(value: string): number {
  const trimmed = value.trim();
  if (trimmed === "") return NaN;

  // Formato pt-BR: ponto como milhar, vírgula como decimal (ex: "1.500,50")
  if (/^\d{1,3}(\.\d{3})*(,\d+)?$/.test(trimmed)) {
    return parseFloat(trimmed.replace(/\./g, "").replace(",", "."));
  }

  // Vírgula como decimal sem separador de milhar (ex: "10,50")
  if (/^\d+(,\d+)?$/.test(trimmed)) {
    return parseFloat(trimmed.replace(",", "."));
  }

  // Formato padrão com ponto como decimal (ex: "10.50")
  return parseFloat(trimmed);
}
