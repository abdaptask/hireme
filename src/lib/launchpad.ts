/**
 * Persona Launchpad configuration.
 *
 * A category-grouped icon grid inspired by JobDiva that surfaces the most
 * frequent destinations and actions for each persona at the top of their
 * workspace. Each tile is declarative — the renderer resolves icon names to
 * lucide-react components and badge counts from a host-provided lookup.
 *
 * Hrefs target existing live nav destinations from `src/lib/nav.ts`. Items
 * that are not yet built route to `/planned/<id>` placeholders (per the
 * nav contract: §4 / §97).
 */

export type LaunchpadCategoryId =
  | "primary"
  | "records"
  | "operations"
  | "people"
  | "analytics"
  | "system"
  | "candidates"
  | "compliance"
  | "day1"
  | "communications"
  | "reports"
  | "engagement"
  | "handoff"
  | "tools"
  | "performance"
  | "forecast"
  | "admin"
  | "team"
  | "sprint"
  | "quality"
  | "clients"
  | "pipeline"
  | "commitments"
  | "myWork"
  | "documents"
  | "help"
  | "myInfo";

export type LaunchpadTone =
  | "green"
  | "blue"
  | "purple"
  | "orange"
  | "red"
  | "yellow"
  | "teal"
  | "rose"
  | "indigo";

export type LaunchpadTile = {
  label: string;
  href: string;
  /** lucide-react icon NAME — resolved to a component by the renderer. */
  icon: string;
  /** Optional badge count key — resolved by the host page via `badgeCounts`. */
  badgeKey?: string;
};

export type LaunchpadCategory = {
  id: LaunchpadCategoryId;
  label: string;
  tone: LaunchpadTone;
  tiles: LaunchpadTile[];
};

export type LaunchpadConfig = {
  personaId: string;
  title: string;
  subtitle: string;
  categories: LaunchpadCategory[];
};

