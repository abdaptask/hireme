"use client";

/**
 * Templates (§24 communications, §63 communication reports, §121 admin tools).
 *
 * Central catalog of reusable templates spanning email, document,
 * communication (SMS / voice / portal) and workflow definitions. Templates
 * here drive the gentle-nudge protocol (§13), package dispatch (§9.7),
 * and orchestration in Workflow Studio (§19).
 */

import { useMemo, useState } from "react";
import {
  Copy,
  Eye,
  FileText,
  Mail,
  MessageSquare,
  Pencil,
  Plus,
  PowerOff,
  Search,
  Workflow,
} from "lucide-react";

import { PageContainer, PageHeader } from "@/components/page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { daysAgo, hoursAgo, formatDate, relativeTime } from "@/lib/clock";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────

type Category = "Email" | "Document" | "Communication" | "Workflow";

type TemplateRow = {
  id: string;
  name: string;
  /** "subject" for email; "title" for everything else */
  subjectOrTitle: string;
  category: string;
  lastModified: Date;
  owner: string;
  usageCount: number; // last 30d
  active: boolean;
};

type TabDef = {
  id: Category;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  subjectLabel: string;
  rows: TemplateRow[];
};

// ─────────────────────────────────────────────────────────
// Mock data
// ─────────────────────────────────────────────────────────

const EMAIL_TEMPLATES: TemplateRow[] = [
  {
    id: "email-welcome",
    name: "Welcome — Package Dispatched",
    subjectOrTitle: "Welcome to ApTask — your onboarding package is ready",
    category: "Onboarding",
    lastModified: daysAgo(2),
    owner: "Priya Iyer",
    usageCount: 184,
    active: true,
  },
  {
    id: "email-doc-nudge-1",
    name: "Document Nudge Day 1",
    subjectOrTitle: "Quick reminder: a document is awaiting your signature",
    category: "Nudge",
    lastModified: daysAgo(11),
    owner: "Priya Iyer",
    usageCount: 312,
    active: true,
  },
  {
    id: "email-doc-nudge-3",
    name: "Document Nudge Day 3",
    subjectOrTitle: "Action needed — your start date depends on these documents",
    category: "Nudge",
    lastModified: daysAgo(11),
    owner: "Priya Iyer",
    usageCount: 158,
    active: true,
  },
  {
    id: "email-bgc-consent",
    name: "Background Check Consent Request",
    subjectOrTitle: "Authorization required for your background check",
    category: "Screening",
    lastModified: daysAgo(38),
    owner: "Lena Park",
    usageCount: 92,
    active: true,
  },
  {
    id: "email-day-1",
    name: "Day 1 Welcome",
    subjectOrTitle: "Welcome aboard — here is what to expect today",
    category: "Day 1",
    lastModified: daysAgo(5),
    owner: "Marcus Hill",
    usageCount: 71,
    active: true,
  },
  {
    id: "email-day-30",
    name: "30-day Check-in",
    subjectOrTitle: "How is your first month going?",
    category: "Engagement",
    lastModified: daysAgo(20),
    owner: "Marcus Hill",
    usageCount: 44,
    active: true,
  },
];

const DOCUMENT_TEMPLATES: TemplateRow[] = [
  {
    id: "doc-nda-a",
    name: "Standard NDA - Client A",
    subjectOrTitle: "Mutual Non-Disclosure Agreement (Client A)",
    category: "Client NDA",
    lastModified: daysAgo(60),
    owner: "Legal Ops",
    usageCount: 41,
    active: true,
  },
  {
    id: "doc-nda-b",
    name: "Standard NDA - Client B",
    subjectOrTitle: "One-way NDA — Confidential Information (Client B)",
    category: "Client NDA",
    lastModified: daysAgo(45),
    owner: "Legal Ops",
    usageCount: 27,
    active: true,
  },
  {
    id: "doc-i9-coversheet",
    name: "I-9 Coversheet",
    subjectOrTitle: "Form I-9 Employment Eligibility — Cover & Routing",
    category: "Compliance",
    lastModified: daysAgo(95),
    owner: "Compliance",
    usageCount: 188,
    active: true,
  },
  {
    id: "doc-direct-deposit",
    name: "Direct Deposit Authorization",
    subjectOrTitle: "Direct Deposit Authorization & Banking Information",
    category: "Payroll",
    lastModified: daysAgo(28),
    owner: "Payroll Ops",
    usageCount: 184,
    active: true,
  },
];

