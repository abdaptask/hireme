import Link from "next/link";
import { ArrowRight, ShieldAlert } from "lucide-react";
import { PageContainer } from "@/components/page";
import { db } from "@/lib/db";
import { ApprovalsClient } from "./approvals-client";

export const dynamic = "force-dynamic";

/** Live NHR exceptions awaiting Super Admin approval (§25), above the approval inbox. */
export default async function ApprovalsPage() {
  const pending = await db.newHireRequest.findMany({
    where: { approvalStatus: "pending" },
    orderBy: { submittedAt: "asc" },
    include: { candidate: { select: { id: true, firstName: true, lastName: true, clientName: true, startDate: true } } },
  });

  return (
    <>
      {pending.length > 0 && (
        <PageContainer className="pb-0">
          <section className="border-warning/40 bg-warning-muted/30 rounded-xl border">
            <h2 className="text-card-heading flex items-center gap-1.5 border-b px-4 py-2.5">
              <ShieldAlert className="text-warning-muted-foreground size-4" /> New hire requests awaiting your approval
              <span className="text-muted-foreground ml-1 text-xs tabular-nums">{pending.length}</span>
            </h2>
            <ul className="divide-y">
              {pending.map((n) => (
                <li key={n.id}>
                  <Link href={`/candidates/${n.candidate.id}`} className="hover:bg-muted/40 flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-sm">
                    <span className="font-medium">
                      {n.candidate.firstName} {n.candidate.lastName}
                    </span>
                    <span className="text-muted-foreground">{n.candidate.clientName}</span>
                    <span className="text-warning-muted-foreground">{n.exceptions.join("; ")}</span>
                    <span className="text-muted-foreground truncate">Reason: {n.exceptionReason}</span>
                    <span className="text-muted-foreground ml-auto text-xs">by {n.submittedBy}</span>
                    <ArrowRight className="text-muted-foreground size-4" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </PageContainer>
      )}
      <ApprovalsClient />
    </>
  );
}