export const LAUNCHPADS: Record<string, LaunchpadConfig> = {
  "super-admin": {
    personaId: "super-admin",
    title: "Command Launchpad",
    subtitle: "Operate the platform end-to-end.",
    categories: [
      {
        id: "primary",
        label: "Primary",
        tone: "green",
        tiles: [
          { label: "Pipeline View", href: "/onboarding", icon: "GitBranch" },
          { label: "At Risk", href: "/onboarding?risk=at-risk", icon: "AlertTriangle" },
          { label: "Starting Soon", href: "/onboarding?filter=starting-soon", icon: "PlayCircle" },
          { label: "Drop-offs", href: "/reports/add-drop-reports", icon: "TrendingDown" },
          { label: "Exceptions", href: "/exceptions", icon: "AlertOctagon" },
          { label: "SLA Breaches", href: "/exceptions?filter=sla", icon: "Clock" },
        ],
      },
      {
        id: "records",
        label: "Records",
        tone: "blue",
        tiles: [
          { label: "Candidates", href: "/candidates", icon: "Users" },
          { label: "Consultants", href: "/consultants", icon: "Briefcase" },
          { label: "Clients", href: "/clients", icon: "Building2" },
          { label: "Packages", href: "/packages", icon: "Package" },
          { label: "Documents", href: "/documents", icon: "FileText" },
          { label: "Audit", href: "/audit", icon: "ShieldCheck" },
        ],
      },
      {
        id: "operations",
        label: "Operations",
        tone: "purple",
        tiles: [
          { label: "Workflows", href: "/workflow-studio", icon: "Workflow" },
          { label: "Compliance", href: "/compliance", icon: "Scale" },
          { label: "Approvals", href: "/approvals", icon: "CheckCircle" },
          { label: "Comms", href: "/communications", icon: "MessageSquare" },
          { label: "Integrations", href: "/integrations", icon: "Plug" },
          { label: "AI Governance", href: "/planned/ai-governance", icon: "Bot" },
        ],
      },
      {
        id: "people",
        label: "People",
        tone: "orange",
        tiles: [
          { label: "Recruiters", href: "/recruiter", icon: "UserSearch" },
          { label: "Onboarders", href: "/onboarder", icon: "UserCheck" },
          { label: "Team Leads", href: "/team-lead", icon: "Crown" },
          { label: "Account Mgrs", href: "/account-manager", icon: "Handshake" },
          { label: "Pod Mgmt", href: "/recruiting-manager", icon: "UsersRound" },
          { label: "Permissions", href: "/administration", icon: "Lock" },
        ],
      },
      {
        id: "analytics",
        label: "Analytics",
        tone: "red",
        tiles: [
          { label: "Reports Hub", href: "/reports", icon: "BarChart3" },
          { label: "Custom Builder", href: "/reports/builder", icon: "Wrench" },
          { label: "Executive", href: "/reports/profit-loss-summary", icon: "LineChart" },
          { label: "AI Insights", href: "/planned/ai-insights", icon: "Sparkles" },
          { label: "Drill-downs", href: "/reports", icon: "Layers" },
        ],
      },
      {
        id: "system",
        label: "System",
        tone: "yellow",
        tiles: [
          { label: "System Health", href: "/integrations", icon: "Activity" },
          { label: "Audit Center", href: "/audit", icon: "ShieldCheck" },
          { label: "User Mgmt", href: "/administration", icon: "UserCog" },
          { label: "Roles", href: "/administration", icon: "KeyRound" },
          { label: "Settings", href: "/planned/settings", icon: "Settings" },
        ],
      },
    ],
  },

  onboarder: {
    personaId: "onboarder",
    title: "Action Launchpad",
    subtitle: "Move every onboarding forward today.",
    categories: [
      {
        id: "myWork",
        label: "My Work",
        tone: "green",
        tiles: [
          { label: "My Queue", href: "/my-work", icon: "Inbox", badgeKey: "myQueue" },
          { label: "Action Required", href: "/my-work?filter=action", icon: "AlertCircle", badgeKey: "actionRequired" },
          { label: "Document Review", href: "/documents", icon: "FileSearch", badgeKey: "docReview" },
          { label: "Pending Approval", href: "/approvals", icon: "ClipboardCheck", badgeKey: "pendingApproval" },
          { label: "At Risk", href: "/onboarder?filter=at-risk", icon: "AlertTriangle", badgeKey: "atRisk" },
          { label: "In Review", href: "/my-work?filter=review", icon: "Eye" },
        ],
      },
      {
        id: "candidates",
        label: "Candidates",
        tone: "blue",
        tiles: [
          { label: "My Candidates", href: "/candidates", icon: "Users" },
          { label: "Search", href: "/candidates", icon: "Search" },
          { label: "Add Candidate", href: "/planned/candidates-new", icon: "UserPlus" },
          { label: "Recently Viewed", href: "/candidates", icon: "History" },
        ],
      },
      {
        id: "compliance",
        label: "Compliance",
        tone: "purple",
        tiles: [
          { label: "I-9 Status", href: "/compliance", icon: "IdCard" },
          { label: "Background Checks", href: "/screening", icon: "ShieldCheck" },
          { label: "Drug Screens", href: "/screening", icon: "FlaskConical" },
          { label: "Compliance Gaps", href: "/compliance", icon: "AlertTriangle" },
          { label: "Waivers", href: "/approvals?filter=waiver", icon: "FileMinus" },
        ],
      },
      {
        id: "day1",
        label: "Day 1",
        tone: "orange",
        tiles: [
          { label: "Equipment", href: "/equipment", icon: "Laptop" },
          { label: "Training", href: "/training", icon: "GraduationCap" },
          { label: "Payroll", href: "/payroll", icon: "Wallet" },
          { label: "Billing", href: "/billing", icon: "Receipt" },
          { label: "Day 1 Check", href: "/onboarder", icon: "CalendarCheck" },
        ],
      },
      {
        id: "communications",
        label: "Communications",
        tone: "red",
        tiles: [
          { label: "Send Reminder", href: "/communications", icon: "Bell" },
          { label: "Send Nudge", href: "/communications", icon: "Megaphone" },
          { label: "Activity", href: "/communications", icon: "Activity" },
          { label: "Templates", href: "/planned/templates", icon: "FileType" },
          { label: "Message Candidate", href: "/communications", icon: "Send" },
        ],
      },
      {
        id: "reports",
        label: "Reports",
        tone: "yellow",
        tiles: [
          { label: "My Productivity", href: "/reports/recruiter-performance", icon: "TrendingUp" },
          { label: "SLA Performance", href: "/reports", icon: "Clock" },
          { label: "Exception Resolution", href: "/exceptions", icon: "AlertOctagon" },
          { label: "Doc Aging", href: "/documents", icon: "FileText" },
        ],
      },
    ],
  },

  recruiter: {
    personaId: "recruiter",
    title: "Pipeline Launchpad",
    subtitle: "From offer accepted to fully onboarded.",
    categories: [
      {
        id: "pipeline",
        label: "Pipeline",
        tone: "green",
        tiles: [
          { label: "My Roster", href: "/recruiter", icon: "Users", badgeKey: "myRoster" },
          { label: "Action Needed", href: "/recruiter?filter=action", icon: "AlertCircle", badgeKey: "actionNeeded" },
          { label: "Starting Soon", href: "/recruiter?filter=starting-soon", icon: "PlayCircle", badgeKey: "startingSoon" },
          { label: "Ready to Start", href: "/recruiter?filter=ready", icon: "CheckCircle", badgeKey: "readyToStart" },
          { label: "Stalled", href: "/recruiter?filter=stalled", icon: "Pause" },
        ],
      },
      {
        id: "candidates",
        label: "Candidates",
        tone: "blue",
        tiles: [
          { label: "Add Candidate", href: "/planned/candidates-new", icon: "UserPlus" },
          { label: "Search", href: "/candidates", icon: "Search" },
          { label: "Submissions", href: "/planned/submissions", icon: "Send" },
          { label: "Hotlists", href: "/planned/hotlists", icon: "Flame" },
          { label: "Recently Viewed", href: "/candidates", icon: "History" },
        ],
      },
      {
        id: "engagement",
        label: "Engagement",
        tone: "purple",
        tiles: [
          { label: "Send Reminder", href: "/communications", icon: "Bell" },
          { label: "Schedule Call", href: "/planned/calendar", icon: "Phone" },
          { label: "Message", href: "/communications", icon: "MessageSquare" },
          { label: "Activity", href: "/communications", icon: "Activity" },
          { label: "AI Drafts", href: "/planned/ai-drafts", icon: "Sparkles" },
        ],
      },
      {
        id: "handoff",
        label: "Handoff",
        tone: "orange",
        tiles: [
          { label: "Handoff Queue", href: "/my-work?filter=handoff", icon: "ArrowRightLeft" },
          { label: "Pre-Handoff Check", href: "/planned/handoff-check", icon: "ListChecks" },
          { label: "Onboarder Status", href: "/onboarder", icon: "UserCheck" },
          { label: "Data Quality", href: "/reports", icon: "Database" },
        ],
      },
      {
        id: "analytics",
        label: "Analytics",
        tone: "red",
        tiles: [
          { label: "My Performance", href: "/reports/recruiter-performance", icon: "TrendingUp" },
          { label: "Time-to-Onboard", href: "/reports/recruiter-performance", icon: "Clock" },
          { label: "Drop-off", href: "/reports/add-drop-reports", icon: "TrendingDown" },
          { label: "Satisfaction", href: "/reports/recruiter-performance", icon: "Heart" },
        ],
      },
      {
        id: "tools",
        label: "Tools",
        tone: "yellow",
        tiles: [
          { label: "Resume Parser", href: "/planned/resume-parser", icon: "FileText" },
          { label: "AI Match", href: "/planned/ai-match", icon: "Zap" },
          { label: "LinkedIn Lookup", href: "/planned/linkedin", icon: "AtSign" },
          { label: "Email Templates", href: "/planned/templates", icon: "Mail" },
        ],
      },
    ],
  },

  "recruiting-manager": {
    personaId: "recruiting-manager",
    title: "Team Launchpad",
    subtitle: "Drive team throughput and quality.",
    categories: [
      {
        id: "pipeline",
        label: "Pipeline",
        tone: "green",
        tiles: [
          { label: "All Pipeline", href: "/onboarding", icon: "GitBranch" },
          { label: "Bottlenecks", href: "/reports", icon: "AlertTriangle" },
          { label: "Forecast", href: "/recruiting-manager?tab=forecast", icon: "TrendingUp" },
          { label: "Capacity", href: "/recruiting-manager", icon: "Gauge" },
          { label: "Workload", href: "/recruiting-manager", icon: "BarChart3" },
        ],
      },
      {
        id: "people",
        label: "People",
        tone: "blue",
        tiles: [
          { label: "Scorecards", href: "/recruiting-manager?tab=scorecards", icon: "ClipboardList" },
          { label: "Coaching", href: "/planned/coaching", icon: "MessageCircle" },
          { label: "1:1s", href: "/planned/one-on-ones", icon: "Coffee" },
          { label: "Notes", href: "/planned/notes", icon: "NotebookPen" },
          { label: "Assignments", href: "/recruiting-manager", icon: "ListTodo" },
        ],
      },
      {
        id: "performance",
        label: "Performance",
        tone: "purple",
        tiles: [
          { label: "Top Performers", href: "/reports/recruiter-performance", icon: "Trophy" },
          { label: "Coaching Flags", href: "/team-lead", icon: "Flag" },
          { label: "Quality Score", href: "/reports", icon: "Award" },
          { label: "Trends", href: "/reports", icon: "TrendingUp" },
        ],
      },
      {
        id: "reports",
        label: "Reports",
        tone: "orange",
        tiles: [
          { label: "Team Throughput", href: "/reports/recruiter-performance", icon: "Activity" },
          { label: "Drop-off", href: "/reports/add-drop-reports", icon: "TrendingDown" },
          { label: "Time-to-Onboard", href: "/reports/recruiter-performance", icon: "Clock" },
          { label: "Satisfaction", href: "/reports", icon: "Heart" },
        ],
      },
      {
        id: "forecast",
        label: "Forecast",
        tone: "red",
        tiles: [
          { label: "Volume Forecast", href: "/recruiting-manager?tab=forecast", icon: "BarChart3" },
          { label: "Capacity Planning", href: "/recruiting-manager", icon: "Gauge" },
          { label: "Hiring Needs", href: "/planned/hiring-plan", icon: "UserPlus" },
          { label: "Trends", href: "/reports", icon: "TrendingUp" },
        ],
      },
      {
        id: "admin",
        label: "Admin",
        tone: "yellow",
        tiles: [
          { label: "Assign Cases", href: "/recruiting-manager", icon: "UserPlus" },
          { label: "Rebalance", href: "/recruiting-manager", icon: "Scale" },
          { label: "Approve PTO", href: "/planned/pto", icon: "Calendar" },
          { label: "Team Settings", href: "/administration", icon: "Settings" },
        ],
      },
    ],
  },

  "team-lead": {
    personaId: "team-lead",
    title: "Pod Launchpad",
    subtitle: "Lead your pod through today.",
    categories: [
      {
        id: "myWork",
        label: "My Work",
        tone: "green",
        tiles: [
          { label: "Pod Pipeline", href: "/team-lead", icon: "GitBranch", badgeKey: "podPipeline" },
          { label: "Today's Priorities", href: "/team-lead", icon: "ListTodo", badgeKey: "todaysPriorities" },
          { label: "At Risk", href: "/team-lead?filter=at-risk", icon: "AlertTriangle", badgeKey: "atRisk" },
          { label: "Critical Issues", href: "/exceptions?severity=critical", icon: "AlertOctagon", badgeKey: "criticalIssues" },
        ],
      },
      {
        id: "team",
        label: "Team",
        tone: "blue",
        tiles: [
          { label: "My Recruiters", href: "/team-lead", icon: "Users" },
          { label: "Workload", href: "/team-lead", icon: "BarChart3" },
          { label: "Coaching Flags", href: "/team-lead", icon: "Flag" },
          { label: "1:1s", href: "/planned/one-on-ones", icon: "Coffee" },
        ],
      },
      {
        id: "sprint",
        label: "Sprint",
        tone: "purple",
        tiles: [
          { label: "This Week's Starts", href: "/team-lead", icon: "CalendarDays" },
          { label: "Day 1 Risk", href: "/onboarding", icon: "AlertTriangle" },
          { label: "Stand-up Notes", href: "/planned/standup", icon: "ClipboardList" },
        ],
      },
      {
        id: "quality",
        label: "Quality",
        tone: "orange",
        tiles: [
          { label: "First-Pass Approval", href: "/reports", icon: "CheckCircle" },
          { label: "Drop-off", href: "/reports/add-drop-reports", icon: "TrendingDown" },
          { label: "Satisfaction", href: "/reports", icon: "Heart" },
          { label: "SLA", href: "/exceptions?filter=sla", icon: "Clock" },
        ],
      },
      {
        id: "reports",
        label: "Reports",
        tone: "red",
        tiles: [
          { label: "Pod Performance", href: "/reports/recruiter-performance", icon: "TrendingUp" },
          { label: "Member Comparison", href: "/reports/recruiter-performance", icon: "Users" },
          { label: "Trends", href: "/reports", icon: "TrendingUp" },
        ],
      },
      {
        id: "communications",
        label: "Communications",
        tone: "yellow",
        tiles: [
          { label: "Pod Messages", href: "/communications", icon: "MessageSquare" },
          { label: "Recognition", href: "/planned/recognition", icon: "Award" },
          { label: "Coaching Notes", href: "/planned/coaching", icon: "NotebookPen" },
        ],
      },
    ],
  },

  "account-manager": {
    personaId: "account-manager",
    title: "Client Launchpad",
    subtitle: "Keep every client promise.",
    categories: [
      {
        id: "clients",
        label: "Clients",
        tone: "green",
        tiles: [
          { label: "My Clients", href: "/account-manager", icon: "Building2", badgeKey: "myClients" },
          { label: "Add Client", href: "/planned/clients-new", icon: "Building" },
          { label: "Search", href: "/clients", icon: "Search" },
          { label: "Client Health", href: "/account-manager", icon: "Activity" },
          { label: "Recently Contacted", href: "/account-manager", icon: "Phone" },
        ],
      },
      {
        id: "pipeline",
        label: "Pipeline",
        tone: "blue",
        tiles: [
          { label: "Client Pipeline", href: "/account-manager?tab=portfolio", icon: "GitBranch" },
          { label: "Starting Soon", href: "/account-manager?tab=forecast", icon: "PlayCircle" },
          { label: "At Risk Per Client", href: "/account-manager?tab=escalations", icon: "AlertTriangle" },
        ],
      },
      {
        id: "commitments",
        label: "Commitments",
        tone: "purple",
        tiles: [
          { label: "Promise Tracker", href: "/account-manager?tab=promises", icon: "Target", badgeKey: "promises" },
          { label: "Active Escalations", href: "/account-manager?tab=escalations", icon: "AlertOctagon", badgeKey: "escalations" },
          { label: "Approvals Needed", href: "/approvals?filter=client", icon: "ClipboardCheck", badgeKey: "clientApprovals" },
        ],
      },
      {
        id: "forecast",
        label: "Forecast",
        tone: "orange",
        tiles: [
          { label: "Start Forecast", href: "/account-manager?tab=forecast", icon: "CalendarDays" },
          { label: "Revenue at Risk", href: "/account-manager?tab=forecast", icon: "DollarSign" },
          { label: "Quarter Outlook", href: "/reports/profit-loss-summary", icon: "TrendingUp" },
          { label: "New Business", href: "/planned/new-business", icon: "Sparkles" },
        ],
      },
      {
        id: "communications",
        label: "Communications",
        tone: "red",
        tiles: [
          { label: "Client Messages", href: "/communications", icon: "MessageSquare" },
          { label: "Status Updates", href: "/communications", icon: "Bell" },
          { label: "Send Report", href: "/reports", icon: "Send" },
          { label: "Schedule Review", href: "/planned/calendar", icon: "CalendarClock" },
        ],
      },
      {
        id: "reports",
        label: "Reports",
        tone: "yellow",
        tiles: [
          { label: "Client Velocity", href: "/reports", icon: "Gauge" },
          { label: "Compliance Pass Rate", href: "/compliance", icon: "ShieldCheck" },
          { label: "Satisfaction", href: "/reports", icon: "Heart" },
          { label: "Profitability", href: "/reports/consultant-pnl", icon: "DollarSign" },
        ],
      },
    ],
  },

  candidate: {
    personaId: "candidate",
    title: "My Onboarding",
    subtitle: "Everything for your start day.",
    categories: [
      {
        id: "myWork",
        label: "My Work",
        tone: "green",
        tiles: [
          { label: "Progress", href: "/portal", icon: "CircleDashed" },
          { label: "Next Action", href: "/portal", icon: "ArrowRight" },
          { label: "All Tasks", href: "/portal", icon: "ListTodo" },
          { label: "Documents Status", href: "/portal", icon: "FileCheck" },
        ],
      },
      {
        id: "documents",
        label: "Documents",
        tone: "blue",
        tiles: [
          { label: "Upload ID", href: "/portal/tasks/id-upload", icon: "Upload" },
          { label: "Tax Forms", href: "/portal/tasks/w4", icon: "FileText" },
          { label: "NDA", href: "/portal/tasks/nda", icon: "FileSignature" },
          { label: "View Submitted", href: "/portal", icon: "FileCheck" },
        ],
      },
      {
        id: "help",
        label: "Help",
        tone: "purple",
        tiles: [
          { label: "AI Concierge", href: "/portal", icon: "Bot" },
          { label: "Contact Recruiter", href: "/portal", icon: "Phone" },
          { label: "FAQ", href: "/portal", icon: "HelpCircle" },
          { label: "Live Support", href: "/portal", icon: "MessageCircle" },
        ],
      },
      {
        id: "day1",
        label: "Day 1",
        tone: "orange",
        tiles: [
          { label: "What to Expect", href: "/portal", icon: "Eye" },
          { label: "Schedule", href: "/portal", icon: "Calendar" },
          { label: "Contacts", href: "/portal", icon: "Users" },
          { label: "Onboarding Day", href: "/portal", icon: "CalendarCheck" },
        ],
      },
      {
        id: "myInfo",
        label: "My Info",
        tone: "red",
        tiles: [
          { label: "Profile", href: "/portal", icon: "User" },
          { label: "Contact", href: "/portal", icon: "Phone" },
          { label: "Emergency Contact", href: "/portal", icon: "AlertCircle" },
          { label: "Privacy", href: "/portal", icon: "Lock" },
        ],
      },
    ],
  },
};

/** Resolve a launchpad config by persona id; returns undefined if not configured. */
export function getLaunchpad(personaId: string): LaunchpadConfig | undefined {
  return LAUNCHPADS[personaId];
}
