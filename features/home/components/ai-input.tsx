"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, ArrowUp, Mic, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";
import type { Category, Month } from "@/types/domain";
import { formatCurrency } from "@/utils/format";
import { useAiMessage } from "../hooks/use-ai-message";
import { useRegisterExpense } from "../hooks/use-register-expense";

interface PickerData {
  categories: Category[];
  amount: number;
  description: string;
  date: string;
}

export function AiInput({ month }: { month: Month }) {
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerData, setPickerData] = useState<PickerData | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");

  const ai = useAiMessage();
  const registerExpense = useRegisterExpense();

  async function send() {
    const trimmed = message.trim();
    if (!trimmed || ai.isPending) return;

    setMessage("");
    setReply(null);

    try {
      const result = await ai.mutateAsync({
        message: trimmed,
        monthId: month.id,
      });

      // Categoria ambígua → abre o seletor para concluir o lançamento
      if (
        result.actionExecuted === "unknown" &&
        result.payload?.reason === "category_not_identified" &&
        result.data?.categories
      ) {
        setPickerData({
          categories: result.data.categories,
          amount: result.data.amount || 0,
          description: result.data.description || trimmed,
          date: result.data.date || new Date().toISOString().split("T")[0],
        });
        setSelectedCategoryId("");
        setPickerOpen(true);
      }
      setReply(result.content);
    } catch {
      // Erro é tratado pelo onError no hook
    }
  }

  async function handleConfirmCategory() {
    if (!pickerData || !selectedCategoryId) return;

    await registerExpense.mutateAsync({
      month,
      amount: pickerData.amount,
      categoryId: selectedCategoryId,
      description: pickerData.description,
      date: pickerData.date,
    });

    setPickerOpen(false);
    setPickerData(null);
  }

  return (
    <section className="mx-auto w-full max-w-[780px]">
      <div className="relative rounded-[18px] border bg-card shadow-[0_1px_2px_rgb(0_0_0/0.35)] transition-all focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/12">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="O que aconteceu hoje?"
          className="min-h-[58px] resize-none border-0 bg-transparent p-4 pr-24 text-[15px] shadow-none focus-visible:ring-0 dark:bg-transparent"
        />
        <div className="absolute right-3 bottom-3 flex items-center gap-1.5">
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Entrada por voz (em breve)"
                  className="cursor-not-allowed text-muted-2"
                  onClick={(e) => e.preventDefault()}
                >
                  <Mic />
                </Button>
              }
            />
            <TooltipContent>Entrada por voz — em breve</TooltipContent>
          </Tooltip>
          <Button
            size="icon"
            aria-label="Enviar"
            disabled={!message.trim() || ai.isPending}
            onClick={send}
            className="rounded-[12px]"
          >
            <ArrowUp />
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {(ai.isPending || reply) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 flex items-start gap-3 rounded-[14px] border border-primary/15 bg-primary/5 px-4 py-3.5">
              <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
              {ai.isPending ? (
                <p className="flex items-center gap-1 py-1">
                  <span className="size-1.5 animate-bounce rounded-full bg-primary/70" />
                  <span
                    className="size-1.5 animate-bounce rounded-full bg-primary/70"
                    style={{ animationDelay: "150ms" }}
                  />
                  <span
                    className="size-1.5 animate-bounce rounded-full bg-primary/70"
                    style={{ animationDelay: "300ms" }}
                  />
                </p>
              ) : (
                <>
                  <p className="flex-1 text-sm leading-relaxed whitespace-pre-line">
                    {reply}
                  </p>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    aria-label="Dispensar resposta"
                    onClick={() => setReply(null)}
                    className="text-muted-foreground"
                  >
                    <X />
                  </Button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Dialog open={pickerOpen} onOpenChange={(o) => setPickerOpen(o)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="size-5 text-warning" />
              <DialogTitle>Categoria não identificada</DialogTitle>
            </div>
            <DialogDescription>
              A IA não conseguiu determinar a categoria de forma precisa.
              Escolha manualmente para concluir o lançamento.
            </DialogDescription>
          </DialogHeader>

          {pickerData && (
            <div className="space-y-4 py-2">
              <div className="space-y-1.5 rounded-[14px] border bg-muted/40 p-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Lançamento:</span>
                  <span className="font-semibold">{pickerData.description}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Valor:</span>
                  <span className="font-semibold">
                    {formatCurrency(pickerData.amount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Data:</span>
                  <span className="font-semibold">{pickerData.date}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="picker-category">Escolha a categoria</Label>
                <Select
                  value={selectedCategoryId || null}
                  onValueChange={(val) => setSelectedCategoryId(val as string)}
                  items={pickerData.categories.map((c) => ({
                    value: c.id,
                    label: `${c.emoji} ${c.name}`,
                  }))}
                >
                  <SelectTrigger id="picker-category" className="w-full">
                    <SelectValue placeholder="Selecione…" />
                  </SelectTrigger>
                  <SelectContent>
                    {pickerData.categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.emoji} {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setPickerOpen(false);
                setPickerData(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleConfirmCategory}
              disabled={!selectedCategoryId || registerExpense.isPending}
            >
              Confirmar lançamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
