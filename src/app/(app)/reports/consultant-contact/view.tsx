"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarClock,
  Contact,
  Download,
  FileText,
  Mail,
  PhoneCall,
  ShieldAlert,
  UserRoundCheck,
} from "lucide-react";
import { PageContainer, PageHeader } from "@/components/page";
import { WidgetCard } from "@/components/dashboard/widgets";
import { Button } from "@/components/ui/button";
import { StatTile } from "@/components/workspace/stat-tile";
import {
  FilterBar,
  FilterSearch,
  FilterSelect,
} from "@/components/reports/report-ui";
import { CONSULTANTS } from "@/lib/consultants";

type ContactRow = {
  id: string;
  name: string;
  title: string;
  client: string;
  phone: string;
  email: string;
  manager: string;
  emergencyContact: string;
  emergencyPhone: string;
  updatedDays: number;
};

const EXTRA_NAMES: { name: string; title: string; client: string; manager: string }[] = [
  { name: "Anya Pasternak", title: "Senior Backend Engineer", client: "Cobalt Systems", manager: "Aaron Flores" },
  { name: "Tomás Reyes", title: "Cloud Architect", client: "Cobalt Systems", manager: "Aaron Flores" },
  { name: "Hiroko Takeda", title: "Product Designer", client: "Atlas Manufacturing", manager: "Lena Ortiz" },
  { name: "Bilal Yaseen", title: "QA Lead", client: "Atlas Manufacturing", manager: "Lena Ortiz" },
  { name: "Yara Salim", title: "Data Engineer", client: "Vertex Financial", manager: "Devon Hughes" },
  { name: "Caleb Whitfield", title: "Solutions Architect", client: "Vertex Financial", manager: "Devon Hughes" },
  { name: "Iris Hoffmann", title: "Frontend Engineer", client: "Meridian Health", manager: "Devon Hughes" },
  { name: "Jaden Brooks", title: "DevOps Engineer", client: "Meridian Health", manager: "Devon Hughes" },
  { name: "Maya Devereux", title: "Clinical Nurse Specialist", client: "Meridian Health", manager: "Devon Hughes" },
  { name: "Oren Lipsky", title: "Risk Analyst", client: "Vertex Financial", manager: "Devon Hughes" },
  { name: "Sasha Petrov", title: "Senior Accountant", client: "Vertex Financial", manager: "Devon Hughes" },
  { name: "Wren Calloway", title: "Field Operations Lead", client: "Northwind Logistics", manager: "Aaron Flores" },
  { name: "Zane Okafor", title: "Logistics Coordinator", client: "Northwind Logistics", manager: "Aaron Flores" },
  { name: "Imani Carter", title: "Care Coordinator", client: "Meridian Health", manager: "Devon Hughes" },
  { name: "Felix Moreau", title: "Backend Engineer", client: "Cobalt Systems", manager: "Aaron Flores" },
  { name: "Sienna Tate", title: "UX Researcher", client: "Atlas Manufacturing", manager: "Lena Ortiz" },
  { name: "Otto Vandermeer", title: "Platform Engineer", client: "Cobalt Systems", manager: "Aaron Flores" },
  { name: "Lila Bensaïd", title: "Data Analyst", client: "Vertex Financial", manager: "Devon Hughes" },
  { name: "Reza Karimi", title: "Reliability Engineer", client: "Cobalt Systems", manager: "Aaron Flores" },
  { name: "Mira Lindqvist", title: "Salesforce Admin", client: "Atlas Manufacturing", manager: "Lena Ortiz" },
  { name: "Daniyar Beksultan", title: "ML Engineer", client: "Cobalt Systems", manager: "Aaron Flores" },
  { name: "Calla Anderssen", title: "ICU Nurse", client: "Meridian Health", manager: "Devon Hughes" },
  { name: "Vihaan Rao", title: "Mobile Engineer", client: "Atlas Manufacturing", manager: "Lena Ortiz" },
  { name: "Esther Nwosu", title: "Compliance Analyst", client: "Vertex Financial", manager: "Devon Hughes" },
  { name: "Patrick Doyle", title: "Field Technician", client: "Northwind Logistics", manager: "Aaron Flores" },
  { name: "Ines Marchetti", title: "Marketing Ops Analyst", client: "Atlas Manufacturing", manager: "Lena Ortiz" },
  { name: "Hank Ostrowski", title: "Senior DBA", client: "Cobalt Systems", manager: "Aaron Flores" },
  { name: "Talia Vogel", title: "Tax Specialist", client: "Vertex Financial", manager: "Devon Hughes" },
  { name: "Quinn Bartlett", title: "Pharmacy Technician", client: "Meridian Health", manager: "Devon Hughes" },
  { name: "Ravi Subramanian", title: "Senior Data Engineer", client: "Vertex Financial", manager: "Devon Hughes" },
  { name: "Anders Lillehammer", title: "Site Reliability Engineer", client: "Cobalt Systems", manager: "Aaron Flores" },
  { name: "Devi Krishnamurthy", title: "Product Manager", client: "Atlas Manufacturing", manager: "Lena Ortiz" },
  { name: "Sigrid Bauer", title: "Finance Manager", client: "Vertex Financial", manager: "Devon Hughes" },
  { name: "Khalid Bashir", title: "Cybersecurity Analyst", client: "Cobalt Systems", manager: "Aaron Flores" },
  { name: "Rebekah Lin", title: "Care Navigator", client: "Meridian Health", manager: "Devon Hughes" },
  { name: "Ondrej Novak", title: "DevOps Engineer", client: "Atlas Manufacturing", manager: "Lena Ortiz" },
  { name: "Petra Halvorsen", title: "Project Manager", client: "Northwind Logistics", manager: "Aaron Flores" },
  { name: "Cassius Wu", title: "Solutions Engineer", client: "Cobalt Systems", manager: "Aaron Flores" },
  { name: "Lourdes Aguilar", title: "Senior Accountant", client: "Vertex Financial", manager: "Devon Hughes" },
  { name: "Matt Halverson", title: "QA Engineer", client: "Cobalt Systems", manager: "Aaron Flores" },
  { name: "Tessa Verlaine", title: "Healthcare Recruiter (Embedded)", client: "Meridian Health", manager: "Devon Hughes" },
];

