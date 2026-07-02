import type { Metadata } from "next";
import { HistoryView } from "@/features/history";

export const metadata: Metadata = { title: "Histórico" };

export default function HistoryPage() {
  return <HistoryView />;
}
