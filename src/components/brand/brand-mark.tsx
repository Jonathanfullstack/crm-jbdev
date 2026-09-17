import { Users } from "lucide-react";
import { cn, initials } from "@/lib/utils";

export function BrandMark({
  name,
  logoUrl,
  className,
  iconClassName,
}: {
  name: string;
  logoUrl?: string | null;
  className?: string;
  iconClassName?: string;
}) {
  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={logoUrl} alt={name} className={cn("h-9 w-9 rounded-lg object-cover", className)} />
    );
  }

  const letters = initials(name);
  if (name && name !== "CRM" && letters) {
    return (
      <div
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground",
          className,
        )}
      >
        {letters}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground",
        className,
      )}
      aria-hidden
    >
      <Users className={cn("h-4 w-4", iconClassName)} />
    </div>
  );
}
