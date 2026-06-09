/**
 * Administration hub index.
 *
 * Reads from `src/lib/admin-hub.ts` (single source of truth) and renders
 * a grouped tile grid that links to each admin sub-page. Tiles flagged
 * `redirect: true` route outside the admin tree (e.g. `/clients`) and
 * surface an up-right arrow as a hint.
 */

import Link from "next/link";
import {
  ArrowLeftRight,
  ArrowUpRight,
  Building2,
  type LucideIcon,
  CircleDot,
  Database,
  FileText,
  Gift,
  Handshake,
  HeartPulse,
  LayoutDashboard,
  PackageOpen,
  Receipt,
  RefreshCw,
  ShieldCheck,
  Users,
} from "lucide-react";
import { PageContainer, PageHeader } from "@/components/page";
import { Badge } from "@/components/ui/badge";
import {
  ADMIN_SECTIONS,
  type AdminEntry,
  type AdminTone,
} from "@/lib/admin-hub";
import { cn } from "@/lib/utils";

/* ------------------------------ icon registry ----------------------------- */

const ICON_MAP: Record<string, LucideIcon> = {
  ArrowLeftRight,
  Building2,
  Database,
  FileText,
  Gift,
  Handshake,
  HeartPulse,
  LayoutDashboard,
  PackageOpen,
  Receipt,
  RefreshCw,
  ShieldCheck,
  Users,
};

function resolveIcon(name: string): LucideIcon {
  return ICON_MAP[name] ?? CircleDot;
}

/* -------------------------------- tones ---------------------------------- */

const TONE_CLS: Record<AdminTone, string> = {
  blue: "bg-info/10 text-info",
  purple: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  orange: "bg-warning/10 text-warning",
  red: "bg-danger/10 text-danger",
  green: "bg-success/10 text-success",
  teal: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
};

/* --------------------------------- tile ---------------------------------- */

function AdminTile({ entry }: { entry: AdminEntry }) {
  const Icon = resolveIcon(entry.icon);
  return (
    <Link
      href={entry.href}
      className="bg-card hover:border-primary/40 group rounded-xl border p-4 shadow-xs transition-colors"
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-lg",
            TONE_CLS[entry.tone],
          )}
        >
          <Icon className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-card-heading">{entry.label}</h3>
            {entry.redirect && (
              <ArrowUpRight className="text-muted-foreground size-3.5" />
            )}
          </div>
          <p className="text-muted-foreground mt-0.5 text-sm leading-snug">
            {entry.description}
          </p>
          {entry.badge && (
            <Badge variant="secondary" className="mt-2 text-[10px]">
              {entry.badge}
            </Badge>
          )}
        </div>
      </div>
    </Link>
  );
}

/* --------------------------------- page ---------------------------------- */

export default function AdministrationPage() {
  return (
    <PageContainer className="flex flex-col gap-8">
      <PageHeader
        title="Administration"
        description="Platform configuration and operations"
      />

      {ADMIN_SECTIONS.map((section) => (
        <section key={section.id} className="flex flex-col gap-3">
          <div>
            <h2 className="text-section-heading">{section.label}</h2>
            <p className="text-muted-foreground text-sm">
              {section.description}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {section.entries.map((entry) => (
              <AdminTile key={entry.id} entry={entry} />
            ))}
          </div>
        </section>
      ))}
    </PageContainer>
  );
}
