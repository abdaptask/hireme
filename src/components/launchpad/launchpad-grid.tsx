"use client";

/**
 * Persona Launchpad grid — a category-grouped icon grid surfaced inside the
 * Cmd+J slide-out (see launchpad-sheet.tsx). Inspired by the JobDiva
 * launchpad but adapted for a narrow slide-out: each category renders as a
 * heading above a 3-column (4 on wider) grid of square icon tiles.
 *
 * The earlier version used a side-band label + 6-8 column grid that worked
 * full-width but collapsed unreadably in the slide-out; this layout keeps
 * the visual identity while reserving full width for the tile area.
 *
 * Tiles are declared in `src/lib/launchpad.ts` by icon NAME; this renderer
 * maps each name to a lucide-react component. Optional badge counts come
 * from the host page so the launchpad never has to know domain data.
 */

import Link from "next/link";
import {
  Activity,
  AlertCircle,
  AtSign,
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  ArrowRightLeft,
  Award,
  BarChart3,
  Bell,
  Bot,
  Briefcase,
  Building,
  Building2,
  Calendar,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  CheckCircle,
  CircleDashed,
  CircleDot,
  ClipboardCheck,
  ClipboardList,
  Clock,
  Coffee,
  Crown,
  Database,
  DollarSign,
  Eye,
  FileCheck,
  FileMinus,
  FileSearch,
  FileSignature,
  FileText,
  FileType,
  Flag,
  Flame,
  FlaskConical,
  Gauge,
  GitBranch,
  GraduationCap,
  Handshake,
  Heart,
  HelpCircle,
  History,
  IdCard,
  Inbox,
  KeyRound,
  Laptop,
  Layers,
  LineChart,
  ListChecks,
  ListTodo,
  Lock,
  type LucideIcon,
  Mail,
  Megaphone,
  MessageCircle,
  MessageSquare,
  NotebookPen,
  Package,
  Pause,
  Phone,
  PlayCircle,
  Plug,
  Receipt,
  Scale,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Trophy,
  Upload,
  User,
  UserCheck,
  UserCog,
  UserPlus,
  UserSearch,
  Users,
  UsersRound,
  Wallet,
  Workflow,
  Wrench,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  LaunchpadCategory,
  LaunchpadConfig,
  LaunchpadTile,
  LaunchpadTone,
} from "@/lib/launchpad";

/* ------------------------------ icon registry ----------------------------- */

const ICON_MAP: Record<string, LucideIcon> = {
  Activity,
  AlertCircle,
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  ArrowRightLeft,
  AtSign,
  Award,
  BarChart3,
  Bell,
  Bot,
  Briefcase,
  Building,
  Building2,
  Calendar,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  CheckCircle,
  CircleDashed,
  ClipboardCheck,
  ClipboardList,
  Clock,
  Coffee,
  Crown,
  Database,
  DollarSign,
  Eye,
  FileCheck,
  FileMinus,
  FileSearch,
  FileSignature,
  FileText,
  FileType,
  Flag,
  Flame,
  FlaskConical,
  Gauge,
  GitBranch,
  GraduationCap,
  Handshake,
  Heart,
  HelpCircle,
  History,
  IdCard,
  Inbox,
  KeyRound,
  Laptop,
  Layers,
  LineChart,
  ListChecks,
  ListTodo,
  Lock,
  Mail,
  Megaphone,
  MessageCircle,
  MessageSquare,
  NotebookPen,
  Package,
  Pause,
  Phone,
  PlayCircle,
  Plug,
  Receipt,
  Scale,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Trophy,
  Upload,
  User,
  UserCheck,
  UserCog,
  UserPlus,
  UserSearch,
  Users,
  UsersRound,
  Wallet,
  Workflow,
  Wrench,
  Zap,
};

function resolveIcon(name: string): LucideIcon {
  return ICON_MAP[name] ?? CircleDot;
}

/* -------------------------------- styling -------------------------------- */

type ToneStyle = {
  /** Tile background + ring + hover. */
  tile: string;
  /** Icon foreground. */
  icon: string;
  /** Category strip / dot. */
  band: string;
  /** Category label color. */
  label: string;
};

