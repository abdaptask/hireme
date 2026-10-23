import Link from "next/link";
import { ArrowLeft, Lock } from "lucide-react";
import { PageContainer } from "@/components/page";
import { Button } from "@/components/ui/button";
import { getRole, type RoleId } from "@/lib/roles";

/** Shown when the current role isn't entitled to a report (§42, §111.3 error states). */
export function ReportAccessDenied({ reportName, role }: { reportName?: string; role: RoleId }) {
  return (
    <PageContainer>
      <div className="mx-auto mt-10 max-w-lg rounded-2xl border p-8 text-center shadow-xs sm:p-10">
        <span className="bg-warning-muted text-warning-muted-foreground mx-auto flex size-12 items-center justify-center rounded-xl">
          <Lock className="size-6" />
        </span>
        <h1 className="text-section-heading mt-4">Not available for your role</h1>
        <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
          {reportName ? <strong className="text-foreground">{reportName}</strong> : "This report"} isn&apos;t part of the{" "}
          <strong className="text-foreground">{getRole(role).label}</strong> report catalog. Ask an administrator if you
          need access, or switch roles from the profile menu.
        </p>
        <Button className="mt-6" variant="outline" nativeButton={false} render={<Link href="/reports" />}>
          <ArrowLeft className="size-4" /> Your reports
        </Button>
      </div>
    </PageContainer>
  );
}
