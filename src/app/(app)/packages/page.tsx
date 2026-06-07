"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Archive,
  CheckCircle2,
  Clock,
  Package,
  Users,
} from "lucide-react";
import { PageContainer, PageHeader } from "@/components/page";
import { StatTile } from "@/components/workspace/stat-tile";
import { StatusBadge } from "@/components/status-badge";
import { BuildPackageSheet } from "@/components/packages/build-sheet";
import { cn } from "@/lib/utils";
import {
  PACKAGE_STATUS_META,
  PACKAGES,
  packageStats,
} from "@/lib/packages";
import type { PackageStatus } from "@/lib/packages";

type FilterKey = PackageStatus | "all";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "published", label: "Published" },
  { key: "approved", label: "Approved" },
  { key: "in-review", label: "In Review" },
  { key: "draft", label: "Draft" },
];

export default function PackagesPage() {
  const stats = packageStats();
  const [filter, setFilter] = useState<FilterKey>("all");

  const cards = useMemo(() => {
    if (filter === "all") return PACKAGES;
    return PACKAGES.filter((p) => p.status === filter);
  }, [filter]);

  return (
    <PageContainer className="flex flex-col gap-6">
      <PageHeader
        title="Onboarding Packages"
        description="Client-mapped onboarding packages with version control, completion tracking, and candidate impact visibility (§8, §9)."
        actions={<BuildPackageSheet />}
      />

      {/* KPI tiles */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile
          icon={CheckCircle2}
          label="Published / approved"
          value={stats.published}
          tone="success"
        />
        <StatTile
          icon={Clock}
          label="In review"
          value={stats.inReview}
          tone="info"
        />
        <StatTile icon={Package} label="Draft" value={stats.draft} />
        <StatTile
          icon={Archive}
          label="Retired"
          value={stats.retired}
        />
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              filter === f.key
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted",
            )}
          >
            {f.label}
          </button>
        ))}
        <span className="text-muted-foreground ml-auto text-xs tabular-nums">
          {cards.length} packages
        </span>
      </div>

      {/* Package cards grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((pkg) => {
          const meta = PACKAGE_STATUS_META[pkg.status];
          const completionColor =
            pkg.completionPct >= 80
              ? "bg-success"
              : pkg.completionPct >= 50
                ? "bg-warning"
                : pkg.completionPct > 0
                  ? "bg-danger"
                  : "bg-muted-foreground/20";

          return (
            <Link
              key={pkg.id}
              href={`/packages/${pkg.id}`}
              className="group block"
            >
              <article className="bg-card flex flex-col rounded-xl border shadow-xs transition-shadow hover:shadow-sm group-hover:border-primary/30">
                {/* Card header */}
                <div className="flex items-start justify-between gap-2 border-b px-4 py-3">
                  <div className="min-w-0">
                    <h3 className="text-card-heading truncate group-hover:text-primary transition-colors">
                      {pkg.name}
                    </h3>
                    <div className="mt-0.5 flex items-center gap-1.5">
                      <p className="text-metadata">{pkg.client}</p>
                      <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-[10px] font-medium">
                        {pkg.employmentType}
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 font-mono text-xs">
                      {pkg.version}
                    </span>
                    <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
                  </div>
                </div>

                {/* Card body */}
                <div className="flex flex-1 flex-col gap-3 px-4 py-3">
                  <p className="text-muted-foreground line-clamp-2 text-xs leading-relaxed">
                    {pkg.description}
                  </p>

                  {/* Completion bar */}
                  <div>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-xs font-medium">Completion</span>
                      <span className="tabular-nums text-xs font-semibold">
                        {pkg.completionPct}%
                      </span>
                    </div>
                    <div className="bg-muted h-1.5 overflow-hidden rounded-full">
                      <div
                        className={cn("h-full rounded-full", completionColor)}
                        style={{ width: `${pkg.completionPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Meta row */}
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <p className="text-metadata">Items</p>
                      <p className="tabular-nums text-sm font-semibold">
                        {pkg.itemCount}
                      </p>
                    </div>
                    <div>
                      <p className="text-metadata">Required</p>
                      <p className="tabular-nums text-sm font-semibold">
                        {pkg.requiredCount}
                      </p>
                    </div>
                    <div>
                      <p className="text-metadata">Candidates</p>
                      <p className="flex items-center gap-0.5 tabular-nums text-sm font-semibold">
                        <Users className="size-3.5" />
                        {pkg.candidatesUsing}
                      </p>
                    </div>
                  </div>

                  {/* AI review status + modified */}
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
                        pkg.aiReviewStatus === "clean"
                          ? "bg-success-muted text-success-muted-foreground"
                          : pkg.aiReviewStatus === "warnings"
                            ? "bg-warning-muted text-warning-muted-foreground"
                            : pkg.aiReviewStatus === "errors"
                              ? "bg-danger-muted text-danger-muted-foreground"
                              : "bg-muted text-muted-foreground",
                      )}
                    >
                      {pkg.aiReviewStatus === "clean"
                        ? "✓ AI Clean"
                        : pkg.aiReviewStatus === "warnings"
                          ? "⚠ AI Warnings"
                          : pkg.aiReviewStatus === "errors"
                            ? "✕ AI Errors"
                            : "AI Not Run"}
                    </span>
                    <span className="text-metadata">
                      Modified {pkg.lastModified}
                    </span>
                  </div>
                </div>

                {/* Card footer */}
                <div className="flex items-center gap-2 border-t px-4 py-2.5">
                  <span className="text-metadata">
                    {pkg.approvedBy
                      ? `Approved by ${pkg.approvedBy}`
                      : `Created by ${pkg.createdBy}`}
                  </span>
                  <span className="text-metadata ml-auto text-[10px] text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    View details →
                  </span>
                </div>
              </article>
            </Link>
          );
        })}
      </div>
    </PageContainer>
  );
}