const TONE_STYLES: Record<LaunchpadTone, ToneStyle> = {
  green: {
    tile: "bg-success/10 ring-success/20 hover:bg-success/15",
    icon: "text-success",
    band: "bg-success",
    label: "text-success",
  },
  blue: {
    tile: "bg-info/10 ring-info/20 hover:bg-info/15",
    icon: "text-info",
    band: "bg-info",
    label: "text-info",
  },
  purple: {
    tile: "bg-purple-500/10 ring-purple-500/20 hover:bg-purple-500/15",
    icon: "text-purple-600 dark:text-purple-400",
    band: "bg-purple-500",
    label: "text-purple-600 dark:text-purple-400",
  },
  orange: {
    tile: "bg-warning/10 ring-warning/20 hover:bg-warning/15",
    icon: "text-warning",
    band: "bg-warning",
    label: "text-warning",
  },
  red: {
    tile: "bg-danger/10 ring-danger/20 hover:bg-danger/15",
    icon: "text-danger",
    band: "bg-danger",
    label: "text-danger",
  },
  yellow: {
    tile: "bg-yellow-500/10 ring-yellow-500/20 hover:bg-yellow-500/15",
    icon: "text-yellow-600 dark:text-yellow-400",
    band: "bg-yellow-500",
    label: "text-yellow-600 dark:text-yellow-400",
  },
  teal: {
    tile: "bg-teal-500/10 ring-teal-500/20 hover:bg-teal-500/15",
    icon: "text-teal-600 dark:text-teal-400",
    band: "bg-teal-500",
    label: "text-teal-600 dark:text-teal-400",
  },
  rose: {
    tile: "bg-rose-500/10 ring-rose-500/20 hover:bg-rose-500/15",
    icon: "text-rose-600 dark:text-rose-400",
    band: "bg-rose-500",
    label: "text-rose-600 dark:text-rose-400",
  },
  indigo: {
    tile: "bg-indigo-500/10 ring-indigo-500/20 hover:bg-indigo-500/15",
    icon: "text-indigo-600 dark:text-indigo-400",
    band: "bg-indigo-500",
    label: "text-indigo-600 dark:text-indigo-400",
  },
};

/* --------------------------------- tile ---------------------------------- */

function TileButton({
  tile,
  tone,
  badge,
}: {
  tile: LaunchpadTile;
  tone: LaunchpadTone;
  badge?: number;
}) {
  const Icon = resolveIcon(tile.icon);
  const style = TONE_STYLES[tone];
  const showBadge = typeof badge === "number" && badge > 0;

  return (
    <Link
      href={tile.href}
      className={cn(
        // overflow-hidden is critical — labels wrap inside the tile rather
        // than bleeding into the neighbor (the bug that made the grid look
        // like a scrambled cipher in narrow slide-out widths).
        "group relative flex aspect-square flex-col items-center justify-center gap-2 overflow-hidden rounded-xl p-2.5 ring-1 transition-all",
        "hover:scale-105 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        style.tile,
      )}
      aria-label={showBadge ? `${tile.label} (${badge})` : tile.label}
    >
      {showBadge && (
        <span
          className="bg-danger text-danger-foreground absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-semibold leading-none ring-2 ring-background"
          aria-hidden
        >
          {badge > 99 ? "99+" : badge}
        </span>
      )}
      <Icon className={cn("size-5 shrink-0", style.icon)} aria-hidden />
      <span className="line-clamp-2 break-words text-center text-[11px] font-medium leading-tight text-foreground">
        {tile.label}
      </span>
    </Link>
  );
}

/* ------------------------------- category -------------------------------- */

function CategoryRow({
  category,
  badgeCounts,
}: {
  category: LaunchpadCategory;
  badgeCounts?: Record<string, number>;
}) {
  const style = TONE_STYLES[category.tone];

  return (
    <section className="border-b py-4 last:border-0">
      {/* Category heading — stacked above the tile grid. Tested in the
          slide-out (~640px content); a side-band label collapses the tile
          area below readability. */}
      <div className="mb-3 flex items-center gap-2">
        <span
          aria-hidden
          className={cn("h-4 w-1 shrink-0 rounded-full", style.band)}
        />
        <h3
          className={cn(
            "text-xs font-semibold uppercase tracking-wide",
            style.label,
          )}
        >
          {category.label}
        </h3>
      </div>

      {/* Tile grid — 3 columns on small screens, 4 on the wider slide-out.
          Each tile is aspect-square and clips its label so neighbors never
          collide. */}
      <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
        {category.tiles.map((tile) => (
          <TileButton
            key={`${category.id}-${tile.label}`}
            tile={tile}
            tone={category.tone}
            badge={tile.badgeKey ? badgeCounts?.[tile.badgeKey] : undefined}
          />
        ))}
      </div>
    </section>
  );
}

/* --------------------------------- grid ---------------------------------- */

export function LaunchpadGrid({
  config,
  badgeCounts,
}: {
  config: LaunchpadConfig;
  badgeCounts?: Record<string, number>;
}) {
  return (
    <div className="flex flex-col">
      {config.categories.map((category) => (
        <CategoryRow
          key={category.id}
          category={category}
          badgeCounts={badgeCounts}
        />
      ))}
    </div>
  );
}
