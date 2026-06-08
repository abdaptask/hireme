import { ChevronRight } from "lucide-react";
import { PipelineStatusBadge } from "@/components/status-badge";
import type { PipelineStatus } from "@/lib/types";

export type TaskRow = {
  id: string;
  title: string;
  owner: string;
  due: string;
  status: PipelineStatus;
};

export function TaskList({ tasks }: { tasks: TaskRow[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {tasks.map((t) => (
        <li
          key={t.id}
          className="flex items-center gap-3 rounded-lg border px-3 py-2"
        >
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">{t.title}</span>
            <span className="text-metadata">
              {t.owner} · {t.due}
            </span>
          </span>
          <PipelineStatusBadge status={t.status} />
          <ChevronRight className="text-muted-foreground size-4" />
        </li>
      ))}
    </ul>
  );
}
