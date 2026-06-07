import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { PreferencesProvider } from "@/components/providers/preferences-provider";
import { EntitlementsProvider } from "@/components/providers/entitlements-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { preferencesBootstrapScript } from "@/lib/preferences";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "HireMe — Workforce Onboarding & Lifecycle Platform",
    template: "%s · HireMe",
  },
  description:
    "Intelligent, automation-first enterprise onboarding and workforce lifecycle management.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
    >
      <head>
        {/* Apply theme + density before first paint to avoid a flash. */}
        <script
          dangerouslySetInnerHTML={{ __html: preferencesBootstrapScript() }}
        />
      </head>
      <body className="min-h-full">
        <PreferencesProvider>
          <EntitlementsProvider>
            <TooltipProvider delay={200}>{children}</TooltipProvider>
          </EntitlementsProvider>
        </PreferencesProvider>
      </body>
    </html>
  );
}
