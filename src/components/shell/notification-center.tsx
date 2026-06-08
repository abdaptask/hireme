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
import { relativeTime } from "@/lib/clock";
import { useEntitlements } from "@/components/providers/entitlements-provider";
import {
  useViewerNotifications,
  type Notification,
  type NotificationCategory,
  type NotificationPriority,
} from "@/lib/notifications";

// ---------------------------------------------------------------------------
// Visual helpers
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
// Item
// ---------------------------------------------------------------------------

function NotificationItem({
  notification,
  onClick,
}: {
  notification: Notification;
  onClick: () => void;
}) {
  const Icon = CATEGORY_ICON[notification.category];

  return (
    <div
      className={cn(
        "flex items-start gap-3 px-4 py-3 transition-colors",
        PRIORITY_BORDER[notification.priority],
        notification.read ? "bg-card" : "bg-primary/5",
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-muted",
          PRIORITY_ICON_COLOR[notification.priority],
        )}
      >
        <Icon className="size-3.5" aria-hidden />
      </span>

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
            {relativeTime(notification.occurredAt)}
          </span>
        </div>
        <p className="text-muted-foreground mt-0.5 line-clamp-2 text-[11px] leading-relaxed">
          {notification.message}
        </p>
        <div className="mt-1.5">
          <Link
            href={notification.href ?? "/planned/my-work"}
            onClick={onClick}
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
  const { viewAs } = useEntitlements();
  const { notifications, unreadCount, noInbox, markAllRead, markRead } =
    useViewerNotifications(viewAs);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  const filtered =
    activeTab === "all"
      ? notifications
      : notifications.filter((n) => n.category === activeTab);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-sm"
      >
        {/* Header */}
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

        {/* Filter tabs */}
        {!noInbox && (
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
        )}

        {/* Notification list */}
        <div className="flex-1 overflow-y-auto divide-y divide-border/60">
          {noInbox ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-6">
              <Bell className="text-muted-foreground/40 mb-3 size-8" />
              <p className="text-sm font-medium text-foreground/70">
                No notifications for your view
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                External portal roles use a dedicated alert channel.
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-6">
              <Bell className="text-muted-foreground/40 mb-3 size-8" />
              <p className="text-sm font-medium text-foreground/70">
                No notifications
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                You&apos;re all caught up in this category.
              </p>
            </div>
          ) : (
            filtered.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onClick={() => markRead(notification.id)}
              />
            ))
          )}
        </div>

        {/* Footer */}
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