const COMMUNICATION_TEMPLATES: TemplateRow[] = [
  {
    id: "sms-doc-pending",
    name: "SMS - Document Pending",
    subjectOrTitle: "Hi {first_name}, a document is pending in your portal: {url}",
    category: "SMS",
    lastModified: hoursAgo(28),
    owner: "Priya Iyer",
    usageCount: 246,
    active: true,
  },
  {
    id: "sms-welcome",
    name: "SMS - Welcome",
    subjectOrTitle: "Welcome to ApTask! Open your portal to get started: {url}",
    category: "SMS",
    lastModified: daysAgo(9),
    owner: "Priya Iyer",
    usageCount: 121,
    active: true,
  },
  {
    id: "voice-otp",
    name: "Voice OTP Script",
    subjectOrTitle: "Your one-time verification code is {code}…",
    category: "Voice",
    lastModified: daysAgo(120),
    owner: "Security",
    usageCount: 38,
    active: true,
  },
  {
    id: "portal-reminder",
    name: "Portal Reminder",
    subjectOrTitle: "You have {count} pending task(s) before your start date.",
    category: "Portal",
    lastModified: daysAgo(4),
    owner: "Marcus Hill",
    usageCount: 412,
    active: true,
  },
];

const WORKFLOW_TEMPLATES: TemplateRow[] = [
  {
    id: "wf-std-w2",
    name: "Standard Onboarding W-2",
    subjectOrTitle: "Full-time W-2 onboarding — 14 stages, 22 tasks",
    category: "Onboarding",
    lastModified: daysAgo(7),
    owner: "Priya Iyer",
    usageCount: 96,
    active: true,
  },
  {
    id: "wf-c2c",
    name: "C2C Contractor Flow",
    subjectOrTitle: "Corp-to-Corp contractor — vendor pass-through workflow",
    category: "Onboarding",
    lastModified: daysAgo(14),
    owner: "Priya Iyer",
    usageCount: 34,
    active: true,
  },
  {
    id: "wf-delta",
    name: "Delta Re-onboarding",
    subjectOrTitle: "Returning consultant — only expired/changed items",
    category: "Lifecycle",
    lastModified: daysAgo(22),
    owner: "Marcus Hill",
    usageCount: 12,
    active: true,
  },
  {
    id: "wf-offboarding",
    name: "Offboarding Workflow",
    subjectOrTitle: "Assignment end — equipment, access, exit survey",
    category: "Lifecycle",
    lastModified: daysAgo(40),
    owner: "Marcus Hill",
    usageCount: 28,
    active: false,
  },
];

const TABS: TabDef[] = [
  {
    id: "Email",
    label: "Email",
    icon: Mail,
    subjectLabel: "Subject",
    rows: EMAIL_TEMPLATES,
  },
  {
    id: "Document",
    label: "Document",
    icon: FileText,
    subjectLabel: "Title",
    rows: DOCUMENT_TEMPLATES,
  },
  {
    id: "Communication",
    label: "Communication",
    icon: MessageSquare,
    subjectLabel: "Title",
    rows: COMMUNICATION_TEMPLATES,
  },
  {
    id: "Workflow",
    label: "Workflow",
    icon: Workflow,
    subjectLabel: "Title",
    rows: WORKFLOW_TEMPLATES,
  },
];

// ─────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────

