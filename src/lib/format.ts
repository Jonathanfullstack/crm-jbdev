import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns";
import { ptBR } from "date-fns/locale";

export function formatCurrency(value: number | null | undefined) {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatDate(value: Date | string | null | undefined) {
  if (!value) return "—";
  return format(new Date(value), "dd/MM/yyyy", { locale: ptBR });
}

export function formatDateTime(value: Date | string | null | undefined) {
  if (!value) return "—";
  return format(new Date(value), "dd/MM/yyyy HH:mm", { locale: ptBR });
}

export function formatRelative(value: Date | string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (isToday(date)) return `Hoje, ${format(date, "HH:mm")}`;
  if (isYesterday(date)) return `Ontem, ${format(date, "HH:mm")}`;
  return formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
}

export function formatPercent(value: number | null | undefined) {
  if (value === null || value === undefined) return "—";
  return `${Math.round(value)}%`;
}

export function phoneHref(phone?: string | null) {
  if (!phone) return null;
  return `tel:${phone.replace(/\D/g, "")}`;
}

export function whatsappHref(phone?: string | null) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  return `https://wa.me/${digits}`;
}

export function emailHref(email?: string | null) {
  if (!email) return null;
  return `mailto:${email}`;
}
