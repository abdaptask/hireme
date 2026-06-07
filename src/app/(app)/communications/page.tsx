"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Globe,
  Mail,
  MessageSquare,
  Phone,
  Send,
  MailCheck,
  MailOpen,
  MailX,
} from "lucide-react";
import { PageContainer, PageHeader } from "@/components/page";
import { StatTile } from "@/components/workspace/stat-tile";
import { StatusBadge } from "@/components/status-badge";
import { cn } from "@/lib/utils";
import {
  CHANNEL_META,
  COMM_STATUS_META,
  COMMUNICATIONS,
  commStats,
} from "@/lib/communications";
import type { CommChannel } from "@/lib/communications";

const CHANNEL_ICONS: Record<CommChannel, React.ComponentType<{ className?: string }>> = {
  email: Mail,
  sms: MessageSquare,
  portal: Globe,
  voice: Phone,
};

const CHANNEL_FILTERS: { key: CommChannel | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "email", label: "Email" },
  { key: "sms", label: "SMS" },
  { key: "portal", label: "Portal" },
  { key: "voice", label: "Voice" },
];

function nudgeTone(level: number): string {
  if (level <= 2) return "bg-info-muted text-info-muted-foreground";
  if (level <= 4) return "bg-warning-muted text-warning-muted-foreground";
  return "bg-danger-muted text-danger-muted-foreground";
}

export default function CommunicationsPage() {
  const stats = commStats();
  const [channelFilter, setChannelFilter] = useState<CommChannel | "all">("all");

  const rows = useMemo(() => {
    if (channelFilter === "all") return COMMUNICATIONS;
    return COMMUNICATIONS.filter((c) => c.channel === channelFilter);
  }, [channelFilter]);

  return (
    <PageContainer className="flex flex-col gap-6">
      <PageHeader
        title="Communications Command Center"
        description="Unified email, SMS, portal, and voice channel tracking with nudge escalation protocol (§24, §13)."
      />

      {/* KPI tiles */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile icon={Send} label="Total sent" value={stats.sent} />
        <StatTile
          icon={MailCheck}
          label="Delivered"
          value={stats.delivered}
          tone="success"
        />
        <StatTile
          icon={MailOpen}
          label="Opened / replied"
          value={stats.opened}
          tone="info"
        />
        <StatTile
          icon={MailX}
          label="Failed / bounced"
          value={stats.failed}
          tone="danger"
        />
      </div>

      {/* Table card */}
      <section className="bg-card overflow-hidden rounded-xl border shadow-xs">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 border-b px-4 py-2.5">
          <h2 className="text-card-heading mr-auto">Communications</h2>
          <div className="flex items-center gap-1.5">
            {CHANNEL_FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setChannelFilter(f.key)}
                className={cn(
                  "rounded-md px-3 py-1 text-sm font-medium transition-colors",
                  channelFilter === f.key
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
          <span className="text-muted-foreground text-xs tabular-nums">
            {rows.length} records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table
            className="w-full border-collapse text-left"
            style={{ fontSize: "var(--table-font)" }}
          >
            <thead className="text-muted-foreground border-b">
              <tr>
                {[
                  "Candidate",
                  "Client",
                  "Channel",
                  "Subject",
                  "Template",
                  "Status",
                  "Sent By",
                  "Sent At",
                  "Nudge",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-3 font-medium whitespace-nowrap"
                    style={{ height: "var(--row-h)" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((comm) => {
                const ChannelIcon = CHANNEL_ICONS[comm.channel];
                const statusMeta = COMM_STATUS_META[comm.status];
                return (
                  <tr
                    key={comm.id}
                    className="hover:bg-muted/50 border-b last:border-0"
                  >
                    {/* Candidate */}
                    <td
                      className="px-3 whitespace-nowrap"
                      style={{ height: "var(--row-h)" }}
                    >
                      <Link
                        href={`/candidates/${comm.candidateId}`}
                        className="text-primary hover:underline font-medium"
                      >
                        {comm.candidateName}
                      </Link>
                    </td>

                    {/* Client */}
                    <td
                      className="text-muted-foreground px-3 whitespace-nowrap"
                      style={{ height: "var(--row-h)" }}
                    >
                      {comm.client}
                    </td>

                    {/* Channel */}
                    <td
                      className="px-3 whitespace-nowrap"
                      style={{ height: "var(--row-h)" }}
                    >
                      <span className="text-muted-foreground inline-flex items-center gap-1.5 text-xs">
                        <ChannelIcon className="size-3.5 shrink-0" />
                        {CHANNEL_META[comm.channel].label}
                      </span>
                    </td>

                    {/* Subject */}
                    <td
                      className="max-w-[18rem] px-3"
                      style={{ height: "var(--row-h)" }}
                    >
                      <span className="block truncate">{comm.subject}</span>
                    </td>

                    {/* Template */}
                    <td
                      className="text-muted-foreground max-w-[14rem] px-3"
                      style={{ height: "var(--row-h)" }}
                    >
                      <span className="block truncate">
                        {comm.templateName ?? "—"}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-3" style={{ height: "var(--row-h)" }}>
                      <StatusBadge tone={statusMeta.tone}>
                        {statusMeta.label}
                      </StatusBadge>
                    </td>

                    {/* Sent By */}
                    <td
                      className="text-muted-foreground px-3 whitespace-nowrap"
                      style={{ height: "var(--row-h)" }}
                    >
                      {comm.sentBy}
                    </td>

                    {/* Sent At */}
                    <td
                      className="text-muted-foreground px-3 whitespace-nowrap font-mono text-xs"
                      style={{ height: "var(--row-h)" }}
                    >
                      {comm.sentAt ?? comm.scheduledFor ?? "—"}
                    </td>

                    {/* Nudge Level */}
                    <td className="px-3" style={{ height: "var(--row-h)" }}>
                      {comm.isNudge && comm.nudgeLevel !== undefined ? (
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                            nudgeTone(comm.nudgeLevel),
                          )}
                        >
                          Level {comm.nudgeLevel}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </PageContainer>
  );
}
