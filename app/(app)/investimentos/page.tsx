import type { Metadata } from "next";
import { InvestmentsView } from "@/features/investments";

export const metadata: Metadata = { title: "Investimentos" };

export default function InvestmentsPage() {
  return <InvestmentsView />;
}
