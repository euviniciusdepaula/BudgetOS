import {
  History,
  Lightbulb,
  Repeat,
  Settings,
  Sparkles,
  Tags,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const navigation: NavItem[] = [
  { label: "Hoje", href: "/", icon: Wallet },
  { label: "Histórico", href: "/historico", icon: History },
  { label: "Categorias", href: "/categorias", icon: Tags },
  { label: "Gastos Fixos", href: "/gastos-fixos", icon: Repeat },
  { label: "Investimentos", href: "/investimentos", icon: TrendingUp },
  { label: "Simulações", href: "/simulacoes", icon: Sparkles },
  { label: "Insights", href: "/insights", icon: Lightbulb },
  { label: "Configurações", href: "/configuracoes", icon: Settings },
];

