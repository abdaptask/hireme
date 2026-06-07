import { redirect } from "next/navigation";

export default function RootPage() {
  // Super Admin Command Center is the default landing workspace for v0.1.
  redirect("/command-center");
}
