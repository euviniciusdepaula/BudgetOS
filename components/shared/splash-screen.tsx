import { Sparkles } from "lucide-react";

export function SplashScreen() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <span className="flex size-10 animate-pulse items-center justify-center rounded-xl bg-primary">
          <Sparkles className="size-5 text-primary-foreground" />
        </span>
        <p className="text-xs text-muted-foreground">Carregando…</p>
      </div>
    </div>
  );
}
