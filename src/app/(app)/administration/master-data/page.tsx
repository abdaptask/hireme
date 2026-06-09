/**
 * /administration/master-data — the Master Data CRUD workspace
 * (CLAUDE.md §2.4 configurable; §30 master data; §120 design system; §121.1
 * registry). Renders the two-pane editor: category search + filter on the
 * left, value table on the right. All client-state-aware logic lives in
 * MasterDataClient; this file is a server shell.
 */

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/page";
import { MasterDataClient } from "@/components/master-data/master-data-client";

export default function MasterDataPage() {
  return (
    <PageContainer className="flex flex-col gap-5">
      <div>
        <Link
          href="/administration"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-xs"
        >
          <ArrowLeft className="size-3.5" />
          Back to Administration
        </Link>
      </div>

      <PageHeader
        title="Master Data"
        description="Manage master lookup data categories that feed dropdowns and rules across the platform."
      />

      <MasterDataClient />
    </PageContainer>
  );
}
