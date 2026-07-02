"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { navigation } from "@/lib/navigation";

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function MobileNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-sidebar-border bg-sidebar/90 backdrop-blur md:hidden">
      <div className="flex h-14 items-center gap-2.5 px-4">
        <span className="flex size-6 items-center justify-center rounded-md bg-primary">
          <Sparkles className="size-3.5 text-primary-foreground" />
        </span>
        <span className="text-sm font-semibold tracking-tight">BudgetOS</span>
      </div>
      <nav className="flex gap-1 overflow-x-auto px-3 pb-3 [scrollbar-width:none]">
        {navigation.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="size-3.5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
