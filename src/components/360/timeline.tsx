import {
  ArrowRight,
  Bot,
  CheckCircle2,
  FileText,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type TimelineEventRow = {
  id: string;
  time: string;
  kind: "candidate" | "human" | "ai" | "integration" | "document" | "approval";
  title: string;
  detail?: string;
};

const TIMELINE_ICON: Record<TimelineEventRow["kind"], typeof User> = {
  candidate: User,
  human: User,
  ai: Bot,
  integration: ArrowRight,
  document: FileText,
  approval: CheckCircle2,
};

export function Timeline({ events }: { events: TimelineEventRow[] }) {
  return (
    <ol className="flex flex-col">
      {events.map((e, i) => {
        const Icon = TIMELINE_ICON[e.kind];
        const last = i === events.length - 1;
        return (
          <li key={e.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full border",
                  e.kind === "ai"
                    ? "bg-ai-muted text-ai-muted-foreground border-transparent"
                    : "bg-muted text-muted-foreground",
                )}
              >
                <Icon className="size-3.5" />
              </span>
              {!last && <span className="bg-border my-0.5 w-0.5 flex-1" />}
            </div>
            <div className={cn("pb-4", last && "pb-0")}>
              <p className="text-sm font-medium">{e.title}</p>
              {e.detail && (
                <p className="text-muted-foreground text-xs">{e.detail}</p>
              )}
              <p className="text-metadata mt-0.5">{e.time}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
