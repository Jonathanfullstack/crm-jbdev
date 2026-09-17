"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { markAllNotificationsReadAction, markNotificationReadAction } from "@/actions/notifications";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatRelative } from "@/lib/format";

type Item = {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  readAt: Date | null;
  createdAt: Date;
};

export function NotificationsBell({ items }: { items: Item[] }) {
  const unread = items.filter((item) => !item.readAt).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notificações">
          <Bell className="h-4 w-4" />
          {unread > 0 ? (
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500" />
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          Notificações
          {unread > 0 ? (
            <button
              type="button"
              className="text-xs text-primary"
              onClick={() => markAllNotificationsReadAction()}
            >
              Marcar todas
            </button>
          ) : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.length === 0 ? (
          <div className="px-3 py-6 text-center text-sm text-muted-foreground">Nenhuma notificação</div>
        ) : (
          items.slice(0, 8).map((item) => (
            <DropdownMenuItem key={item.id} asChild>
              <Link
                href={item.link ?? "/"}
                className="flex flex-col items-start gap-1"
                onClick={() => markNotificationReadAction(item.id)}
              >
                <span className="text-sm font-medium">{item.title}</span>
                {item.body ? <span className="text-xs text-muted-foreground">{item.body}</span> : null}
                <span className="text-[11px] text-muted-foreground">{formatRelative(item.createdAt)}</span>
              </Link>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
