import { relativeTime } from "@/lib/db-candidates";
import { EmptyRecord } from "./empty-record";

export type AuditEventRow = {
  id: string;
  action: string;
  actor: string;
  newValue: string | null;
  entityLabel: string | null;
  timestamp: Date | null;
};

export function DbAudit({ events }: { events: AuditEventRow[] }) {
  if (!events.length)
    return <EmptyRecord message="No audit events recorded for this person yet." />;
  return (
    <div className="bg-card overflow-hidden rounded-xl border shadow-xs">
      <table className="w-full text-left text-sm">
        <thead className="text-muted-foreground border-b">
          <tr>
            <th className="px-4 py-2 font-medium">Action</th>
            <th className="px-4 py-2 font-medium">Actor</th>
            <th className="px-4 py-2 font-medium">Detail</th>
            <th className="px-4 py-2 font-medium">Time</th>
          </tr>
        </thead>
        <tbody>
          {events.map((e) => (
            <tr key={e.id} className="border-b last:border-0">
              <td className="px-4 py-2.5 font-medium capitalize">
                {e.action.toLowerCase().replace("_", " ")}
              </td>
              <td className="text-muted-foreground px-4 py-2.5">{e.actor}</td>
              <td className="text-muted-foreground px-4 py-2.5 max-w-xs truncate">
                {e.newValue ?? e.entityLabel ?? "—"}
              </td>
              <td className="text-muted-foreground px-4 py-2.5 whitespace-nowrap">
                {relativeTime(e.timestamp)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
