"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Bell,
  Bot,
  Check,
  Clock,
  Settings,
  Zap,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type NotificationCategory = "task" | "approval" | "exception" | "integration" | "ai";
type NotificationPriority = "critical" | "warning" | "info";

interface Notification {
  id: number;
  priority: NotificationPriority;
  category: NotificationCategory;
  title: string;
  message: string;
  time: string;
  read: boolean;
}

// ---------------------------------------------------------------------------
// Mock data (§106)
// ---------------------------------------------------------------------------

const NOTIFICATIONS: Notification[] = [
  {
    id: 1,
    priority: "critical",
    category: "task",
    title: "James Rivera — Start date at risk",
    message:
      "Background check consent not submitted. Start date is 3 days away. Immediate action required.",
    time: "2 min ago",
    read: false,
  },
  {
    id: 2,
    priority: "critical",
    category: "exception",
    title: "W-9 rejected — Marcus Webb",
    message:
      "Entity name mismatch. Payroll cannot be activated until corrected.",
    time: "15 min ago",
    read: false,
  },
  {
    id: 3,
    priority: "warning",
    category: "integration",
    title: "Beeline VMS integration failed",
    message:
      "3 worker status updates failed to sync. Retry queue has 3 pending records.",
    time: "1 hr ago",
    read: false,
  },
  {
    id: 4,
    priority: "warning",
    category: "task",
    title: "SLA approaching — I-9 review",
    message: "Grace Okafor's I-9 Section 2 review is due in 4 hours.",
    time: "2 hr ago",
    read: false,
  },
  {
    id: 5,
    priority: "info",
    category: "approval",
    title: "Package approved — Raj Patel",
    message:
      "Apex Dynamics onboarding package has been approved by Devon Hughes.",
    time: "3 hr ago",
    read: false,
  },
  {
    id: 6,
    priority: "info",
    category: "ai",
    title: "AI recommendation — Lena Park",
    message:
      "Start date confidence score dropped to 71%. Equipment delivery at risk.",
    time: "4 hr ago",
    read: false,
  },
  {
    id: 7,
    priority: "info",
    category: "exception",
    title: "Screening complete — Grace Okafor",
    message:
      "Sterling background check returned clear. No adverse findings.",
    time: "Yesterday",
    read: true,
  },
  {
    id: 8,
    priority: "info",
    category: "task",
    title: "New candidate added — Aisha Bello",
    message:
      "Offer accepted. Package auto-generated. Onboarding started by Derek Okafor.",
    time: "Yesterday",
    read: true,
  },
  {
    id: 9,
    priority: "info",
    category: "exception",
    title: "Billing readiness gap — 2 candidates",
    message:
      "Marcus Webb and Raj Patel are missing PO numbers. Start dates approaching.",
    time: "2 days ago",
    read: true,
  },
  {
    id: 10,
    priority: "info",
    category: "ai",
    title: "AI bulk action completed",
    message:
      "Nudge sequence sent to 4 unresponsive candidates. All delivered successfully.",
    time: "2 days ago",
    read: true,
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const PRIORITY_BORDER: Record<NotificationPriority, string> = {
  critical: "border-l-2 border-l-danger",
  warning: "border-l-2 border-l-warning",
  info: "border-l-2 border-l-info",
};

const PRIORITY_ICON_COLOR: Record<NotificationPriority, string> = {
  critical: "text-danger",
  warning: "text-warning",
  info: "text-info",
};

const CATEGORY_ICON: Record<NotificationCategory, React.ElementType> = {
  task: Clock,
  approval: Check,
  exception: AlertTriangle,
  integration: Zap,
  ai: Bot,
};

type FilterTab = "all" | NotificationCategory;

const TABS: { id: FilterTab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "task", label: "Tasks" },
  { id: "approval", label: "Approvals" },
  { id: "exception", label: "Exceptions" },
  { id: "integration", label: "Integrations" },
  { id: "ai", label: "AI" },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function NotificationItem({ notification }: { notification: Notification }) {
  const Icon = CATEGORY_ICON[notification.category];

  return (
    <div
      className={cn(
        "flex items-start gap-3 px-4 py-3 transition-colors",
        PRIORITY_BORDER[notification.priority],
        notification.read
          ? "bg-card"
          : "bg-primary/5",
      )}
    >
      {/* Category icon */}
      <span
        className={cn(
          "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-muted",
          PRIORITY_ICON_COLOR[notification.priority],
        )}
      >
        <Icon className="size-3.5" aria-hidden />
      </span>

      {/* Body */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              "text-[13px] font-semibold leading-snug",
              notification.read ? "text-foreground/80" : "text-foreground",
            )}
          >
            {notification.title}
          </p>
          <span className="text-muted-foreground mt-0.5 shrink-0 text-[10px]">
            {notification.time}
          </span>
        </div>
        <p className="text-muted-foreground mt-0.5 line-clamp-2 text-[11px] leading-relaxed">
          {notification.message}
        </p>
        <div className="mt-1.5">
          <Link
            href="/planned/my-work"
            className="text-primary hover:text-primary/80 text-[11px] font-medium transition-colors"
          >
            View
          </Link>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function NotificationCenter({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [notifications, setNotifications] =
    useState<Notification[]>(NOTIFICATIONS);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filtered =
    activeTab === "all"
      ? notifications
      : notifications.filter((n) => n.category === activeTab);

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-sm">
        {/* ---------------------------------------------------------------- */}
        {/* Header                                                            */}
        {/* ---------------------------------------------------------------- */}
        <SheetHeader className="border-b px-4 py-3">
          <div className="flex items-center justify-between pr-8">
            <div className="flex items-center gap-2">
              <Bell className="text-muted-foreground size-4" />
              <SheetTitle className="text-[15px]">Notifications</SheetTitle>
              {unreadCount > 0 && (
                <Badge
                  variant="secondary"
                  className="bg-danger text-white text-[10px] px-1.5 py-0 h-4 min-w-4 flex items-center justify-center"
                >
                  {unreadCount}
                </Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-[11px] text-muted-foreground hover:text-foreground px-2"
              onClick={markAllRead}
              disabled={unreadCount === 0}
            >
              Mark all read
            </Button>
          </div>
        </SheetHeader>

        {/* ---------------------------------------------------------------- */}
        {/* Filter tabs                                                       */}
        {/* ---------------------------------------------------------------- */}
        <div className="border-b px-4 py-2">
          <div className="flex items-center gap-0.5 overflow-x-auto">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              const tabCount =
                tab.id === "all"
                  ? notifications.filter((n) => !n.read).length
                  : notifications.filter(
                      (n) => n.category === tab.id && !n.read,
                    ).length;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex shrink-0 items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors",
                    isActive
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                  )}
                >
                  {tab.label}
                  {tabCount > 0 && (
                    <span
                      className={cn(
                        "flex h-3.5 min-w-3.5 items-center justify-center rounded-full px-1 text-[9px] font-semibold",
                        isActive
                          ? "bg-foreground/15 text-foreground"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {tabCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Notification list                                                 */}
        {/* ---------------------------------------------------------------- */}
        <div className="flex-1 overflow-y-auto divide-y divide-border/60">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-6">
              <Bell className="text-muted-foreground/40 mb-3 size-8" />
              <p className="text-sm font-medium text-foreground/70">
                No notifications
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                You're all caught up in this category.
              </p>
            </div>
          ) : (
            filtered.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
              />
            ))
          )}
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Footer                                                            */}
        {/* ---------------------------------------------------------------- */}
        <div className="border-t bg-muted/30 px-4 py-3 flex items-center justify-between">
          <Link
            href="/planned/notifications"
            className="text-primary hover:text-primary/80 text-xs font-medium transition-colors"
          >
            View all notifications
          </Link>
          <Link
            href="/planned/settings"
            className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs transition-colors"
          >
            <Settings className="size-3" />
            Settings
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
}
