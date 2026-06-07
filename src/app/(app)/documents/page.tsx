"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Bot,
  Clock,
  FileCheck,
  FileX,
  Search,
} from "lucide-react";
import { PageContainer, PageHeader } from "@/components/page";
import { StatTile } from "@/components/workspace/stat-tile";
import { StatusBadge } from "@/components/status-badge";
import { cn } from "@/lib/utils";
import {
  DOCUMENT_CATEGORY_META,
  DOCUMENT_STATUS_META,
  DOCUMENTS,
  documentStats,
} from "@/lib/documents";
import type { DocumentCategory } from "@/lib/documents";

const CATEGORIES: { value: "all" | DocumentCategory; label: string }[] = [
  { value: "all",        label: "All" },
  { value: "identity",   label: "Identity" },
  { value: "tax",        label: "Tax" },
  { value: "employment", label: "Employment" },
  { value: "client",     label: "Client" },
  { value: "compliance", label: "Compliance" },
  { value: "screening",  label: "Screening" },
  { value: "payroll",    label: "Payroll" },
];

function AiScoreBar({ score }: { score: number }) {
  const color =
    score >= 90
      ? "bg-success"
      : score >= 70
        ? "bg-warning"
        : "bg-danger";

  return (
    <div className="flex items-center gap-2">
      <div className="bg-muted relative h-1.5 w-16 overflow-hidden rounded-full">
        <span
          className={cn("absolute inset-y-0 left-0 rounded-full", color)}
          style={{ width: `${score}%` }}
        />
      </div>
      <span
        className={cn(
          "text-xs font-medium tabular-nums",
          score >= 90
            ? "text-success-muted-foreground"
            : score >= 70
              ? "text-warning-muted-foreground"
              : "text-danger-muted-foreground",
        )}
      >
        {score}
      </span>
    </div>
  );
}

export default function DocumentsPage() {
  const stats = documentStats();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"all" | DocumentCategory>("all");

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return DOCUMENTS.filter((doc) => {
      const matchesCategory =
        category === "all" || doc.category === category;
      const matchesQuery =
        !q ||
        doc.candidateName.toLowerCase().includes(q) ||
        doc.docType.toLowerCase().includes(q) ||
        doc.client.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [query, category]);

  return (
    <PageContainer className="flex flex-col gap-6">
      <PageHeader
        title="Document Intelligence"
        description="AI-assisted document review with quality scoring, flag detection, and cross-document validation (§20, §113)."
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile
          icon={Clock}
          label="Pending / submitted"
          value={stats.pending}
        />
        <StatTile
          icon={Bot}
          label="AI review in progress"
          value={stats.awaitingReview}
          tone="info"
        />
        <StatTile
          icon={FileCheck}
          label="Approved"
          value={stats.approved}
          tone="success"
        />
        <StatTile
          icon={FileX}
          label="Rejected / correction"
          value={stats.rejected}
          tone="danger"
        />
      </div>

      <section className="bg-card overflow-hidden rounded-xl border shadow-xs">
        <div className="flex flex-col gap-2 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-card-heading shrink-0">Documents</h2>
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search candidate, doc type, client…"
                className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring h-8 w-64 rounded-md border py-1 pl-8 pr-3 text-sm focus-visible:ring-2 focus-visible:outline-none"
              />
            </div>

            {/* Category filter */}
            <div className="flex items-center gap-1">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setCategory(cat.value)}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                    category === cat.value
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted",
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
          <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
            {filtered.length} / {DOCUMENTS.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table
            className="w-full border-collapse text-left"
            style={{ fontSize: "var(--table-font)" }}
          >
            <thead className="text-muted-foreground border-b">
              <tr>
                <th className="px-3 py-2 font-medium">Document</th>
                <th className="px-3 py-2 font-medium">Candidate</th>
                <th className="px-3 py-2 font-medium">Client</th>
                <th className="px-3 py-2 font-medium">Ver.</th>
                <th className="px-3 py-2 font-medium">AI Score</th>
                <th className="px-3 py-2 font-medium">Flags</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Submitted</th>
                <th className="px-3 py-2 font-medium">Reviewer</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="text-muted-foreground px-3 py-8 text-center text-sm"
                  >
                    No documents match your filters.
                  </td>
                </tr>
              ) : (
                filtered.map((doc) => {
                  const isProblematic =
                    doc.status === "rejected" ||
                    doc.status === "correction-required" ||
                    doc.status === "expired";
                  const catMeta = DOCUMENT_CATEGORY_META[doc.category];
                  const statusMeta = DOCUMENT_STATUS_META[doc.status];

                  return (
                    <tr
                      key={doc.id}
                      className={cn(
                        "border-b last:border-0 transition-colors",
                        isProblematic
                          ? "bg-danger-muted/20 hover:bg-danger-muted/30"
                          : "hover:bg-muted/50",
                      )}
                    >
                      <td className="px-3 py-2">
                        <span className="block font-medium">{doc.docType}</span>
                        <span
                          className={cn(
                            "mt-0.5 inline-flex items-center rounded-full px-1.5 py-0.5 text-xs font-medium",
                            catMeta.color,
                          )}
                        >
                          {catMeta.label}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <Link
                          href={`/candidates/${doc.candidateId}`}
                          className="hover:text-primary font-medium"
                        >
                          {doc.candidateName}
                        </Link>
                      </td>
                      <td className="text-muted-foreground px-3 py-2 whitespace-nowrap">
                        {doc.client}
                      </td>
                      <td className="text-muted-foreground px-3 py-2 tabular-nums">
                        v{doc.version}
                      </td>
                      <td className="px-3 py-2">
                        {doc.aiScore !== undefined ? (
                          <AiScoreBar score={doc.aiScore} />
                        ) : (
                          <span className="text-muted-foreground/50 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        {doc.aiFlags && doc.aiFlags.length > 0 ? (
                          <ul className="space-y-0.5">
                            {doc.aiFlags.map((flag) => (
                              <li
                                key={flag}
                                className="text-danger-muted-foreground text-xs"
                              >
                                · {flag}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-muted-foreground/50 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <StatusBadge tone={statusMeta.tone}>
                          {statusMeta.label}
                        </StatusBadge>
                        {doc.rejectionReason && (
                          <p
                            className="text-danger-muted-foreground mt-0.5 max-w-[200px] truncate text-xs"
                            title={doc.rejectionReason}
                          >
                            {doc.rejectionReason}
                          </p>
                        )}
                      </td>
                      <td className="text-muted-foreground px-3 py-2 whitespace-nowrap">
                        {doc.submittedDate ?? "—"}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {doc.reviewer ? (
                          <span className="text-xs">
                            {doc.reviewer === "AI Copilot" ? (
                              <span className="text-ai-muted-foreground inline-flex items-center gap-1">
                                <Bot className="size-3" /> AI Copilot
                              </span>
                            ) : (
                              doc.reviewer
                            )}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/50 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="text-muted-foreground border-t px-4 py-2 text-xs">
          AI Score reflects document quality (0–100). Rows in red contain rejected, correction-required, or expired documents (§20). Full document viewer with side-by-side comparison coming in the detail module (§113).
        </div>
      </section>
    </PageContainer>
  );
}
