import Link from "next/link";
import { CircleHelp, Sparkles } from "lucide-react";
import { ThemeToggle } from "@/components/shell/theme-toggle";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CANDIDATE } from "@/lib/portal-data";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const initials = CANDIDATE.fullName
    .split(" ")
    .map((n) => n[0])
    .join("");

  return (
    <div className="bg-muted/40 min-h-dvh">
      <header className="bg-background/85 sticky top-0 z-30 border-b backdrop-blur">
        <div className="mx-auto flex h-14 max-w-2xl items-center gap-2 px-4">
          <Link href="/portal" className="flex items-center gap-2">
            <span className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg">
              <Sparkles className="size-4.5" />
            </span>
            <span className="flex flex-col leading-none">
              <span className="text-[15px] font-semibold tracking-tight">
                HireMe
              </span>
              <span className="text-muted-foreground text-[10px]">
                Your onboarding
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
      <main className="mx-auto max-w-2xl px-4 py-5">{children}</main>
    </div>
  );
}
