import { MobileNav } from "./mobile-nav";
import { Sidebar } from "./sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-svh bg-background">
      <Sidebar />
      <MobileNav />
      <main className="md:pl-64">
        <div className="mx-auto w-full max-w-6xl px-4 pt-[calc(env(safe-area-inset-top,16px)+16px)] pb-[calc(72px+env(safe-area-inset-bottom,16px)+16px)] md:px-10 md:py-12">
          {children}
        </div>
      </main>
    </div>
  );
}
