import { MobileNav } from "./mobile-nav";
import { Sidebar } from "./sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-svh bg-background">
      <Sidebar />
      <MobileNav />
      <main className="md:pl-64">
        <div className="mx-auto w-full max-w-6xl px-6 py-10 md:px-10 md:py-12">
          {children}
        </div>
      </main>
    </div>
  );
}
