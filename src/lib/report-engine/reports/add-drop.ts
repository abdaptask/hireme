/**
 * Add / Drop report (§68, back office) — contract adds (assignment starts),
 * drops (assignment ends), and full-time placements grouped by week, month,
 * quarter, or year, with GP / NP per hour (or week / month / year) and
 * FT fees spread over 960 hours.
 */

import type { ReportDef, ReportTable, Row } from "../types";
import type { Dataset } from "../dataset";
import { DAY_MS, countBy, employment, fullName, iso, points, round, sum, title } from "../helpers";

type Period = "week" | "month" | "quarter" | "year";

const DEFAULT_SPAN: Record<Period, number> = { week: 12, month: 12, quarter: 8, year: 3 };

function periodStart(d: Date, p: Period): Date {
  switch (p) {
    case "week": {
      const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); // Monday
      return x;
    }
    case "month":
      return new Date(d.getFullYear(), d.getMonth(), 1);
    case "quarter":
      return new Date(d.getFullYear(), Math.floor(d.getMonth() / 3) * 3, 1);
    case "year":
      return new Date(d.getFullYear(), 0, 1);
  }
}

function nextPeriod(d: Date, p: Period): Date {
  switch (p) {
    case "week":
      return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7);
    case "month":
      return new Date(d.getFullYear(), d.getMonth() + 1, 1);
    case "quarter":
      return new Date(d.getFullYear(), d.getMonth() + 3, 1);
    case "year":
      return new Date(d.getFullYear() + 1, 0, 1);
  }
}

