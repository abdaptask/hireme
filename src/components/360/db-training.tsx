import { StatusBadge } from "@/components/status-badge";
import { EmptyRecord } from "./empty-record";

export type TrainingRow = {
  id: string;
  title: string;
  category: string;
  status: string;
  dueDate: Date | null;
  completedAt: Date | null;
};

const TRAINING_STATUS_META: Record<
  string,
  { tone: "success" | "warning" | "danger" | "info" | "neutral"; label: string }
> = {
  COMPLETED: { tone: "success", label: "Completed" },
  STARTED: { tone: "info", label: "In progress" },
  ASSIGNED: { tone: "neutral", label: "Assigned" },
  OVERDUE: { tone: "danger", label: "Overdue" },
  FAILED: { tone: "danger", label: "Failed" },
  WAIVED: { tone: "neutral", label: "Waived" },
  EXPIRING: { tone: "warning", label: "Expiring" },
};

export function DbTraining({ training }: { training: TrainingRow[] }) {
  if (!training.length)
    return <EmptyRecord message="No training or certification records for this person." />;
  return (
    <div className="bg-card overflow-hidden rounded-xl border shadow-xs">
      <table className="w-full text-left text-sm">
        <thead className="text-muted-foreground border-b">
          <tr>
            <th className="px-4 py-2 font-medium">Course</th>
            <th className="px-4 py-2 font-medium">Category</th>
            <th className="px-4 py-2 font-medium">Status</th>
            <th className="px-4 py-2 font-medium">Due / Completed</th>
          </tr>
        </thead>
        <tbody>
          {training.map((t) => {
            const meta =
              TRAINING_STATUS_META[t.status] ?? { tone: "neutral" as const, label: t.status };
            const dateLabel = t.completedAt
              ? t.completedAt.toLocaleDateString()
              : t.dueDate
                ? t.dueDate.toLocaleDateString()
                : "—";
            return (
              <tr key={t.id} className="border-b last:border-0">
                <td className="px-4 py-2.5 font-medium">{t.title}</td>
                <td className="text-muted-foreground px-4 py-2.5 capitalize">{t.category}</td>
                <td className="px-4 py-2.5">
                  <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
                </td>
                <td className="text-muted-foreground px-4 py-2.5">{dateLabel}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