export default function TemplatesPage() {
  const [activeTab, setActiveTab] = useState<Category>("Email");
  const [query, setQuery] = useState("");

  return (
    <PageContainer className="flex flex-col gap-6">
      <PageHeader
        title="Templates"
        description="Manage email, document, communication, and workflow templates."
        actions={
          <Button size="sm">
            <Plus className="size-4" /> New Template
          </Button>
        }
      />

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as Category)}
        className="flex flex-col gap-4"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <TabsList className="h-auto w-full justify-start gap-1 rounded-xl bg-transparent p-0 sm:w-fit">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className={cn(
                    "flex h-9 items-center gap-2 rounded-lg border px-3 text-sm font-medium transition-all",
                    isActive
                      ? "bg-card border-border text-foreground shadow-xs"
                      : "border-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                  )}
                >
                  <Icon className="size-4" />
                  {tab.label}
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {tab.rows.length}
                  </span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          <div className="relative w-full sm:max-w-xs">
            <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search templates…"
              className="pl-8"
            />
          </div>
        </div>

        {TABS.map((tab) => (
          <TabsContent key={tab.id} value={tab.id}>
            <TemplateTable
              rows={tab.rows}
              subjectLabel={tab.subjectLabel}
              query={query}
            />
          </TabsContent>
        ))}
      </Tabs>
    </PageContainer>
  );
}

// ─────────────────────────────────────────────────────────
// Table
// ─────────────────────────────────────────────────────────

function TemplateTable({
  rows,
  subjectLabel,
  query,
}: {
  rows: TemplateRow[];
  subjectLabel: string;
  query: string;
}) {
  const filtered = useMemo(() => {
    if (!query) return rows;
    const q = query.toLowerCase();
    return rows.filter((r) =>
      `${r.name} ${r.subjectOrTitle} ${r.category} ${r.owner}`
        .toLowerCase()
        .includes(q),
    );
  }, [rows, query]);

  return (
    <div className="bg-card overflow-hidden rounded-xl border shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b">
              <th className="px-4 py-2.5 text-left font-medium">Name</th>
              <th className="px-4 py-2.5 text-left font-medium">
                {subjectLabel}
              </th>
              <th className="px-4 py-2.5 text-left font-medium">Category</th>
              <th className="px-4 py-2.5 text-left font-medium">Owner</th>
              <th className="px-4 py-2.5 text-right font-medium">
                Usage (30d)
              </th>
              <th className="px-4 py-2.5 text-left font-medium">Modified</th>
              <th className="px-4 py-2.5 text-left font-medium">Status</th>
              <th className="px-4 py-2.5 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr
                key={row.id}
                className="hover:bg-muted/40 border-b last:border-0"
              >
                <td className="px-4 py-2.5 font-medium">{row.name}</td>
                <td className="text-muted-foreground max-w-md truncate px-4 py-2.5">
                  {row.subjectOrTitle}
                </td>
                <td className="px-4 py-2.5">
                  <Badge variant="outline" className="text-[10px]">
                    {row.category}
                  </Badge>
                </td>
                <td className="text-muted-foreground px-4 py-2.5">
                  {row.owner}
                </td>
                <td className="px-4 py-2.5 text-right font-semibold tabular-nums">
                  {row.usageCount.toLocaleString()}
                </td>
                <td
                  className="text-muted-foreground px-4 py-2.5 text-xs"
                  title={formatDate(row.lastModified, { withYear: true })}
                >
                  {relativeTime(row.lastModified)}
                </td>
                <td className="px-4 py-2.5">
                  {row.active ? (
                    <Badge variant="secondary" className="text-[10px]">
                      Active
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="text-muted-foreground text-[10px]"
                    >
                      Disabled
                    </Badge>
                  )}
                </td>
                <td className="px-4 py-2.5 text-right">
                  <RowActions row={row} />
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="text-muted-foreground px-4 py-10 text-center"
                >
                  No templates match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RowActions({ row }: { row: TemplateRow }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="sm" />}
      >
        Actions
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem onClick={() => console.log("View", row.id)}>
          <Eye className="size-4" /> View
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => console.log("Edit", row.id)}>
          <Pencil className="size-4" /> Edit
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => console.log("Duplicate", row.id)}>
          <Copy className="size-4" /> Duplicate
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => console.log("Disable", row.id)}>
          <PowerOff className="size-4" />{" "}
          {row.active ? "Disable" : "Re-enable"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