function periodLabel(d: Date, p: Period): string {
  switch (p) {
    case "week":
      return `Wk of ${d.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
    case "month":
      return d.toLocaleString("en-US", { month: "short", year: "numeric" });
    case "quarter":
      return `Q${Math.floor(d.getMonth() / 3) + 1} ${d.getFullYear()}`;
    case "year":
      return String(d.getFullYear());
  }
}

const DROPPED = new Set(["completed", "terminated"]);
const FT_LIVE = new Set(["placed", "active", "extended", "completed"]);

/** Hours a full-time placement fee is spread over to get an hourly GP equivalent. */
const FT_FEE_HOURS = 960;
/** Default fee when a placement doesn't record one (and for conversions). */
const DEFAULT_FT_FEE_PCT = 20;
const CONVERSION_FEE_PCT = 15;

/** Employer burden on pay (taxes, WC, benefits) by employment type. */
const BURDEN: Record<string, number> = { W2: 0.15, CONTRACT_TO_HIRE: 0.15, FULL_TIME: 0, C2C: 0, INDEPENDENT_1099: 0, INTERN: 0.1 };
/** MSP / VMS fee charged on bill rate when the client runs an MSP program. */
const MSP_FEE = 0.03;

type Basis = "hour" | "week" | "month" | "year";
const BASIS_HOURS: Record<Basis, number> = { hour: 1, week: 40, month: 2080 / 12, year: 2080 };
const BASIS_SUFFIX: Record<Basis, string> = { hour: "/hr", week: "/wk", month: "/mo", year: "/yr" };

function dropReason(remarks: string | null, status: string): string {
  const r = (remarks ?? "").toLowerCase();
  if (r.includes("convert")) return "Converted to client";
  if (r.includes("resign")) return "Resigned";
  if (status === "terminated" || r.includes("terminat")) return "Terminated";
  if (r.includes("budget")) return "Client budget";
  return "Assignment completed";
}

/** Placement fee for a full-time hire: "Direct hire — 20% fee on $120,000 salary", else default % of pay × 2,080. */
function placementFee(a: Dataset["assignments"][number], pctDefault: number): { fee: number; salary: number; pct: number } {
  const m = (a.remarks ?? "").match(/(\d+(?:\.\d+)?)% fee on \$([\d,]+)/);
  const salary = m ? Number(m[2].replace(/,/g, "")) : Math.round((a.payRate ?? 0) * 2080);
  const pct = m ? Number(m[1]) : pctDefault;
  return { fee: Math.round(salary * (pct / 100)), salary, pct };
}

export const addDropReports: ReportDef[] = [
  {
    slug: "add-drop",
    name: "Add / Drop Report",
    description: "Contract adds and drops with GP and NP, full-time placements, and net change — by week, month, quarter, or year.",
    section: "lifecycle",
    spec: "§68 · Back office",
    personas: ["super-admin", "executive", "account-manager", "recruiting-manager"],
    owner: "Back Office",
    dateScope: "custom",
    dateBasis: "Adds by start date, drops by end date, FT by placement / conversion date",
    definitions: [
      { term: "Add", def: "A contract assignment (W-2, C2C, 1099, contract-to-hire) that started in the period." },
      { term: "Drop", def: "A contract assignment that ended in the period — completed, resigned, terminated, or converted." },
      { term: "GP (gross profit)", def: "Spread per hour: bill rate − pay rate. Summed across the adds or drops in the period." },
      { term: "NP (net profit)", def: "Bill rate × (1 − 3% MSP fee when the client runs an MSP) − pay rate × (1 + burden). Burden: 15% for W-2 and contract-to-hire, 0% for C2C / 1099." },
      { term: "FT # / FT GP", def: "Full-time placements (direct hire) and contract-to-perm conversions in the period. FT GP = placement fee ÷ 960 hours. Direct-hire fee = recorded % × salary (default 20%); conversion fee = 15% × annualized pay." },
      { term: "Diff", def: "Adds − drops (count, GP, NP)." },
      { term: "Diff # with FT / Diff $ with FT", def: "Diff # + FT #, and Diff GP + FT GP." },
      { term: "$ basis", def: "Hourly by default. Weekly ×40, monthly ×173.33, annual ×2,080 hours — applied to every $ column, including FT GP." },
    ],
    controls: (ds) => [
      { key: "period", label: "Group by", default: "month", options: [{ value: "week", label: "Week" }, { value: "month", label: "Month" }, { value: "quarter", label: "Quarter" }, { value: "year", label: "Year" }] },
      { key: "basis", label: "$ basis", default: "hour", options: [{ value: "hour", label: "Per hour" }, { value: "week", label: "Per week (×40)" }, { value: "month", label: "Per month (×173.33)" }, { value: "year", label: "Annualized (×2,080)" }] },
      { key: "client", label: "Client", default: "all", options: [{ value: "all", label: "All clients" }, ...ds.clients.map((c) => ({ value: c.id, label: c.name })).sort((a, b) => a.label.localeCompare(b.label))] },
      { key: "employment", label: "Contract type", default: "all", options: [{ value: "all", label: "All types" }, { value: "W2", label: "W-2" }, { value: "C2C", label: "C2C" }, { value: "INDEPENDENT_1099", label: "1099" }, { value: "CONTRACT_TO_HIRE", label: "Contract-to-hire" }] },
    ],
    load(ds, ctx) {
      const period = (["week", "month", "quarter", "year"].includes(ctx.params.period) ? ctx.params.period : "month") as Period;
      const basis = (["hour", "week", "month", "year"].includes(ctx.params.basis) ? ctx.params.basis : "hour") as Basis;
      const H = BASIS_HOURS[basis];
      const sfx = BASIS_SUFFIX[basis];
      const clientId = ctx.params.client && ctx.params.client !== "all" ? ctx.params.client : null;
      const emp = ctx.params.employment && ctx.params.employment !== "all" ? ctx.params.employment : null;
      const money = (n: number) => Math.round(n * H * 100) / 100;

      // Range: user's selection, else the trailing N periods ending this period.
      const to = ctx.range ? (ctx.range.to < ds.now ? ctx.range.to : ds.now) : ds.now;
      let from: Date;
      if (ctx.range) from = ctx.range.from;
      else {
        from = periodStart(ds.now, period);
        for (let i = 1; i < DEFAULT_SPAN[period]; i++) from = periodStart(new Date(from.getTime() - DAY_MS), period);
      }

      const consultantById = new Map(ds.consultants.map((c) => [c.id, c]));
      const workerOf = (a: Dataset["assignments"][number]) => {
        const c = a.consultantId ? consultantById.get(a.consultantId) : undefined;
        if (c) return { name: fullName(c), recruiter: c.recruiter ?? "—" };
        const k = a.candidateId ? ds.candById.get(a.candidateId) : undefined;
        return k ? { name: fullName(k), recruiter: k.recruiter ?? "—" } : { name: "—", recruiter: "—" };
      };
      const clientName = (a: Dataset["assignments"][number]) => (a.clientId ? ds.clientById.get(a.clientId)?.name ?? "—" : "—");

      const inScope = (a: Dataset["assignments"][number]) => !!a.startDate && (!clientId || a.clientId === clientId);
      const contracts = ds.assignments.filter((a) => inScope(a) && a.employmentType !== "FULL_TIME" && a.status !== "pending" && a.status !== "placed" && (!emp || a.employmentType === emp));
      const directHires = emp ? [] : ds.assignments.filter((a) => inScope(a) && a.employmentType === "FULL_TIME" && FT_LIVE.has(a.status));
      const isDrop = (a: (typeof contracts)[number]) => DROPPED.has(a.status) && !!a.endDate && a.endDate <= ds.now;
      const activeList = (t: Date) => contracts.filter((a) => a.startDate! <= t && !(isDrop(a) && a.endDate! <= t));

      // Period buckets
      const buckets: { start: Date; end: Date; label: string }[] = [];
      for (let s = periodStart(from, period); s <= to && buckets.length < 160; s = nextPeriod(s, period)) {
        buckets.push({ start: s, end: nextPeriod(s, period), label: periodLabel(s, period) });
      }
      const rangeStart = buckets[0]?.start ?? from;
      const bucketOf = (d: Date) => buckets.find((b) => d >= b.start && d < b.end)?.label ?? null;
      const inWindow = (d: Date | null) => !!d && d >= rangeStart && d <= to && d <= ds.now;

      // Per-hour economics of a contract assignment
      const econ = (a: Dataset["assignments"][number]) => {
        const bill = a.billRate ?? 0;
        const pay = a.payRate ?? 0;
        const msp = a.clientId && ds.clientById.get(a.clientId)?.msp ? MSP_FEE : 0;
        const burden = BURDEN[a.employmentType ?? "W2"] ?? 0.15;
        return { gp: bill - pay, np: bill * (1 - msp) - pay * (1 + burden) };
      };

      type Ev = { type: "Add" | "Drop" | "FT"; date: Date; period: string | null; client: string; worker: string; recruiter: string; role: string; employment: string; bill: number | null; pay: number | null; gp: number; np: number; fee: number | null; reason: string };
      const events: Ev[] = [];
      for (const a of contracts) {
        const w = workerOf(a);
        const base = { client: clientName(a), worker: w.name, recruiter: w.recruiter, role: a.jobTitle ?? "—", employment: employment(a.employmentType), bill: a.billRate, pay: a.payRate, ...econ(a), fee: null };
        if (inWindow(a.startDate)) events.push({ type: "Add", date: a.startDate!, period: bucketOf(a.startDate!), ...base, reason: "New start" });
        if (isDrop(a) && inWindow(a.endDate)) {
          const reason = dropReason(a.remarks, a.status);
          events.push({ type: "Drop", date: a.endDate!, period: bucketOf(a.endDate!), ...base, reason });
          // Contract-to-perm conversion earns a conversion fee (§68.2).
          if (reason === "Converted to client") {
            const { fee } = placementFee(a, CONVERSION_FEE_PCT);
            events.push({ type: "FT", date: a.endDate!, period: bucketOf(a.endDate!), ...base, gp: fee / FT_FEE_HOURS, np: fee / FT_FEE_HOURS, fee, reason: `Conversion — ${CONVERSION_FEE_PCT}% fee` });
          }
        }
      }
      for (const a of directHires) {
        if (!inWindow(a.startDate)) continue;
        const w = workerOf(a);
        const { fee, salary, pct: p } = placementFee(a, DEFAULT_FT_FEE_PCT);
        events.push({ type: "FT", date: a.startDate!, period: bucketOf(a.startDate!), client: clientName(a), worker: w.name, recruiter: w.recruiter, role: a.jobTitle ?? "—", employment: "Full-time", bill: null, pay: null, gp: fee / FT_FEE_HOURS, np: fee / FT_FEE_HOURS, fee, reason: `Direct hire — ${p}% of $${salary.toLocaleString("en-US")}` });
      }

      // Aggregate a set of events into the add / drop columns.
      const agg = (xs: Ev[]) => {
        const add = xs.filter((e) => e.type === "Add");
        const drop = xs.filter((e) => e.type === "Drop");
        const ft = xs.filter((e) => e.type === "FT");
        const s = (ys: Ev[], k: "gp" | "np") => money(sum(ys.map((e) => e[k])));
        const r = {
          addCount: add.length, addGP: s(add, "gp"), addNP: s(add, "np"),
          dropCount: drop.length, dropGP: s(drop, "gp"), dropNP: s(drop, "np"),
          ftCount: ft.length, ftGP: s(ft, "gp"),
        };
        return {
          ...r,
          diffCount: r.addCount - r.dropCount,
          diffGP: round(r.addGP - r.dropGP, 2),
          diffNP: round(r.addNP - r.dropNP, 2),
          diffWithFt: r.addCount - r.dropCount + r.ftCount,
          diffDollarWithFt: round(r.addGP - r.dropGP + r.ftGP, 2),
        };
      };

      const summary = buckets.map((b) => ({ period: b.label, ...agg(events.filter((e) => e.period === b.label)) }));
      const totals = agg(events);

      const hc = buckets.map((b) => {
        const opening = activeList(new Date(b.start.getTime() - 1));
        const closing = activeList(new Date(Math.min(b.end.getTime() - 1, to.getTime())));
        return {
          period: b.label,
          opening: opening.length,
          closing: closing.length,
          change: closing.length - opening.length,
          growth: opening.length ? round(((closing.length - opening.length) / opening.length) * 100) : 0,
          closingGP: money(sum(closing.map((a) => econ(a).gp))),
          closingNP: money(sum(closing.map((a) => econ(a).np))),
        };
      });

      const clients = [...countBy(events, (e) => e.client).keys()];
      const byClient = clients
        .map((c) => ({ client: c, ...agg(events.filter((e) => e.client === c)) }))
        .sort((a, b) => Math.abs(b.diffDollarWithFt) - Math.abs(a.diffDollarWithFt));

      const unit = { week: "week", month: "month", quarter: "quarter", year: "year" }[period];
      const mainColumns = (first: { key: string; label: string }) => [
        first,
        { key: "addCount", label: "Add #", type: "number" as const },
        { key: "addGP", label: `Add GP ${sfx}`, type: "currency" as const },
        { key: "addNP", label: `Add NP ${sfx}`, type: "currency" as const },
        { key: "dropCount", label: "Drop #", type: "number" as const },
        { key: "dropGP", label: `Drop GP ${sfx}`, type: "currency" as const },
        { key: "dropNP", label: `Drop NP ${sfx}`, type: "currency" as const },
        { key: "diffCount", label: "Diff #", type: "number" as const },
        { key: "diffGP", label: `Diff GP ${sfx}`, type: "currency" as const },
        { key: "diffNP", label: `Diff NP ${sfx}`, type: "currency" as const },
        { key: "ftCount", label: "FT #", type: "number" as const },
        { key: "ftGP", label: `FT GP ${sfx}`, type: "currency" as const },
        { key: "diffWithFt", label: "Diff # with FT", type: "number" as const },
        { key: "diffDollarWithFt", label: `Diff $ with FT ${sfx}`, type: "currency" as const },
      ];

      const detail: Row[] = events
        .sort((a, b) => b.date.getTime() - a.date.getTime())
        .map((e) => ({
          type: e.type,
          date: iso(e.date),
          period: e.period,
          worker: e.worker,
          client: e.client,
          role: e.role,
          employment: e.employment,
          recruiter: e.recruiter,
          billRate: e.bill,
          payRate: e.pay,
          gp: money(e.gp),
          np: money(e.np),
          fee: e.fee,
          reason: e.reason,
        }));

      const lastHc = hc[hc.length - 1];
      return {
        kpis: [
          { label: "Add #", value: totals.addCount, tone: "success", hint: `GP ${fmtMoney(totals.addGP)}${sfx}` },
          { label: "Drop #", value: totals.dropCount, tone: "danger", hint: `GP ${fmtMoney(totals.dropGP)}${sfx}` },
          { label: "Diff #", value: signed(totals.diffCount), tone: totals.diffCount >= 0 ? "success" : "danger" },
          { label: `Diff GP ${sfx}`, value: totals.diffGP, format: "currency", tone: totals.diffGP >= 0 ? "success" : "danger", hint: `NP ${fmtMoney(totals.diffNP)}${sfx}` },
          { label: "FT #", value: totals.ftCount, tone: "ai", hint: `GP ${fmtMoney(totals.ftGP)}${sfx}` },
          { label: `Diff $ with FT ${sfx}`, value: totals.diffDollarWithFt, format: "currency", tone: totals.diffDollarWithFt >= 0 ? "success" : "danger", hint: `Diff # with FT ${signed(totals.diffWithFt)}` },
        ],
        charts: [
          {
            kind: "stacked",
            title: `Add GP vs drop GP by ${unit} (${sfx})`,
            drillKey: "period",
            format: "currency",
            segments: [
              { key: "add", label: "Add GP", tone: "success" },
              { key: "drop", label: "Drop GP", tone: "danger" },
              { key: "ft", label: "FT GP", tone: "ai" },
            ],
            rows: summary.map((r) => ({ label: r.period, values: { add: r.addGP, drop: r.dropGP, ft: r.ftGP } })),
          },
          {
            kind: "bar",
            title: `Diff $ with FT by ${unit} (${sfx})`,
            drillKey: "period",
            format: "currency",
            points: summary.map((r) => ({ label: r.period, value: r.diffDollarWithFt, tone: r.diffDollarWithFt >= 0 ? ("success" as const) : ("danger" as const) })),
          },
          { kind: "trend", title: `Contract headcount (closing) by ${unit}`, points: hc.map((r) => ({ label: r.period.replace("Wk of ", ""), value: r.closing, tone: "info" as const })) },
          { kind: "bar", title: "Drop reasons", drillKey: "reason", points: points(countBy(events.filter((e) => e.type === "Drop"), (e) => e.reason), { tone: "danger" }) },
        ],
        table: {
          title: `Add / drop by ${unit}`,
          columns: mainColumns({ key: "period", label: title(unit) }),
          rows: summary,
          totals: { period: "Total", ...totals },
        },
        extraTables: ([
          {
            title: "Add / drop by client",
            columns: mainColumns({ key: "client", label: "Client" }),
            rows: byClient,
            totals: { client: "Total", ...totals },
          },
          {
            title: `Contract headcount & run-rate by ${unit}`,
            columns: [
              { key: "period", label: title(unit) },
              { key: "opening", label: "Opening HC", type: "number" },
              { key: "closing", label: "Closing HC", type: "number" },
              { key: "change", label: "Change", type: "number" },
              { key: "growth", label: "Growth", type: "percent" },
              { key: "closingGP", label: `Closing GP run-rate ${sfx}`, type: "currency" },
              { key: "closingNP", label: `Closing NP run-rate ${sfx}`, type: "currency" },
            ],
            rows: hc,
            totals: lastHc ? { period: "End of range", opening: hc[0].opening, closing: lastHc.closing, change: lastHc.closing - hc[0].opening, growth: hc[0].opening ? round(((lastHc.closing - hc[0].opening) / hc[0].opening) * 100) : 0, closingGP: lastHc.closingGP, closingNP: lastHc.closingNP } : undefined,
          },
          {
            title: "Add / drop / FT detail",
            columns: [
              { key: "type", label: "Type", type: "status" },
              { key: "date", label: "Date", type: "date" },
              { key: "period", label: title(unit) },
              { key: "worker", label: "Worker" },
              { key: "client", label: "Client" },
              { key: "role", label: "Role" },
              { key: "employment", label: "Type of hire" },
              { key: "recruiter", label: "Recruiter" },
              { key: "billRate", label: "Bill rate", type: "currency" },
              { key: "payRate", label: "Pay rate", type: "currency" },
              { key: "gp", label: `GP ${sfx}`, type: "currency" },
              { key: "np", label: `NP ${sfx}`, type: "currency" },
              { key: "fee", label: "FT fee", type: "currency" },
              { key: "reason", label: "Reason" },
            ],
            rows: detail,
          },
        ] as ReportTable[]),
      };
    },
  },
];

function signed(n: number): string {
  return `${n > 0 ? "+" : ""}${n}`;
}

function fmtMoney(n: number): string {
  return `${n < 0 ? "-" : ""}$${Math.abs(n).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}
