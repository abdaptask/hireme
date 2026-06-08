import type { Metadata } from "next";

export const metadata: Metadata = { title: "Lifecycle Management" };

export default function LifecycleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
