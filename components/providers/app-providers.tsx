"use client";

import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryProvider } from "./query-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <TooltipProvider delay={200}>{children}</TooltipProvider>
    </QueryProvider>
  );
}
