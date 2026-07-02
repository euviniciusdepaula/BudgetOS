"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CalendarDays, Eye, EyeOff, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedNumber } from "@/components/shared/animated-number";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/format";

const STORAGE_KEY = "budgetos.hide-available";

function monthProgress() {
  const now = new Date();
  const day = now.getDate();
  const total = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return { day, total, percent: Math.round((day / total) * 100) };
}

export function AvailableHero({
  available,
  className,
}: {
  available: number;
  className?: string;
}) {
  const negative = available < 0;
  const [hidden, setHidden] = useState(false);
  const progress = monthProgress();

  useEffect(() => {
    setHidden(window.localStorage.getItem(STORAGE_KEY) === "1");
  }, []);

  function toggleHidden() {
    setHidden((current) => {
      window.localStorage.setItem(STORAGE_KEY, current ? "0" : "1");
      return !current;
    });
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={cn(
        "surface-card relative flex flex-col justify-between overflow-hidden bg-gradient-to-br from-positive-deep/55 via-card to-card p-7 md:p-8",
        className
      )}
    >
      {/* Glow muito suave */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -left-16 size-64 rounded-full bg-primary/12 blur-3xl"
      />
      {/* Curva orgânica ao fundo */}
      <svg
        aria-hidden
        viewBox="0 0 400 120"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-28 w-full opacity-60"
      >
        <defs>
          <linearGradient id="hero-wave" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.16" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M0,86 C60,70 90,96 140,84 C200,70 220,44 280,54 C330,62 360,50 400,32 L400,120 L0,120 Z"
          fill="url(#hero-wave)"
        />
        <path
          d="M0,86 C60,70 90,96 140,84 C200,70 220,44 280,54 C330,62 360,50 400,32"
          fill="none"
          stroke="var(--primary)"
          strokeOpacity="0.35"
          strokeWidth="1.5"
        />
      </svg>

      <div className="relative flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-[16px] bg-primary/12 text-primary">
            <Wallet className="size-5" />
          </span>
          <div>
            <p className="text-sm font-medium text-foreground">
              Disponível para gastar
            </p>
            <p className="text-xs text-muted-foreground">
              Depois das contas e do investimento
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={hidden ? "Mostrar valor" : "Ocultar valor"}
          onClick={toggleHidden}
          className="text-muted-foreground hover:text-foreground"
        >
          {hidden ? <EyeOff /> : <Eye />}
        </Button>
      </div>

      <div className="relative py-8 md:py-10">
        <p
          className={cn(
            "text-[clamp(2.5rem,4vw+1.25rem,5rem)] leading-none font-bold tracking-tight",
            hidden
              ? "text-foreground/60"
              : negative
                ? "text-destructive"
                : "text-primary"
          )}
        >
          {hidden ? (
            "R$ ••••••"
          ) : (
            <AnimatedNumber value={available} format={formatCurrency} />
          )}
        </p>
      </div>

      <div className="relative flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/40 px-3 py-1 text-xs font-medium text-muted-foreground">
          <CalendarDays className="size-3.5" />
          Dia {progress.day} de {progress.total}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/40 px-3 py-1 text-xs font-medium text-muted-foreground">
          {progress.percent}% do mês
        </span>
      </div>
    </motion.section>
  );
}