const EMERGENCY_NAMES = [
  "Spouse — Alex",
  "Parent — Marie",
  "Sibling — Jordan",
  "Spouse — Priya",
  "Parent — Hassan",
  "Sibling — Olivia",
  "Spouse — Daniel",
  "Parent — Ana",
  "Sibling — Robin",
  "Spouse — Hana",
];

function phoneFor(seed: number): string {
  const area = 200 + (seed * 17) % 700;
  const a = 100 + (seed * 31) % 900;
  const b = 1000 + (seed * 53) % 9000;
  return `+1 (${area}) ${a}-${b}`;
}

function emailFor(name: string): string {
  return `${name.toLowerCase().replace(/[^a-z]+/g, ".").replace(/(^\.|\.$)/g, "")}@example.com`;
}

const CONTACTS: ContactRow[] = [
  ...CONSULTANTS.map(
    (c, i): ContactRow => ({
      id: c.id,
      name: c.name,
      title: c.role,
      client: c.client,
      phone: c.phone,
      email: c.email,
      manager: c.accountManager,
      emergencyContact: EMERGENCY_NAMES[i % EMERGENCY_NAMES.length],
      emergencyPhone: phoneFor(i + 200),
      updatedDays: (i * 7) % 90,
    }),
  ),
  ...EXTRA_NAMES.map((p, i): ContactRow => {
    const id = p.name.toLowerCase().replace(/[^a-z]+/g, "-");
    return {
      id,
      name: p.name,
      title: p.title,
      client: p.client,
      phone: phoneFor(i + 1),
      email: emailFor(p.name),
      manager: p.manager,
      emergencyContact: EMERGENCY_NAMES[(i + 3) % EMERGENCY_NAMES.length],
      emergencyPhone: phoneFor(i + 500),
      updatedDays: (i * 11) % 120,
    };
  }),
];

const CLIENT_FILTER = ["All", ...Array.from(new Set(CONTACTS.map((c) => c.client)))];

