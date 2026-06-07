/**
 * Client 360 detail — server component.
 * DB-first: fetches from Neon, falls back to mock if not found.
 * (CLAUDE.md §27, §30, §56, §97.3, §100)
 */
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  CalendarCheck,
  CheckCircle2,
  ChevronRight,
  Clock,
  Info,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Users,
} from "lucide-react";
import { PageContainer } from "@/components/page";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  StatusBadge,
  PipelineStatusBadge,
  RiskBadge,
} from "@/components/status-badge";
import { StatTile } from "@/components/workspace/stat-tile";
import {
  getClient,
  clientCandidates,
  RULE_CATEGORY_META,
  CLIENT_STATUS_META,
  PROMISE_STATUS_META,
  type Client,
} from "@/lib/clients";
import {
  getDbClientFull,
  dbClientToUI,
  type DbClientFull,
} from "@/lib/db-clients";
import {
  mapEmploymentType,
  mapStatus,
  mapRisk,
  relativeTime,
} from "@/lib/db-candidates";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────
// Metadata
// ─────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const db = await getDbClientFull(id).catch(() => null);
  if (db) return { title: db.name };
  const mock = getClient(id);
  return { title: mock?.name ?? "Client" };
}

// ─────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────

function ContactTypeLabel({ type }: { type: string }) {
  const map: Record<string, string> = {
    primary: "Primary",
    billing: "Billing",
    technical: "Technical",
    hr: "HR",
  };
  return (
    <span className="bg-muted text-muted-foreground inline-flex rounded px-1.5 py-0.5 text-[10px] font-medium">
      {map[type] ?? type}
    </span>
  );
}

// ─────────────────────────────────────────────────────────
// DB-backed pipeline tab (uses real assignment relations)
// ─────────────────────────────────────────────────────────

