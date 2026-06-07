/**
 * DB query helpers for the Packages module (§8, §9, §102).
 * Maps Prisma Package rows → the UI OnboardingPackage type from lib/packages.ts
 *
 * Server-only — never import in client components.
 */

import { db } from "@/lib/db";
import type {
  OnboardingPackage,
  PackageStatus,
  PackageItemStatus,
} from "@/lib/packages";
import { relativeTime } from "@/lib/db-candidates";

// ─────────────────────────────────────────────────────────
// Enum mapping
// ─────────────────────────────────────────────────────────

function mapStatus(s: string): PackageStatus {
  const m: Record<string, PackageStatus> = {
    DRAFT: "draft",
    IN_REVIEW: "in-review",
    APPROVED: "approved",
    PUBLISHED: "published",
    RETIRED: "retired",
    SUPERSEDED: "retired", // UI type has no "superseded" — retire it
  };
  return m[s] ?? "draft";
}

function mapItemStatus(s: string): PackageItemStatus {
  const m: Record<string, PackageItemStatus> = {
    INCLUDED: "included",
    WAIVED: "waived",
    PENDING: "pending",
    REJECTED: "rejected",
  };
  return m[s] ?? "included";
}

// ─────────────────────────────────────────────────────────
// Row type
// ─────────────────────────────────────────────────────────

type PackageRow = Awaited<ReturnType<typeof fetchPackageRows>>[number];

async function fetchPackageRows() {
  return db.package.findMany({
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
    include: {
      client: { select: { name: true } },
      items: { orderBy: { section: "asc" } },
      rules: true,
      approvals: { orderBy: { approvedAt: "desc" } },
      dispatches: { orderBy: { sentAt: "desc" }, take: 5 },
    },
  });
}

function rowToPackage(p: PackageRow): OnboardingPackage {
  const itemCount = p.items.length;
  const requiredCount = p.items.filter((i) => i.required).length;

  return {
    id: p.id,
    name: p.name,
    version: p.version,
    status: mapStatus(p.status),
    client: p.client?.name ?? "All clients",
    employmentType: p.employmentType ?? "All",
    workLocation: p.workLocation ?? "All",
    jobCategory: p.jobCategory ?? "All",
    effectiveDate: p.effectiveDate?.toLocaleDateString() ?? "TBD",
    expiryDate: p.expirationDate?.toLocaleDateString() ?? undefined,
    createdBy: p.owner ?? "Platform Team",
    approvedBy: p.approver ?? undefined,
    riskScore: p.riskScore,
    completionPct: p.completionPct,
    completionRate: p.completionPct,
    itemCount,
    requiredCount,
    candidatesUsing: 0, // not tracked in DB yet
    lastModified: relativeTime(p.updatedAt),
    description: p.notes ?? `${p.name} — onboarding requirements package.`,
    consultant: p.consultant ?? undefined,
    aiReviewStatus: p.aiReviewStatus as OnboardingPackage["aiReviewStatus"],

    items: p.items.map((i) => ({
      id: i.id,
      section: i.section as OnboardingPackage["items"][0]["section"],
      type: i.type as OnboardingPackage["items"][0]["type"],
      label: i.label,
      required: i.required,
      conditional: i.conditional ?? undefined,
      owner: i.owner ?? "Candidate",
      dueOffset: i.dueOffset,
      status: mapItemStatus(i.status),
      aiRecommended: i.aiRecommended,
      notes: i.notes ?? undefined,
    })),

    rules: p.rules.map((r) => ({
      id: r.id,
      condition: r.condition,
      applies: r.applies,
      reason: r.reason,
      category: r.category as OnboardingPackage["rules"][0]["category"],
    })),

    approvals: p.approvals.map((a) => ({
      id: a.id,
      approver: a.approver,
      role: a.role,
      status: a.status as OnboardingPackage["approvals"][0]["status"],
      approvedAt: a.approvedAt?.toLocaleDateString() ?? undefined,
      notes: a.notes ?? undefined,
    })),

    dispatches: p.dispatches.map((d) => ({
      id: d.id,
      channel: d.channel as OnboardingPackage["dispatches"][0]["channel"],
      sentAt: relativeTime(d.sentAt),
      status: d.status as OnboardingPackage["dispatches"][0]["status"],
    })),

  };
}

// ─────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────

export async function getDbPackages(): Promise<OnboardingPackage[]> {
  const rows = await fetchPackageRows();
  return rows.map(rowToPackage);
}
