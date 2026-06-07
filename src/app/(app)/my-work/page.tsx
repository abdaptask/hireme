import Link from "next/link";
import type { Metadata } from "next";
import { CheckCircle2, Inbox } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/page";
import { StatTile } from "@/components/workspace/stat-tile";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getWorkItems, type Priority, type WorkItem } from "@/lib/ops-data";

export const metadata: Metadata = { title: "My Work" };

const PRIORITY_DOT: Record<Priority, string> = {
  Critical: "bg-danger",
  High: "bg-warning",
  Medium: "bg-info",
  Low: "bg-neutral",
};

function WorkRow({ item }: { item: WorkItem }) {
  return (
    <div className="hover:bg-muted/40 flex flex-wrap items-center gap-3 border-b px-4 py-3 last:border-0">
      <span className={cn("size-2 shrink-0 rounded-full", PRIORITY_DOT[item.priority])} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">{item.type}</span>
          <StatusBadge tone={item.tone} withDot={false}>
            {item.priority}
          </StatusBadge>
        </div>
        <p className="text-metadata">
          <Link href={`/candidates/${item.candidate.id}`} className="hover:text-primary font-medium">
            {item.candidate.name}
          </Link>{" "}
          · {item.candidate.client} · {item.due}
        </p>
      </div>
      <div className="flex items-center gap-1.5">
        <Button size="xs" variant="outline">{item.action}</Button>
        <Button size="xs" variant="ghost" render={<Link href={`/candidates/${item.candidate.id}`} />}>
          Open
        </Button>
      </div>
    </div>
  );
}

export default function MyWorkPage() {
  const items = getWorkItems();
  const count = (p: Priority) => items.filter((i) => i.priority === p).length;

  return (
    <PageContainer className="flex flex-col gap-6">
      <PageHeader
        title="My Work"
        description="Your universal action inbox — what needs doing, right now."
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile icon={Inbox} label="Open items" value={items.length} />
        <StatTile icon={Inbox} label="Critical" value={count("Critical")} tone="danger" />
        <StatTile icon={Inbox} label="High" value={count("High")} tone="warning" />
        <StatTile icon={Inbox} label="Medium / Low" value={count("Medium") + count("Low")} tone="info" />
      </div>

      <section className="bg-card overflow-hidden rounded-xl border shadow-xs">
        <div className="flex items-center justify-between border-b px-4 py-2.5">
          <h2 className="text-card-heading">Action inbox</h2>
          <span className="text-muted-foreground text-xs tabular-nums">
            {items.length} items · sorted by priority
          </span>
        </div>
        {items.length === 0 ? (
          <div className="text-muted-foreground flex flex-col items-center py-12 text-sm">
            <CheckCircle2 className="text-success mb-2 size-6" />
            You&apos;re all caught up.
          </div>
        ) : (
          <div>
            {items.map((item) => (
              <WorkRow key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>
    </PageContainer>
  );
}
