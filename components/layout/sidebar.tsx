"use client";

import { usePathname } from "next/navigation";
import { Sparkles } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useVault } from "@/hooks/use-vault";
import { navigation } from "@/lib/navigation";
import { SidebarItem } from "./sidebar-item";

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function Sidebar() {
  const pathname = usePathname();
  const { data: vault } = useVault();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar md:flex">
      <div className="flex items-center gap-3 px-6 pt-6 pb-5">
        <span className="flex size-9 items-center justify-center rounded-[14px] bg-primary shadow-[0_0_24px_-6px_var(--primary)]">
          <Sparkles className="size-4.5 text-primary-foreground" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold tracking-tight text-sidebar-foreground">
            BudgetOS
          </p>
          <p className="text-[11px] text-muted-2">Copiloto financeiro</p>
        </div>
      </div>

      <ScrollArea className="flex-1 px-3 py-2">
        <nav className="flex flex-col gap-1">
          {navigation.map((item) => (
            <SidebarItem
              key={item.href}
              item={item}
              active={isActive(pathname, item.href)}
            />
          ))}
        </nav>
      </ScrollArea>

      <div className="border-t border-sidebar-border px-4 py-4">
        <div className="flex items-center gap-3 rounded-[16px] px-2 py-1.5 transition-colors hover:bg-sidebar-accent">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/80 to-positive-deep text-sm font-semibold text-primary-foreground">
            {(vault?.name ?? "B").charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-sidebar-foreground">
              {vault?.name ?? "Cofre"}
            </p>
            <p className="flex items-center gap-1.5 text-[11px] text-muted-2">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary/60" />
                <span className="relative inline-flex size-1.5 rounded-full bg-primary" />
              </span>
              Cofre desbloqueado
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