const verifiedThisQuarter = CONTACTS.filter((c) => c.updatedDays <= 90).length;
const updatedToday = CONTACTS.filter((c) => c.updatedDays === 0).length + 3;
const missingInfo = 4;

export default function ConsultantContactView() {
  const [client, setClient] = useState("All");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return CONTACTS.filter((c) => {
      if (client !== "All" && c.client !== client) return false;
      if (
        search &&
        !`${c.name} ${c.title} ${c.client} ${c.email} ${c.phone}`
          .toLowerCase()
          .includes(search.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [client, search]);

  return (
    <PageContainer className="flex flex-col gap-6">
      <div>
        <Button variant="ghost" size="sm" className="-ml-2 mb-1" nativeButton={false} render={<Link href="/reports" />}>
          <ArrowLeft className="size-4" /> Reports
        </Button>
        <PageHeader
          title="Consultant Contact"
          description="Workforce directory with title, client, phone, email, manager, and emergency contact."
          actions={
            <>
              <Button variant="outline" size="sm">
                <FileText className="size-3.5" /> Export VCF
              </Button>
              <Button variant="outline" size="sm">
                <Download className="size-3.5" /> Export CSV
              </Button>
              <Button variant="outline" size="sm">
                <CalendarClock className="size-3.5" /> Schedule
              </Button>
            </>
          }
        />
      </div>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile icon={Contact} label="Total Contacts" value={CONTACTS.length} />
        <StatTile icon={UserRoundCheck} label="Verified This Quarter" value={verifiedThisQuarter} tone="success" />
        <StatTile icon={ShieldAlert} label="Missing Info" value={missingInfo} tone="warning" />
        <StatTile icon={CalendarClock} label="Updated Today" value={updatedToday} tone="info" />
      </section>

      <FilterBar>
        <FilterSelect label="Client" value={client} options={CLIENT_FILTER} onChange={setClient} />
        <FilterSearch
          label="Search"
          value={search}
          onChange={setSearch}
          placeholder="Name, title, email, phone…"
        />
        <span className="text-muted-foreground self-end text-xs">
          {filtered.length} of {CONTACTS.length} contacts
        </span>
      </FilterBar>

      <WidgetCard title="Directory" description="Click a contact to open consultant 360">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left" style={{ fontSize: "var(--table-font)" }}>
            <thead className="text-muted-foreground border-b">
              <tr>
                <th className="px-2 py-2 font-medium">Name</th>
                <th className="px-2 py-2 font-medium">Title</th>
                <th className="px-2 py-2 font-medium">Client</th>
                <th className="px-2 py-2 font-medium">Phone</th>
                <th className="px-2 py-2 font-medium">Email</th>
                <th className="px-2 py-2 font-medium">Manager</th>
                <th className="px-2 py-2 font-medium">Emergency Contact</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-muted/50 border-b last:border-0">
                  <td className="px-2 py-2 font-medium whitespace-nowrap">
                    <Link href={`/consultants/${c.id}`} className="hover:underline">
                      {c.name}
                    </Link>
                  </td>
                  <td className="text-muted-foreground px-2 py-2 whitespace-nowrap">{c.title}</td>
                  <td className="px-2 py-2 whitespace-nowrap">{c.client}</td>
                  <td className="px-2 py-2 whitespace-nowrap">
                    <a
                      href={`tel:${c.phone.replace(/[^0-9+]/g, "")}`}
                      className="text-info-muted-foreground inline-flex items-center gap-1 hover:underline"
                    >
                      <PhoneCall className="size-3" />
                      {c.phone}
                    </a>
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap">
                    <a
                      href={`mailto:${c.email}`}
                      className="text-info-muted-foreground inline-flex items-center gap-1 hover:underline"
                    >
                      <Mail className="size-3" />
                      {c.email}
                    </a>
                  </td>
                  <td className="text-muted-foreground px-2 py-2 whitespace-nowrap">{c.manager}</td>
                  <td className="text-muted-foreground px-2 py-2 whitespace-nowrap">
                    <span>{c.emergencyContact}</span>
                    <span className="text-metadata block">{c.emergencyPhone}</span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-muted-foreground px-2 py-8 text-center text-sm">
                    No contacts match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </WidgetCard>
    </PageContainer>
  );
}
