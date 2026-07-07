import { MobileNav } from "./mobile-nav";
import { Sidebar } from "./sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-svh md:h-auto flex flex-col md:block overflow-hidden md:overflow-visible bg-background">
      <Sidebar />
      <MobileNav />
      <main className="flex-1 md:flex-none overflow-y-auto md:overflow-visible md:pl-64">
        <div className="mx-auto w-full max-w-6xl px-4 pt-[calc(env(safe-area-inset-top,16px)+16px)] pb-[calc(80px+env(safe-area-inset-bottom,16px)+16px)] md:px-10 md:py-12">
          {children}
        </div>
      </main>
    </div>
  );
}
