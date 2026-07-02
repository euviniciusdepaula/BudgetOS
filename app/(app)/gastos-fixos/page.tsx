import type { Metadata } from "next";
import { FixedExpensesView } from "@/features/fixed-expenses";

export const metadata: Metadata = { title: "Gastos Fixos" };

export default function FixedExpensesPage() {
  return <FixedExpensesView />;
}
