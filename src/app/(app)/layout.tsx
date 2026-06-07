import { AppShell } from "@/components/shell/app-shell";
import { AiProvider } from "@/components/ai/ai-provider";

export default function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AiProvider>
      <AppShell>{children}</AppShell>
    </AiProvider>
  );
}
