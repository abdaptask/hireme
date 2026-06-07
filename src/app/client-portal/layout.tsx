import Link from "next/link";
import { Building2, CircleHelp } from "lucide-react";
import { ThemeToggle } from "@/components/shell/theme-toggle";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CURRENT_CLIENT } from "@/lib/candidates";

export default function ClientPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const initials = CURRENT_CLIENT.split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("");

  return (
    <div className="bg-muted/40 min-h-dvh">
      <header className="bg-background/85 sticky top-0 z-30 border-b backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-2 px-4">
          <Link href="/client-portal" className="flex items-center gap-2.5">
            <span className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg">
              <Building2 className="size-4.5" />
            </span>
            <span className="flex flex-col leading-none">
              <span className="text-[15px] font-semibold tracking-tight">
                {CURRENT_CLIENT}
              </span>
              <span className="text-muted-foreground text-[10px] tracking-wide">
                Client Portal · powered by HireMe
              </span>
            </span>
          </Link>
          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
            <Button variant="ghost" size="icon" aria-label="Help">
              <CircleHelp className="size-4.5" />
            </Button>
            <Avatar className="ml-1 size-8">
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-5">{children}</main>
    </div>
  );
}
