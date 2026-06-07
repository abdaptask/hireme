import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, MapPin, Sparkles, Star, Timer, TrendingUp } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/page";
import { WidgetCard, MiniBars } from "@/components/dashboard/widgets";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  GEO_STRENGTHS,
  livePipelineBySkill,
  RESUMES_PARSED,
  SKILL_STRENGTHS,
  topPipelineSkills,
} from "@/lib/reporting";

export const metadata: Metadata = { title: "Skills & Specialty" };

const TOTAL = SKILL_STRENGTHS.reduce((s, k) => s + k.placements, 0);

export default function SpecialtyReportPage() {
  const ranked = [...SKILL_STRENGTHS].sort((a, b) => b.placements - a.placements);
  const top = ranked[0];
  const bestSuccess = [...SKILL_STRENGTHS].sort((a, b) => b.successRate - a.successRate)[0];
  const fastest = [...SKILL_STRENGTHS].sort((a, b) => a.avgTimeToFill - b.avgTimeToFill)[0];
  const topGeo = [...GEO_STRENGTHS].sort((a, b) => b.placements - a.placements)[0];
  const maxSkill = Math.max(...SKILL_STRENGTHS.map((s) => s.placements));
  const maxGeo = Math.max(...GEO_STRENGTHS.map((g) => g.placements));
  const live = livePipelineBySkill();
  const topSkills = topPipelineSkills().slice(0, 12);
  const maxSkillCount = Math.max(...topSkills.map((s) => s.value), 1);

  return (
    <PageContainer className="flex flex-col gap-6">
      <div>
        <Button variant="ghost" size="sm" className="-ml-2 mb-1" nativeButton={false} render={<Link href="/reports" />}>
          <ArrowLeft className="size-4" /> Reports
        </Button>
        <PageHeader
          title="Skills & Specialty"
          description="Where we win — historical placement strength by skill and geography (trailing 12 months)."
        />
      </div>

      <div className="bg-ai-muted/40 border-ai/20 flex items-start gap-2 rounded-lg border px-3 py-2 text-xs">
        <Sparkles className="text-ai mt-0.5 size-3.5 shrink-0" />
        <span className="text-muted-foreground">
          Skill data is <span className="text-foreground font-medium">AI-extracted from résumés</span> at
          onboarding start and classified into families — {RESUMES_PARSED} résumés parsed in the current
          pipeline. The report runs off that classification.
        </span>
      </div>

      {/* Client-ready strengths summary */}
      <section className="border-primary/30 bg-primary/5 rounded-xl border p-5">
        <p className="text-data-label text-primary flex items-center gap-1.5">
          <Sparkles className="size-3.5" /> Our specialty — at a glance
        </p>
        <p className="mt-2 text-sm leading-relaxed">
          Over the last 12 months we placed <strong>{TOTAL.toLocaleString()}</strong>{" "}
          consultants. We&apos;re strongest in{" "}
          <strong>{top.skill}</strong> ({top.placements} placements), with our
          highest success rate in <strong>{bestSuccess.skill}</strong> (
          {bestSuccess.successRate}%) and fastest time-to-fill in{" "}
          <strong>{fastest.skill}</strong> ({fastest.avgTimeToFill} days). Our
          deepest geographical footprint is <strong>{topGeo.state}</strong> (
          {topGeo.region}, {topGeo.placements} placements).
        </p>
      </section>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="bg-card rounded-xl border p-3.5 shadow-xs">
          <p className="text-data-label flex items-center gap-1"><TrendingUp className="size-3" /> Top skill</p>
          <p className="mt-1 text-sm font-semibold">{top.skill}</p>
          <p className="text-metadata">{top.placements} placements</p>
        </div>
        <div className="bg-card rounded-xl border p-3.5 shadow-xs">
          <p className="text-data-label flex items-center gap-1"><Star className="size-3" /> Best success</p>
          <p className="mt-1 text-sm font-semibold">{bestSuccess.skill}</p>
          <p className="text-metadata">{bestSuccess.successRate}% success</p>
        </div>
        <div className="bg-card rounded-xl border p-3.5 shadow-xs">
          <p className="text-data-label flex items-center gap-1"><Timer className="size-3" /> Fastest fill</p>
          <p className="mt-1 text-sm font-semibold">{fastest.skill}</p>
          <p className="text-metadata">{fastest.avgTimeToFill} days avg</p>
        </div>
        <div className="bg-card rounded-xl border p-3.5 shadow-xs">
          <p className="text-data-label flex items-center gap-1"><MapPin className="size-3" /> Top region</p>
          <p className="mt-1 text-sm font-semibold">{topGeo.state} · {topGeo.region}</p>
          <p className="text-metadata">{topGeo.placements} placements</p>
        </div>
      </div>

      {/* Skill strengths table */}
      <WidgetCard title="Skill strengths" description="Trailing 12 months">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left" style={{ fontSize: "var(--table-font)" }}>
            <thead className="text-muted-foreground border-b">
              <tr>
                <th className="px-2 py-2 font-medium">Skill family</th>
                <th className="px-2 py-2 font-medium">Volume</th>
                <th className="px-2 py-2 font-medium text-right">Success</th>
                <th className="px-2 py-2 font-medium text-right">Time-to-fill</th>
                <th className="px-2 py-2 font-medium text-right">Satisfaction</th>
                <th className="px-2 py-2 font-medium">Trend</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((s) => (
                <tr key={s.skill} className="hover:bg-muted/50 border-b last:border-0">
                  <td className="px-2 py-2 font-medium whitespace-nowrap">{s.skill}</td>
                  <td className="px-2 py-2">
                    <div className="flex items-center gap-2">
                      <div className="bg-muted h-2 w-28 overflow-hidden rounded-full">
                        <span className="bg-primary block h-full rounded-full" style={{ width: `${(s.placements / maxSkill) * 100}%` }} />
                      </div>
                      <span className="text-muted-foreground text-xs tabular-nums">{s.placements}</span>
                    </div>
                  </td>
                  <td className="px-2 py-2 text-right tabular-nums">
                    <span className={cn(s.successRate >= 92 ? "text-success-muted-foreground" : "text-foreground")}>
                      {s.successRate}%
                    </span>
                  </td>
                  <td className="text-muted-foreground px-2 py-2 text-right tabular-nums">{s.avgTimeToFill}d</td>
                  <td className="text-muted-foreground px-2 py-2 text-right tabular-nums">{s.satisfaction}/5</td>
                  <td className="px-2 py-2"><div className="w-24"><MiniBars data={s.trend} tone="success" /></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </WidgetCard>

      {/* Geographical strengths */}
      <WidgetCard title="Geographical strength" description="Placements by state">
        <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {GEO_STRENGTHS.map((g) => (
            <li key={g.state} className="flex items-center gap-3">
              <span className="bg-muted text-foreground flex size-8 shrink-0 items-center justify-center rounded-md text-xs font-semibold">
                {g.state}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{g.region}</span>
                  <span className="text-muted-foreground text-xs tabular-nums">{g.placements} · {g.successRate}%</span>
                </div>
                <div className="bg-muted mt-1 h-1.5 overflow-hidden rounded-full">
                  <span className="bg-info block h-full rounded-full" style={{ width: `${(g.placements / maxGeo) * 100}%` }} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      </WidgetCard>

      <WidgetCard
        title="Top skills in pipeline"
        action={<Badge variant="secondary" className="gap-1 text-[10px]"><Sparkles className="size-3" /> AI-extracted</Badge>}
        description="Granular skills parsed from current candidates' résumés"
      >
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {topSkills.map((s) => (
            <li key={s.name} className="flex items-center gap-3">
              <span className="w-32 shrink-0 truncate text-sm">{s.name}</span>
              <div className="bg-muted relative h-2 flex-1 overflow-hidden rounded-full">
                <span
                  className="bg-ai absolute inset-y-0 left-0 rounded-full"
                  style={{ width: `${Math.max((s.value / maxSkillCount) * 100, 8)}%` }}
                />
              </div>
              <span className="text-muted-foreground w-5 text-right text-xs tabular-nums">{s.value}</span>
            </li>
          ))}
        </ul>
      </WidgetCard>

      <WidgetCard
        title="Current pipeline by skill family"
        action={<Badge variant="secondary" className="text-[10px]">live</Badge>}
        description="AI-classified families across today's active candidates"
      >
        <ul className="flex flex-col gap-2">
          {live.map((s) => (
            <li key={s.name} className="flex items-center justify-between text-sm">
              <span>{s.name}</span>
              <span className="text-muted-foreground tabular-nums">{s.value} active</span>
            </li>
          ))}
        </ul>
      </WidgetCard>
    </PageContainer>
  );
}
