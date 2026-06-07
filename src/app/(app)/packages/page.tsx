"use client";

import { useMemo, useState } from "react";
import {
  Archive,
  CheckCircle2,
  Clock,
  Eye,
  Package,
  Pencil,
  Users,
} from "lucide-react";
import { PageContainer, PageHeader } from "@/components/page";
import { StatTile } from "@/components/workspace/stat-tile";
import { StatusBadge } from "@/components/status-badge";
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
            pkg.completionRate >= 80
              ? "bg-success"
              : pkg.completionRate >= 50
                ? "bg-warning"
                : "bg-danger";

          return (
            <article
              key={pkg.id}
              className="bg-card flex flex-col rounded-xl border shadow-xs transition-shadow hover:shadow-sm"
            >
              {/* Card header */}
              <div className="flex items-start justify-between gap-2 border-b px-4 py-3">
                <div className="min-w-0">
                  <h3 className="text-card-heading truncate">{pkg.name}</h3>
                  <p className="text-metadata mt-0.5">{pkg.client}</p>
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
                    <span className="text-xs font-medium">Completion rate</span>
                    <span className="tabular-nums text-xs font-semibold">
                      {pkg.completionRate}%
                    </span>
                  </div>
                  <div className="bg-muted h-1.5 overflow-hidden rounded-full">
                    <div
                      className={cn("h-full rounded-full", completionColor)}
                      style={{ width: `${pkg.completionRate}%` }}
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

                {/* Employment type + modified */}
                <div className="flex items-center justify-between">
                  <span className="bg-muted text-muted-foreground rounded-full px-2.5 py-0.5 text-xs font-medium">
                    {pkg.employmentType}
                  </span>
                  <span className="text-metadata">
                    Modified {pkg.lastModified}
                  </span>
                </div>
              </div>

              {/* Card footer — actions */}
              <div className="flex items-center gap-2 border-t px-4 py-2.5">
                <button className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-muted">
                  <Eye className="size-3.5" />
                  View
                </button>
                <button
                  disabled={pkg.status === "retired"}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                    pkg.status === "retired"
                      ? "text-muted-foreground/50 cursor-not-allowed"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted",
                  )}
                >
                  <Pencil className="size-3.5" />
                  Edit
                </button>
                <span className="text-metadata ml-auto">
                  {pkg.approvedBy ? `Approved by ${pkg.approvedBy}` : `Created by ${pkg.createdBy}`}
                </span>
              </div>
            </article>
          );
        })}
      </div>
    </PageContainer>
  );
}
