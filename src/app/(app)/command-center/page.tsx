import type { Metadata } from "next";
import Link from "next/link";
import { Cake, Gift, PartyPopper, Send, Sparkles, Trophy } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/page";
import { FilterBar } from "@/components/command-center/filter-bar";
import { EventFeed } from "@/components/command-center/event-feed";
import {
  BarList,
  MiniBars,
  OpsTileCard,
  StatCard,
  WidgetCard,
} from "@/components/dashboard/widgets";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MorningBriefing } from "@/components/ai/morning-briefing";
import { RecommendationCard } from "@/components/ai/recommendation-card";
import { getRecommendations } from "@/lib/ai";
import {
  ANNIVERSARIES,
  BIRTHDAYS,
  CLIENT_BOTTLENECKS,
  CONFIDENCE_DISTRIBUTION,
  DROPOFF_TREND,
  MILESTONES,
  OPS_TILES,
  PIPELINE_BY_STAGE,
  VENDOR_TURNAROUND,
  VITALS,
  type EngagementItem,
} from "@/lib/mock-data";

export const metadata: Metadata = { title: "Command Center" };

const TIME_TO_ONBOARD_TREND = [12.1, 11.8, 12.3, 11.5, 11.9, 11.2, 11.6, 11.4];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h2 className="text-section-heading mb-2.5">{children}</h2>;
}

function EngagementList({
  items,
  icon: Icon,
}: {
  items: EngagementItem[];
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <ul className="flex flex-col gap-2.5">
      {items.map((it) => (
        <li key={it.name} className="flex items-center gap-2.5">
          <span className="bg-muted text-muted-foreground flex size-7 shrink-0 items-center justify-center rounded-full">
            <Icon className="size-3.5" />
          </span>
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="truncate text-sm font-medium">{it.name}</span>
            <span className="text-metadata truncate">{it.detail}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

export default function CommandCenterPage() {
  const topRecommendations = getRecommendations("super-admin").slice(0, 3);

  return (
    <PageContainer className="flex flex-col gap-6">
      <PageHeader
        title="Command Center"
        description="Super Admin vitals & operations — drill into any line-item record."
        actions={
          <Badge variant="outline" className="gap-1.5">
            <span className="bg-success inline-block size-1.5 rounded-full" />
            Live · mock data
          </Badge>
        }
      />

      {/* AI Morning Briefing (§41.4) */}
      <MorningBriefing />

      <FilterBar />

      {/* First Row — Operational Vitals (§7.1) */}
      <section>
        <SectionLabel>Operational Vitals</SectionLabel>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {VITALS.map((v) => (
            <StatCard key={v.id} {...v} />
          ))}
        </div>
      </section>

      {/* Second Row — Risk & Throughput (§7.2) */}
      <section>
        <SectionLabel>Risk & Throughput</SectionLabel>
        <div className="grid gap-4 lg:grid-cols-3">
          <WidgetCard title="Pipeline by Stage">
            <BarList
              rows={PIPELINE_BY_STAGE.map((s) => ({
                name: s.stage,
                value: s.count,
              }))}
              tone="info"
            />
          </WidgetCard>

          <WidgetCard title="Start-Date Confidence">
            <BarList
              rows={CONFIDENCE_DISTRIBUTION.map((c) => ({
                name: c.label,
                value: c.count,
                tone: c.tone,
              }))}
            />
          </WidgetCard>

          <div className="flex flex-col gap-4">
            <WidgetCard title="Avg Time-to-Onboard">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-3xl font-semibold tabular-nums tracking-tight">
                    11.4
                    <span className="text-muted-foreground ml-1 text-base font-normal">
                      days
                    </span>
                  </p>
                  <p className="text-success-muted-foreground text-xs font-medium">
                    ↓ 0.2d vs last month
                  </p>
                </div>
                <div className="w-28">
                  <MiniBars data={TIME_TO_ONBOARD_TREND} tone="success" />
                </div>
              </div>
            </WidgetCard>
            <WidgetCard title="Drop-Off Trend" description="Last 8 weeks">
              <div className="flex items-end justify-between gap-3">
                <p className="text-3xl font-semibold tabular-nums tracking-tight">
                  3
                  <span className="text-muted-foreground ml-1 text-base font-normal">
                    this wk
                  </span>
                </p>
                <div className="w-28">
                  <MiniBars data={DROPOFF_TREND} tone="warning" />
                </div>
              </div>
            </WidgetCard>
          </div>

          <WidgetCard title="Client Bottleneck Ranking" description="Avg days stalled">
            <BarList rows={CLIENT_BOTTLENECKS} tone="danger" />
          </WidgetCard>

          <WidgetCard title="Vendor Turnaround" description="Avg completion days">
            <BarList rows={VENDOR_TURNAROUND} tone="info" />
          </WidgetCard>

          <WidgetCard
            title="Compliance Pass Rate"
            description="First-pass approvals"
          >
            <div className="flex h-full flex-col justify-center">
              <p className="text-3xl font-semibold tabular-nums tracking-tight">
                92.4%
              </p>
              <div className="bg-muted mt-3 h-2 overflow-hidden rounded-full">
                <span
                  className="bg-success block h-full rounded-full"
                  style={{ width: "92.4%" }}
                />
              </div>
              <p className="text-metadata mt-2">+1.8% vs last month</p>
            </div>
          </WidgetCard>
        </div>
      </section>

      {/* Third Row — Package & Exception Operations (§7.3) */}
      <section>
        <SectionLabel>Package & Exception Operations</SectionLabel>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {OPS_TILES.map((t) => (
            <OpsTileCard key={t.id} {...t} />
          ))}
        </div>
      </section>

      {/* AI Recommendations widget (§10, §105) */}
      <section>
        <WidgetCard
          title={
            <span className="flex items-center gap-1.5">
              <Sparkles className="text-ai size-3.5" />
              AI Recommendations
            </span>
          }
          description="Top pending actions and insights"
          action={
            <Link
              href="/my-work"
              className="text-muted-foreground hover:text-foreground text-xs transition-colors"
            >
              View all →
            </Link>
          }
        >
          <div className="flex flex-col gap-2">
            {topRecommendations.map((rec) => (
              <RecommendationCard key={rec.id} recommendation={rec} compact />
            ))}
          </div>
        </WidgetCard>
      </section>

      {/* Fourth Row — Culture & Engagement (§7) */}
      <section>
        <SectionLabel>Culture & Engagement</SectionLabel>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <WidgetCard title="Birthdays">
            <EngagementList items={BIRTHDAYS} icon={Cake} />
          </WidgetCard>
          <WidgetCard title="Work Anniversaries">
            <EngagementList items={ANNIVERSARIES} icon={Trophy} />
          </WidgetCard>
          <WidgetCard title="Upcoming Milestones">
            <EngagementList items={MILESTONES} icon={Gift} />
          </WidgetCard>
          <WidgetCard
            title="AI Celebration Drafts"
            action={
              <Badge variant="secondary" className="gap-1 text-[10px]">
                <PartyPopper className="size-3" /> 4 pending
              </Badge>
            }
          >
            <div className="flex h-full flex-col justify-between gap-3">
              <p className="text-muted-foreground text-sm">
                4 personalized messages drafted and awaiting approval before
                dispatch.
              </p>
              <Button variant="outline" size="sm" className="w-full" disabled>
                <Send className="size-3.5" /> Review & approve (v0.9)
              </Button>
            </div>
          </WidgetCard>
        </div>
      </section>

      {/* Bottom — Granular Line-Item Feed (§7) */}
      <EventFeed />
    </PageContainer>
  );
}
