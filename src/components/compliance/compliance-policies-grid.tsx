"use client";

import { useState, useMemo } from "react";
import {
  Search,
  Eye,
  Pencil,
  History,
  Users,
  ChevronDown,
  CheckCircle2,
  FileText,
  Workflow,
  Package,
  MapPin,
  Building2,
  User,
  Shield,
  Calendar,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  type ExtendedCompliancePolicy,
  type PolicyCategoryFilter,
  EXTENDED_STATUS_META,
  CATEGORY_META,
  getDisplayStatus,
} from "@/lib/compliance-data";

// ─── Filter types ───────────────────────────────────────────────────────────

const CATEGORY_TABS: { key: PolicyCategoryFilter; label: string }[] = [
  { key: "All", label: "All" },
  { key: "Federal", label: "Federal" },
  { key: "State-Specific", label: "State-Specific" },
  { key: "Client-Specific", label: "Client-Specific" },
  { key: "Employment Type", label: "Employment Type" },
  { key: "Industry", label: "Industry" },
];

const STATE_OPTIONS = [
  { value: "all", label: "All States" },
  { value: "CA", label: "California" },
  { value: "NY", label: "New York" },
  { value: "TX", label: "Texas" },
  { value: "WA", label: "Washington" },
  { value: "IL", label: "Illinois" },
];

const EMPLOYMENT_OPTIONS = [
  { value: "all", label: "All Types" },
  { value: "W-2", label: "W-2" },
  { value: "C2C", label: "C2C" },
  { value: "1099", label: "1099" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "active", label: "Active" },
  { value: "expiring-soon", label: "Expiring Soon" },
  { value: "expired", label: "Expired" },
  { value: "draft", label: "Draft" },
  { value: "under-review", label: "Under Review" },
];

// ─── Sub-components ─────────────────────────────────────────────────────────

