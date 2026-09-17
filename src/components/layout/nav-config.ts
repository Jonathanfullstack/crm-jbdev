import {
  Building2,
  CalendarCheck2,
  CalendarDays,
  ChartColumn,
  CheckSquare,
  Contact,
  FileText,
  LayoutDashboard,
  Package,
  Settings,
  Target,
  Users,
  Kanban,
  UserRound,
} from "lucide-react";

export const mainNav = [
  { href: "/", label: "Visão geral", icon: LayoutDashboard },
  { href: "/leads", label: "Leads", icon: Contact },
  { href: "/pipeline", label: "Funil", icon: Kanban },
  { href: "/clients", label: "Clientes", icon: UserRound },
  { href: "/companies", label: "Empresas", icon: Building2 },
  { href: "/opportunities", label: "Oportunidades", icon: Target },
  { href: "/proposals", label: "Propostas", icon: FileText },
  { href: "/tasks", label: "Tarefas", icon: CheckSquare },
  { href: "/follow-ups", label: "Follow-ups", icon: CalendarCheck2 },
  { href: "/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/products", label: "Produtos", icon: Package },
  { href: "/reports", label: "Relatórios", icon: ChartColumn, permission: "reports:read" as const },
];

export const bottomNav = [
  { href: "/users", label: "Usuários", icon: Users, permission: "users:manage" as const },
  { href: "/settings", label: "Configurações", icon: Settings, permission: "settings:manage" as const },
];
