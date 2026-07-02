"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function EmptyState({ icon: Icon, title, description }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="flex min-h-[320px] flex-col items-center justify-center rounded-xl border border-dashed bg-card/40 px-6 py-16 text-center"
    >
      <span className="mb-5 flex size-12 items-center justify-center rounded-xl border bg-card">
        <Icon className="size-5 text-muted-foreground" />
      </span>
      <h2 className="text-base font-medium">{title}</h2>
      <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
        {description}
      </p>
    </motion.div>
  );
}