function CategoryBadge({ categoryKey }: { categoryKey: string }) {
  const meta = CATEGORY_META[categoryKey] ?? CATEGORY_META.employment;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${meta.color}`}
    >
      {meta.label}
    </span>
  );
}

function FilterDropdown({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  const current = options.find((o) => o.value === value);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
            {current?.label ?? "Select"}
            <ChevronDown className="size-3 opacity-60" />
          </Button>
        }
      />
      <DropdownMenuContent align="start">
        {options.map((opt) => (
          <DropdownMenuItem
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className="text-xs"
          >
            {opt.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─── Policy card ─────────────────────────────────────────────────────────────

function PolicyCard({
  policy,
  onSelect,
}: {
  policy: ExtendedCompliancePolicy;
  onSelect: (p: ExtendedCompliancePolicy) => void;
}) {
  const displayStatus = getDisplayStatus(policy);
  const statusMeta = EXTENDED_STATUS_META[displayStatus];

  return (
    <div
      className="bg-card hover:bg-muted/30 group relative flex cursor-pointer flex-col gap-3 rounded-2xl border p-4 transition-colors"
      onClick={() => onSelect(policy)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onSelect(policy)}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-tight text-foreground">
            {policy.name}
          </p>
          <p className="text-metadata mt-1 line-clamp-2 text-xs">
            {policy.description}
          </p>
        </div>
        <StatusBadge tone={statusMeta.tone} className="mt-0.5 shrink-0 text-[11px]">
          {statusMeta.label}
        </StatusBadge>
      </div>

      {/* Badges row */}
      <div className="flex flex-wrap items-center gap-1.5">
        <CategoryBadge categoryKey={policy.categoryKey} />
        <span className="bg-muted text-muted-foreground inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium">
          <MapPin className="size-2.5" />
          {policy.jurisdiction}
        </span>
        {policy.employmentTypes.map((t) => (
          <span
            key={t}
            className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-[11px] font-medium"
          >
            {t}
          </span>
        ))}
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <User className="size-3" />
          {policy.owner}
        </span>
        <span className="flex items-center gap-1">
          <Calendar className="size-3" />
          <span className="font-mono">{policy.effectiveDate}</span>
          {policy.expirationDate && (
            <>
              <span>→</span>
              <span className="font-mono">{policy.expirationDate}</span>
            </>
          )}
        </span>
        {policy.requiresAck && (
          <span className="text-success-muted-foreground flex items-center gap-1">
            <CheckCircle2 className="size-3" />
            Requires acknowledgment
          </span>
        )}
      </div>

      {/* Footer row */}
      <div className="flex items-center justify-between border-t pt-2.5">
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <span className="font-mono">{policy.version}</span>
          <span className="opacity-50">·</span>
          <span>{policy.impactedCandidates} candidates</span>
        </div>

        {/* Quick actions — only visible on hover */}
        <div
          className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            variant="ghost"
            size="icon-sm"
            title="View"
            onClick={() => onSelect(policy)}
          >
            <Eye className="size-3.5" />
          </Button>
          <Button variant="ghost" size="icon-sm" title="Edit">
            <Pencil className="size-3.5" />
          </Button>
          <Button variant="ghost" size="icon-sm" title="History">
            <History className="size-3.5" />
          </Button>
          <Button variant="ghost" size="icon-sm" title="Impacted Candidates">
            <Users className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Policy detail slide-over ────────────────────────────────────────────────

function PolicyDetailSheet({
  policy,
  open,
  onOpenChange,
}: {
  policy: ExtendedCompliancePolicy | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  if (!policy) return null;
  const displayStatus = getDisplayStatus(policy);
  const statusMeta = EXTENDED_STATUS_META[displayStatus];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-xl"
        showCloseButton={false}
      >
        {/* Header */}
        <SheetHeader className="border-b px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <SheetTitle className="text-base font-semibold leading-snug">
                {policy.name}
              </SheetTitle>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <StatusBadge tone={statusMeta.tone} className="text-[11px]">
                  {statusMeta.label}
                </StatusBadge>
                <CategoryBadge categoryKey={policy.categoryKey} />
                <span className="font-mono text-xs text-muted-foreground">
                  {policy.version}
                </span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onOpenChange(false)}
              className="mt-0.5 shrink-0"
            >
              <X className="size-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="flex flex-col gap-5 px-5 py-5">
            {/* Description */}
            <section>
              <h3 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Description
              </h3>
              <p className="text-sm leading-relaxed text-foreground">
                {policy.description}
              </p>
            </section>

            {/* Dates */}
            <section className="grid grid-cols-2 gap-3">
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-[11px] font-medium text-muted-foreground">
                  Effective Date
                </p>
                <p className="mt-0.5 font-mono text-sm text-foreground">
                  {policy.effectiveDate}
                </p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-[11px] font-medium text-muted-foreground">
                  Expiration Date
                </p>
                <p className="mt-0.5 font-mono text-sm text-foreground">
                  {policy.expirationDate ?? "No expiration"}
                </p>
              </div>
            </section>

            {/* Ownership */}
            <section>
              <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Ownership
              </h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <User className="size-3.5 text-muted-foreground" />
                  <div>
                    <p className="text-[11px] text-muted-foreground">Owner</p>
                    <p className="font-medium">{policy.owner}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="size-3.5 text-muted-foreground" />
                  <div>
                    <p className="text-[11px] text-muted-foreground">
                      Legal Approver
                    </p>
                    <p className="font-medium">{policy.legalApprover}</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Applicability */}
            <section>
              <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Applicable To
              </h3>
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-[11px] text-muted-foreground">
                      Jurisdiction / States
                    </p>
                    <p className="font-medium">
                      {policy.stateApplicability.length > 0
                        ? policy.stateApplicability.join(", ")
                        : policy.jurisdiction}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Building2 className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-[11px] text-muted-foreground">
                      Clients
                    </p>
                    <p className="font-medium">
                      {policy.clientApplicability.join(", ")}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {policy.employmentTypes.map((t) => (
                    <span
                      key={t}
                      className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-[11px] font-medium"
                    >
                      {t}
                    </span>
                  ))}
                  {policy.jobCategories.map((c) => (
                    <span
                      key={c}
                      className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-[11px] font-medium"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            </section>

            {/* Acknowledgment */}
            <section>
              <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Acknowledgment
              </h3>
              {policy.requiresAck ? (
                <div className="bg-success-muted text-success-muted-foreground flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm">
                  <CheckCircle2 className="size-4 shrink-0" />
                  <span>
                    Required —{" "}
                    <span className="font-medium">{policy.ackFormName}</span>
                  </span>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">
                  No acknowledgment required.
                </p>
              )}
            </section>

            {/* Related forms */}
            {policy.relatedForms.length > 0 && (
              <section>
                <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Related Forms
                </h3>
                <ul className="flex flex-col gap-1">
                  {policy.relatedForms.map((form) => (
                    <li key={form} className="flex items-center gap-2 text-sm">
                      <FileText className="size-3.5 text-muted-foreground" />
                      <span className="text-primary hover:underline cursor-pointer">
                        {form}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Related workflow */}
            {policy.relatedWorkflow && (
              <section>
                <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Related Workflow
                </h3>
                <div className="flex items-center gap-2 text-sm">
                  <Workflow className="size-3.5 text-muted-foreground" />
                  <span className="text-primary hover:underline cursor-pointer">
                    {policy.relatedWorkflow}
                  </span>
                </div>
              </section>
            )}

            {/* Change history */}
            <section>
              <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Change History
              </h3>
              <ol className="flex flex-col gap-2">
                {policy.changeHistory.map((change, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <div className="flex flex-col items-center">
                      <span className="mt-1 size-1.5 shrink-0 rounded-full bg-border" />
                      {i < policy.changeHistory.length - 1 && (
                        <span className="mt-1 w-px flex-1 bg-border" />
                      )}
                    </div>
                    <div className="pb-2">
                      <p className="text-foreground">{change.description}</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        <span className="font-mono">{change.date}</span>
                        {" · "}
                        {change.actor}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          </div>
        </ScrollArea>

        {/* Footer actions */}
        <div className="border-t px-5 py-3 flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs"
          >
            <Users className="size-3.5" />
            View {policy.impactedCandidates} Impacted Candidates
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs"
          >
            <Package className="size-3.5" />
            See Package Requirements
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Main grid component ─────────────────────────────────────────────────────

export function CompliancePoliciesGrid({
  policies,
}: {
  policies: ExtendedCompliancePolicy[];
}) {
  const [search, setSearch] = useState("");
  const [categoryTab, setCategoryTab] =
    useState<PolicyCategoryFilter>("All");
  const [stateFilter, setStateFilter] = useState("all");
  const [employmentFilter, setEmploymentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedPolicy, setSelectedPolicy] =
    useState<ExtendedCompliancePolicy | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  function handleSelect(policy: ExtendedCompliancePolicy) {
    setSelectedPolicy(policy);
    setSheetOpen(true);
  }

  const filtered = useMemo(() => {
    return policies.filter((p) => {
      // Search
      if (search) {
        const q = search.toLowerCase();
        const hit =
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.jurisdiction.toLowerCase().includes(q) ||
          p.owner.toLowerCase().includes(q);
        if (!hit) return false;
      }

      // Category tab
      if (categoryTab !== "All") {
        if (categoryTab === "Federal" && p.jurisdiction !== "Federal") return false;
        if (categoryTab === "State-Specific" && p.stateApplicability.length === 0)
          return false;
        if (
          categoryTab === "Client-Specific" &&
          !p.clientApplicability.some((c) => c !== "All")
        )
          return false;
        if (categoryTab === "Employment Type" && p.categoryKey !== "employment")
          return false;
        if (categoryTab === "Industry" && p.categoryKey !== "industry")
          return false;
      }

      // State
      if (stateFilter !== "all") {
        if (!p.stateApplicability.includes(stateFilter)) return false;
      }

      // Employment type
      if (employmentFilter !== "all") {
        if (!p.employmentTypes.includes(employmentFilter)) return false;
      }

      // Status
      if (statusFilter !== "all") {
        const ds = getDisplayStatus(p);
        if (ds !== statusFilter) return false;
      }

      return true;
    });
  }, [policies, search, categoryTab, stateFilter, employmentFilter, statusFilter]);

  return (
    <>
      {/* Filters */}
      <div className="bg-card rounded-2xl border shadow-xs">
        {/* Search + dropdowns */}
        <div className="flex flex-wrap items-center gap-2 border-b px-4 py-3">
          <div className="relative min-w-[220px] flex-1">
            <Search className="text-muted-foreground absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2" />
            <Input
              placeholder="Search policies…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 text-sm"
            />
          </div>
          <FilterDropdown
            value={stateFilter}
            onChange={setStateFilter}
            options={STATE_OPTIONS}
          />
          <FilterDropdown
            value={employmentFilter}
            onChange={setEmploymentFilter}
            options={EMPLOYMENT_OPTIONS}
          />
          <FilterDropdown
            value={statusFilter}
            onChange={setStatusFilter}
            options={STATUS_OPTIONS}
          />
          <span className="text-muted-foreground ml-auto text-xs tabular-nums">
            {filtered.length} of {policies.length} policies
          </span>
        </div>

        {/* Category tabs */}
        <div className="flex items-center gap-1 overflow-x-auto border-b px-4 py-2">
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setCategoryTab(tab.key)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors ${
                categoryTab === tab.key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Policy cards grid */}
        <div className="p-4">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-12 text-center">
              <FileText className="text-muted-foreground mb-2 size-8 opacity-40" />
              <p className="text-sm font-medium text-foreground">No policies match your filters</p>
              <p className="text-muted-foreground mt-1 text-xs">
                Try adjusting your search or filter criteria.
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-3 text-xs"
                onClick={() => {
                  setSearch("");
                  setCategoryTab("All");
                  setStateFilter("all");
                  setEmploymentFilter("all");
                  setStatusFilter("all");
                }}
              >
                Clear all filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((policy) => (
                <PolicyCard
                  key={policy.id}
                  policy={policy}
                  onSelect={handleSelect}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Detail slide-over */}
      <PolicyDetailSheet
        policy={selectedPolicy}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </>
  );
}
