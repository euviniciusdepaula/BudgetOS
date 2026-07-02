import type { Metadata } from "next";
import { CategoriesView } from "@/features/categories";

export const metadata: Metadata = { title: "Categorias" };

export default function CategoriesPage() {
  return <CategoriesView />;
}
