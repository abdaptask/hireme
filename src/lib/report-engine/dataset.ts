/**
 * Live operational dataset for the report engine (§34, §49).
 *
 * Loads every reporting entity once per request (React `cache`) so all
 * reports compute from the same consistent snapshot. Volumes are small enough
 * to aggregate in memory; a warehouse replaces this at scale (§44).
 *
 * Server-only — never import in client components.
 */

import { cache } from "react";
import { db } from "@/lib/db";
import type { ViewerScope } from "./access";

async function load() {
  const [
    candidates,
    consultants,
    clients,
    assignments,
    packages,
    documents,
    screenings,
    equipment,
    trainings,
    communications,
    exceptions,
    integrations,
    integrationEvents,
    auditEvents,
    promises,
  ] = await Promise.all([
    db.candidate.findMany({ include: { payroll: true, billing: true } }),
    db.consultant.findMany(),
    db.client.findMany(),
    db.assignment.findMany(),
    db.package.findMany({
      include: {
        items: true,
        approvals: true,
        dispatches: true,
        client: { select: { name: true } },
      },
    }),
    db.document.findMany(),
    db.screening.findMany(),
    db.equipment.findMany(),
    db.training.findMany(),
    db.communication.findMany(),
    db.exception.findMany(),
    db.integration.findMany(),
    db.integrationEvent.findMany({
      include: { integration: { select: { name: true, category: true } } },
    }),
    db.auditEvent.findMany(),
    db.clientPromise.findMany({ include: { client: { select: { name: true } } } }),
  ]);

  return {
    now: new Date(),
    /** Set when the dataset is scoped to a date range (see `scopeDataset`). */
    range: null as { from: Date; to: Date } | null,
    candidates,
    consultants,
    clients,
    assignments,
    packages,
    documents,
    screenings,
    equipment,
    trainings,
    communications,
    exceptions,
    integrations,
    integrationEvents,
    auditEvents,
    promises,
    candById: new Map(candidates.map((c) => [c.id, c])),
    clientById: new Map(clients.map((c) => [c.id, c])),
  };
}

export const loadDataset = cache(load);

export type Dataset = Awaited<ReturnType<typeof load>>;
export type DsCandidate = Dataset["candidates"][number];

/**
 * Scope activity records to a date range (§50.3). Each entity is filtered by
 * its natural activity date; reference data (clients, integrations) and lookup
 * maps stay complete so names always resolve.
 */
export function scopeDataset(ds: Dataset, from: Date, to: Date): Dataset {
  const inRange = (d: Date | null | undefined) => !!d && d >= from && d <= to;
  return {
    ...ds,
    range: { from, to },
    candidates: ds.candidates.filter((c) => inRange(c.createdAt)),
    consultants: ds.consultants.filter((c) => inRange(c.startDate) || inRange(c.endDate)),
    assignments: ds.assignments.filter((a) => inRange(a.startDate) || inRange(a.endDate)),
    packages: ds.packages.filter((p) => inRange(p.createdAt)),
    documents: ds.documents.filter((d) => inRange(d.uploadedAt ?? d.createdAt)),
    screenings: ds.screenings.filter((s) => inRange(s.orderedAt ?? s.createdAt)),
    equipment: ds.equipment.filter((e) => inRange(e.createdAt)),
    trainings: ds.trainings.filter((t) => inRange(t.createdAt)),
    communications: ds.communications.filter((m) => inRange(m.sentAt ?? m.createdAt)),
    exceptions: ds.exceptions.filter((e) => inRange(e.createdAt)),
    integrationEvents: ds.integrationEvents.filter((e) => inRange(e.timestamp)),
    auditEvents: ds.auditEvents.filter((e) => inRange(e.timestamp)),
    promises: ds.promises.filter((p) => inRange(new Date(p.promisedDate))),
  };
}

/**
 * Row-level security (§42, §72): restrict a dataset to the records the viewer
 * owns. Lookup maps stay complete so related names still resolve.
 */
export function scopeToViewer(ds: Dataset, scope: ViewerScope): Dataset {
  if (scope.kind === "all" || scope.kind === "candidate") return ds;
  if (scope.kind === "none") {
    return { ...ds, candidates: [], consultants: [], assignments: [], packages: [], documents: [], screenings: [], equipment: [], trainings: [], communications: [], exceptions: [], promises: [], auditEvents: [], integrationEvents: [], integrations: [], clients: [] };
  }

  let candidates = ds.candidates;
  let consultants = ds.consultants;
  let clients = ds.clients;
  if (scope.kind === "recruiter") {
    const names = new Set(scope.names);
    candidates = candidates.filter((c) => c.recruiter && names.has(c.recruiter));
    consultants = consultants.filter((c) => c.recruiter && names.has(c.recruiter));
  } else if (scope.kind === "onboarder") {
    candidates = candidates.filter((c) => c.onboarder === scope.name);
    consultants = consultants.filter((c) => c.onboarder === scope.name);
  } else if (scope.kind === "account-manager") {
    clients = clients.filter((c) => c.accountManager === scope.name);
    const book = new Set(clients.map((c) => c.name));
    candidates = candidates.filter((c) => c.clientName && book.has(c.clientName));
    consultants = consultants.filter((c) => c.accountManager === scope.name || (c.clientName && book.has(c.clientName)));
  }

  const candIds = new Set(candidates.map((c) => c.id));
  const consIds = new Set(consultants.map((c) => c.id));
  const clientIds = new Set(clients.map((c) => c.id));
  const own = (id: string | null | undefined) => !!id && candIds.has(id);
  const viewerNames = scope.kind === "recruiter" ? scope.names : [scope.name];

  return {
    ...ds,
    candidates,
    consultants,
    clients,
    assignments: ds.assignments.filter((a) => own(a.candidateId) || (!!a.consultantId && consIds.has(a.consultantId)) || (scope.kind === "account-manager" && !!a.clientId && clientIds.has(a.clientId))),
    packages: scope.kind === "account-manager" ? ds.packages.filter((p) => !!p.clientId && clientIds.has(p.clientId)) : ds.packages.filter((p) => !!p.consultant && candidates.some((c) => `${c.firstName} ${c.lastName}` === p.consultant)),
    documents: ds.documents.filter((d) => own(d.candidateId)),
    screenings: ds.screenings.filter((s) => own(s.candidateId)),
    equipment: ds.equipment.filter((e) => own(e.candidateId)),
    trainings: ds.trainings.filter((t) => own(t.candidateId)),
    communications: ds.communications.filter((m) => own(m.candidateId)),
    exceptions: ds.exceptions.filter((e) => own(e.candidateId) || (!!e.owner && viewerNames.includes(e.owner))),
    promises: ds.promises.filter((p) => clientIds.has(p.clientId)),
    auditEvents: ds.auditEvents.filter((e) => own(e.candidateId) || viewerNames.includes(e.actor) || (!!e.clientId && scope.kind === "account-manager" && clientIds.has(e.clientId))),
    // System-level data is not part of a personal book of business.
    integrations: [],
    integrationEvents: [],
  };
}
