import { Sparkles } from "lucide-react";

export function Placeholder({ module, version }: { module: string; version: string }) {
  return (
    <div className="text-muted-foreground flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center text-sm">
      <Sparkles className="mb-2 size-5" />
      <p className="text-foreground font-medium">{module}</p>
      <p className="mt-1">Full detail arrives with this module ({version}).</p>
    </div>
  );
}
