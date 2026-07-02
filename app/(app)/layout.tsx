import { AppShell } from "@/components/layout/app-shell";
import { VaultGate } from "@/features/auth";
import { MonthGate } from "@/features/month";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <VaultGate>
      <MonthGate>
        <AppShell>{children}</AppShell>
      </MonthGate>
    </VaultGate>
  );
}