function DbPipeline({
  assignments,
}: {
  assignments: DbClientFull["assignments"];
}) {
  if (!assignments.length) {
    return (
      <div className="text-muted-foreground flex flex-col items-center justify-center rounded-xl border border-dashed py-12 text-center text-sm">
        <Users className="mb-2 size-6" />
        <p className="text-foreground font-medium">No active onboardings</p>
        <p className="mt-1">Initiate an onboarding to see candidates here.</p>
      </div>
    );
  }

  return (
    <div className="bg-card overflow-hidden rounded-xl border shadow-xs">
      <div className="overflow-x-auto">
        <table
          className="w-full border-collapse text-left"
          style={{ fontSize: "var(--table-font)" }}
        >
          <thead>
            <tr
              className="text-muted-foreground border-b"
              style={{ height: "var(--row-h)" }}
            >
              {[
                "Candidate",
                "Type",
                "Stage",
                "Status",
                "Risk",
                "Start",
                "Progress",
                "Owners",
                "",
              ].map((h) => (
                <th key={h} className="px-3 font-medium whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {assignments.map((a) => {
              if (!a.candidate) return null;
              const cand = a.candidate;
              const fullName = `${cand.firstName} ${cand.lastName}`;
              const empType = mapEmploymentType(cand.employmentType ?? null);
              const status = mapStatus(cand.status, cand.risk);
              const risk = mapRisk(cand.risk);
              const startLabel = a.startDate
                ? a.startDate.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })
                : "TBD";
              const startInDays = a.startDate
                ? Math.ceil(
                    (a.startDate.getTime() - Date.now()) / 86_400_000,
                  )
                : 999;

              return (
                <tr
                  key={a.id}
                  className="hover:bg-muted/50 border-b transition-colors last:border-0"
                  style={{ height: "var(--row-h)" }}
                >
                  <td className="px-3">
                    <div className="flex items-center gap-2">
                      <span className="bg-primary/10 text-primary flex size-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold">
                        {fullName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </span>
                      <span className="flex min-w-0 flex-col leading-tight">
                        <Link
                          href={`/candidates/${cand.id}`}
                          className="hover:text-primary truncate font-medium"
                        >
                          {fullName}
                        </Link>
                        <span className="text-metadata truncate">
                          {a.jobTitle ?? "Consultant"}
                        </span>
                      </span>
                    </div>
                  </td>
                  <td className="text-muted-foreground px-3">{empType}</td>
                  <td className="text-muted-foreground px-3 whitespace-nowrap">
                    {cand.stage ?? "Pre-Onboarding"}
                  </td>
                  <td className="px-3">
                    <PipelineStatusBadge status={status} />
                  </td>
                  <td className="px-3">
                    <RiskBadge level={risk} />
                  </td>
                  <td className="px-3 whitespace-nowrap tabular-nums">
                    {startLabel}
                    <span className="text-muted-foreground"> · {startInDays}d</span>
                  </td>
                  <td className="px-3">
                    <div className="flex items-center gap-2">
                      <div className="bg-muted h-1.5 w-12 overflow-hidden rounded-full">
                        <span
                          className={cn(
                            "block h-full rounded-full",
                            cand.progress >= 75
                              ? "bg-success"
                              : cand.progress >= 50
                                ? "bg-info"
                                : "bg-warning",
                          )}
                          style={{ width: `${cand.progress}%` }}
                        />
                      </div>
                      <span className="text-muted-foreground tabular-nums text-xs">
                        {cand.progress}%
                      </span>
                    </div>
                  </td>
                  <td className="text-muted-foreground px-3 whitespace-nowrap">
                    <span className="block text-xs">
                      {cand.recruiter ?? "—"}
                    </span>
                    <span className="text-metadata">{cand.onboarder ?? "—"}</span>
                  </td>
                  <td className="px-3">
                    <Link href={`/candidates/${cand.id}`}>
                      <ChevronRight className="text-muted-foreground size-4" />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Mock pipeline tab (falls back to CANDIDATES mock)
// ─────────────────────────────────────────────────────────

function MockPipeline({ clientId }: { clientId: string }) {
  const pipeline = clientCandidates(clientId);

  if (!pipeline.length) {
    return (
      <div className="text-muted-foreground flex flex-col items-center justify-center rounded-xl border border-dashed py-12 text-center text-sm">
        <Users className="mb-2 size-6" />
        <p className="text-foreground font-medium">No active onboardings</p>
        <p className="mt-1">Initiate an onboarding to see candidates here.</p>
      </div>
    );
  }

  return (
    <div className="bg-card overflow-hidden rounded-xl border shadow-xs">
      <div className="overflow-x-auto">
        <table
          className="w-full border-collapse text-left"
          style={{ fontSize: "var(--table-font)" }}
        >
          <thead>
            <tr
              className="text-muted-foreground border-b"
              style={{ height: "var(--row-h)" }}
            >
              {[
                "Candidate",
                "Type",
                "Stage",
                "Status",
                "Risk",
                "Start",
                "Progress",
                "Owners",
                "",
              ].map((h) => (
                <th key={h} className="px-3 font-medium whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pipeline.map((c) => (
              <tr
                key={c.id}
                className="hover:bg-muted/50 border-b transition-colors last:border-0"
                style={{ height: "var(--row-h)" }}
              >
                <td className="px-3">
                  <div className="flex items-center gap-2">
                    <span className="bg-primary/10 text-primary flex size-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold">
                      {c.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </span>
                    <span className="flex min-w-0 flex-col leading-tight">
                      <Link
                        href={`/candidates/${c.id}`}
                        className="hover:text-primary truncate font-medium"
                      >
                        {c.name}
                      </Link>
                      <span className="text-metadata truncate">{c.role}</span>
                    </span>
                  </div>
                </td>
                <td className="text-muted-foreground px-3">{c.employmentType}</td>
                <td className="text-muted-foreground px-3 whitespace-nowrap">
                  {c.stage}
                </td>
                <td className="px-3">
                  <PipelineStatusBadge status={c.status} />
                </td>
                <td className="px-3">
                  <RiskBadge level={c.risk} />
                </td>
                <td className="px-3 whitespace-nowrap tabular-nums">
                  {c.startDateLabel}
                  <span className="text-muted-foreground"> · {c.startInDays}d</span>
                </td>
                <td className="px-3">
                  <div className="flex items-center gap-2">
                    <div className="bg-muted h-1.5 w-12 overflow-hidden rounded-full">
                      <span
                        className={cn(
                          "block h-full rounded-full",
                          c.progress >= 75
                            ? "bg-success"
                            : c.progress >= 50
                              ? "bg-info"
                              : "bg-warning",
                        )}
                        style={{ width: `${c.progress}%` }}
                      />
                    </div>
                    <span className="text-muted-foreground tabular-nums text-xs">
                      {c.progress}%
                    </span>
                  </div>
                </td>
                <td className="text-muted-foreground px-3 whitespace-nowrap">
                  <span className="block text-xs">{c.recruiter}</span>
                  <span className="text-metadata">{c.onboarder}</span>
                </td>
                <td className="px-3">
                  <Link href={`/candidates/${c.id}`}>
                    <ChevronRight className="text-muted-foreground size-4" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // DB-first, mock fallback
  const dbFull = await getDbClientFull(id).catch(() => null);

  let client: Client | undefined;
  if (dbFull) {
    client = dbClientToUI(dbFull);
  } else {
    client = getClient(id);
  }
  if (!client) notFound();

  const statusMeta = CLIENT_STATUS_META[client.status];
  const initials = client.name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("");

  const openPromises = client.promises.filter((p) => p.status !== "delivered");

  // Pipeline count: use DB assignments for DB clients, mock pipeline otherwise
  const pipelineCount = dbFull ? dbFull.assignments.length : clientCandidates(id).length;

  return (
    <div className="flex flex-col">
      {/* ── Sticky context header ────────────────────────────────────── */}
      <div className="bg-background/80 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-20 border-b backdrop-blur">
        <PageContainer className="py-3">
          <Button
            variant="ghost"
            size="sm"
            className="mb-2 -ml-2"
            nativeButton={false}
            render={<Link href="/clients" />}
          >
            <ArrowLeft className="size-4" /> Clients
          </Button>
          <div className="flex flex-wrap items-center gap-3">
            <span className="bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold tracking-tight">
              {initials}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-workspace-title">{client.name}</h1>
                {dbFull && (
                  <Badge variant="secondary" className="text-[10px] text-success">
                    ● Live
                  </Badge>
                )}
                <StatusBadge
                  tone={
                    statusMeta.tone as
                      | "success"
                      | "danger"
                      | "warning"
                      | "neutral"
                      | "info"
                      | "ai"
                  }
                >
                  {statusMeta.label}
                </StatusBadge>
                <span className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-[11px] font-medium">
                  {client.industry}
                </span>
              </div>
              <p className="text-muted-foreground flex items-center gap-2 text-sm">
                <MapPin className="size-3.5" />
                {client.hq}
                <span className="text-border">·</span>
                AM: {client.accountManager}
                {client.msp && (
                  <>
                    <span className="text-border">·</span>
                    VMS: {client.vmsPlatform ?? client.msp}
                  </>
                )}
              </p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Button variant="outline" size="sm">
                New Onboarding
              </Button>
            </div>
          </div>
        </PageContainer>
      </div>

      <PageContainer className="flex flex-col gap-5 py-5">
        {/* ── Stats ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile
            icon={Users}
            label="Active pipeline"
            value={pipelineCount}
            tone="info"
          />
          <StatTile
            icon={Building2}
            label="Active consultants"
            value={client.activeConsultants}
          />
          <StatTile
            icon={ShieldCheck}
            label="Compliance rate"
            value={`${Math.round(client.compliancePassRate)}%`}
            tone={client.compliancePassRate >= 90 ? "success" : "warning"}
          />
          <StatTile
            icon={CalendarCheck}
            label="Start success"
            value={`${Math.round(client.startDateSuccessRate)}%`}
            tone={client.startDateSuccessRate >= 90 ? "success" : "warning"}
          />
        </div>

        {/* ── Promise tracker (§41.5) ───────────────────────────────── */}
        {client.promises.length > 0 && (
          <section className="bg-card rounded-xl border p-4 shadow-xs">
            <h2 className="text-card-heading mb-3 flex items-center gap-2">
              Client Promises
              {openPromises.length > 0 && (
                <span className="bg-warning/15 text-warning-muted-foreground rounded px-1.5 py-0.5 text-[10px] font-medium">
                  {openPromises.length} open
                </span>
              )}
            </h2>
            <div className="flex flex-col gap-2">
              {client.promises.map((p, i) => {
                const meta = PROMISE_STATUS_META[p.status];
                return (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p
                        className={cn(
                          "text-sm font-medium",
                          p.status === "delivered" &&
                            "text-muted-foreground line-through",
                        )}
                      >
                        {p.label}
                      </p>
                      {p.actualDate && (
                        <p className="text-metadata">Actual: {p.actualDate}</p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-muted-foreground flex items-center gap-1 text-xs">
                        <Clock className="size-3" />
                        {p.promisedDate}
                      </span>
                      <span className={cn("text-xs font-medium", meta.className)}>
                        {meta.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Tabs ─────────────────────────────────────────────────── */}
        <Tabs defaultValue="pipeline">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="pipeline">
              Pipeline
              <span className="bg-muted ml-1.5 rounded px-1.5 py-0.5 text-[10px] tabular-nums">
                {pipelineCount}
              </span>
            </TabsTrigger>
            <TabsTrigger value="compliance">
              Compliance Rules
              <span className="bg-muted ml-1.5 rounded px-1.5 py-0.5 text-[10px] tabular-nums">
                {client.rules.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="contacts">
              Contacts
            </TabsTrigger>
            <TabsTrigger value="info">Client Info</TabsTrigger>
          </TabsList>

          {/* Pipeline tab — DB or mock */}
          <TabsContent value="pipeline" className="mt-4">
            {dbFull ? (
              <DbPipeline assignments={dbFull.assignments} />
            ) : (
              <MockPipeline clientId={id} />
            )}
          </TabsContent>

          {/* Compliance rules */}
          <TabsContent value="compliance" className="mt-4">
            <div className="bg-card overflow-hidden rounded-xl border shadow-xs">
              <div className="flex items-center gap-2 border-b px-4 py-2.5">
                <h3 className="text-card-heading">Required for {client.name}</h3>
                <span className="text-muted-foreground ml-auto text-xs">
                  {client.rules.filter((r) => r.required).length} required ·{" "}
                  {client.rules.filter((r) => !r.required).length} optional
                </span>
              </div>
              {client.rules.length === 0 ? (
                <p className="text-muted-foreground px-4 py-8 text-center text-sm">
                  No compliance rules configured yet.
                </p>
              ) : (
                <div className="divide-y">
                  {client.rules.map((rule) => {
                    const catMeta =
                      RULE_CATEGORY_META[
                        rule.category as keyof typeof RULE_CATEGORY_META
                      ] ?? {
                        label: rule.category,
                        color: "bg-muted text-muted-foreground",
                      };
                    return (
                      <div
                        key={rule.id}
                        className="flex items-center gap-3 px-4 py-3"
                      >
                        <CheckCircle2
                          className={cn(
                            "size-4 shrink-0",
                            rule.required
                              ? "text-success"
                              : "text-muted-foreground/40",
                          )}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">{rule.label}</p>
                          {rule.condition && (
                            <p className="text-metadata mt-0.5 flex items-center gap-1">
                              <Info className="size-3" />
                              {rule.condition}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "inline-flex rounded px-1.5 py-0.5 text-[10px] font-medium",
                              catMeta.color,
                            )}
                          >
                            {catMeta.label}
                          </span>
                          {!rule.required && (
                            <span className="text-muted-foreground text-[10px]">
                              Optional
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Contacts */}
          <TabsContent value="contacts" className="mt-4">
            {client.contacts.length === 0 ? (
              <p className="text-muted-foreground rounded-xl border border-dashed py-10 text-center text-sm">
                No contacts on file.
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {client.contacts.map((contact, i) => (
                  <div
                    key={i}
                    className="bg-card flex flex-col gap-2 rounded-xl border p-4 shadow-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">{contact.name}</p>
                        <p className="text-muted-foreground text-sm">
                          {contact.title}
                        </p>
                      </div>
                      <ContactTypeLabel type={contact.type} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <a
                        href={`mailto:${contact.email}`}
                        className="hover:text-primary flex items-center gap-1.5 text-sm"
                      >
                        <Mail className="text-muted-foreground size-3.5" />
                        {contact.email}
                      </a>
                      {contact.phone && (
                        <a
                          href={`tel:${contact.phone}`}
                          className="hover:text-primary flex items-center gap-1.5 text-sm"
                        >
                          <Phone className="text-muted-foreground size-3.5" />
                          {contact.phone}
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Client info */}
          <TabsContent value="info" className="mt-4">
            <div className="bg-card grid gap-5 rounded-xl border p-5 shadow-xs sm:grid-cols-2">
              <div className="space-y-3">
                <h3 className="text-card-heading">Business Details</h3>
                {[
                  ["Industry", client.industry],
                  ["Headquarters", client.hq],
                  ["Client Since", client.since],
                  ["Programs", client.programs.join(", ") || "—"],
                  [
                    "Allowed Employment Types",
                    client.employmentTypesAllowed.join(", ") || "—",
                  ],
                  ...(client.msp ? [["MSP", client.msp]] : []),
                  ...(client.vmsPlatform
                    ? [["VMS Platform", client.vmsPlatform]]
                    : []),
                  ...(client.workerIdPrefix
                    ? [["Worker ID Prefix", client.workerIdPrefix]]
                    : []),
                ].map(([label, value]) => (
                  <div key={label} className="flex gap-3">
                    <span className="text-muted-foreground w-44 shrink-0 text-xs font-medium uppercase tracking-wide">
                      {label}
                    </span>
                    <span className="text-sm">{value}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                <h3 className="text-card-heading">Billing &amp; Invoicing</h3>
                {[
                  ["Account Manager", client.accountManager],
                  ["Invoice Frequency", client.invoiceFrequency],
                  ["Payment Terms", `Net ${client.paymentTermsDays}`],
                  ["Avg Onboarding Time", `${client.avgOnboardingDays} days`],
                  [
                    "Compliance Pass Rate",
                    `${Math.round(client.compliancePassRate)}%`,
                  ],
                  [
                    "Start Date Success",
                    `${Math.round(client.startDateSuccessRate)}%`,
                  ],
                ].map(([label, value]) => (
                  <div key={label} className="flex gap-3">
                    <span className="text-muted-foreground w-44 shrink-0 text-xs font-medium uppercase tracking-wide">
                      {label}
                    </span>
                    <span className="text-sm font-medium">{value}</span>
                  </div>
                ))}
                {client.notes && (
                  <div className="mt-4 rounded-lg bg-muted/40 p-3">
                    <p className="text-muted-foreground mb-1 text-[11px] font-medium uppercase tracking-wide">
                      Notes
                    </p>
                    <p className="text-sm leading-relaxed">{client.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </PageContainer>
    </div>
  );
}
