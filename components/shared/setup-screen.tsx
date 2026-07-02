import { Database } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function SetupScreen() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background px-6">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <span className="mb-2 flex size-10 items-center justify-center rounded-xl border bg-card">
            <Database className="size-5 text-muted-foreground" />
          </span>
          <CardTitle>Conecte o Supabase</CardTitle>
          <CardDescription>
            O BudgetOS precisa de um projeto Supabase para guardar seus dados.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <ol className="list-decimal space-y-2 pl-4">
            <li>
              Crie um projeto gratuito em{" "}
              <span className="text-foreground">supabase.com</span>.
            </li>
            <li>
              No SQL Editor, execute o conteúdo de{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
                supabase/migrations/20260701000001_core_schema.sql
              </code>
              .
            </li>
            <li>
              Copie a URL e a chave anon (Settings → API) para um arquivo{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
                .env.local
              </code>
              :
            </li>
          </ol>
          <pre className="rounded-lg border bg-muted/40 p-3 font-mono text-xs leading-relaxed text-foreground">
            {`NEXT_PUBLIC_SUPABASE_URL=https://<projeto>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<chave-anon>`}
          </pre>
          <p>Depois reinicie o servidor de desenvolvimento.</p>
        </CardContent>
      </Card>
    </div>
  );
}
