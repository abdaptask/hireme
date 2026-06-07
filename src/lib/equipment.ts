/**
 * Equipment & IT Provisioning data (CLAUDE.md §17, §61, §97).
 * Deterministic mock covering 10 candidates with 2-4 items each.
 */
import type { StatusTone } from "@/lib/types";

export type EquipmentStatus =
  | "requested"
  | "approved"
  | "assigned"
  | "shipped"
  | "delivered"
  | "enrolled"
  | "ready"
  | "delayed"
  | "return-required";

export type AssetType =
  | "laptop"
  | "monitor"
  | "headset"
  | "phone"
  | "security-token"
  | "badge"
  | "software-license";

export type EquipmentItem = {
  assetType: AssetType;
  make: string;
  serialNumber?: string;
  status: EquipmentStatus;
  trackingNumber?: string;
  carrier?: string;
  estimatedDelivery?: string;
  notes?: string;
};

export type EquipmentRecord = {
  id: string;
  candidateId: string;
  candidateName: string;
  client: string;
  startDate: string;
  startInDays: number;
  shipTo: string;
  overallStatus: EquipmentStatus;
  items: EquipmentItem[];
  itAccess: {
    email: boolean;
    vpn: boolean;
    clientCredentials: boolean;
    deviceEnrolled: boolean;
  };
};

export const EQUIPMENT_STATUS_META: Record<
  EquipmentStatus,
  { label: string; tone: StatusTone }
> = {
  requested:       { label: "Requested",       tone: "neutral" },
  approved:        { label: "Approved",         tone: "info" },
  assigned:        { label: "Assigned",         tone: "info" },
  shipped:         { label: "Shipped",          tone: "info" },
  delivered:       { label: "Delivered",        tone: "warning" },
  enrolled:        { label: "Enrolled",         tone: "success" },
  ready:           { label: "Ready",            tone: "success" },
  delayed:         { label: "Delayed",          tone: "danger" },
  "return-required": { label: "Return Required", tone: "warning" },
};

export const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  laptop:           "Laptop",
  monitor:          "Monitor",
  headset:          "Headset",
  phone:            "Phone",
  "security-token": "Security Token",
  badge:            "Badge",
  "software-license": "Software License",
};

export const EQUIPMENT_RECORDS: EquipmentRecord[] = [
  {
    id: "EQ-001",
    candidateId: "james-rivera",
    candidateName: "James Rivera",
    client: "Meridian Health",
    startDate: "Jun 10, 2026",
    startInDays: 3,
    shipTo: "Remote — Austin, TX",
    overallStatus: "shipped",
    items: [
      {
        assetType: "laptop",
        make: "MacBook Pro 14\"",
        serialNumber: "C02XG2JHQ05P",
        status: "shipped",
        trackingNumber: "1Z999AA10123456784",
        carrier: "UPS",
        estimatedDelivery: "Jun 9, 2026",
      },
      {
        assetType: "headset",
        make: "Jabra Evolve2 55",
        status: "shipped",
        trackingNumber: "1Z999AA10123456784",
        carrier: "UPS",
        estimatedDelivery: "Jun 9, 2026",
      },
      {
        assetType: "security-token",
        make: "YubiKey 5C NFC",
        status: "ready",
        notes: "Pre-configured and included in laptop shipment",
      },
    ],
    itAccess: {
      email: true,
      vpn: true,
      clientCredentials: false,
      deviceEnrolled: false,
    },
  },
  {
    id: "EQ-002",
    candidateId: "aisha-bello",
    candidateName: "Aisha Bello",
    client: "Vertex Financial",
    startDate: "Jun 16, 2026",
    startInDays: 9,
    shipTo: "Onsite — New York, NY",
    overallStatus: "ready",
    items: [
      {
        assetType: "laptop",
        make: "Dell Latitude 5540",
        serialNumber: "5CG3421KQW",
        status: "ready",
        notes: "Configured and staged at NYC office",
      },
      {
        assetType: "monitor",
        make: "Dell UltraSharp 27\"",
        status: "ready",
      },
      {
        assetType: "badge",
        make: "HID Prox Card",
        serialNumber: "BDG-44821",
        status: "ready",
        notes: "Badge programmed for floors 12-14",
      },
      {
        assetType: "software-license",
        make: "Bloomberg Terminal",
        status: "assigned",
        notes: "License key to be emailed Day 1",
      },
    ],
    itAccess: {
      email: true,
      vpn: true,
      clientCredentials: true,
      deviceEnrolled: true,
    },
  },
  {
    id: "EQ-003",
    candidateId: "marcus-webb",
    candidateName: "Marcus Webb",
    client: "Northwind Logistics",
    startDate: "Jun 12, 2026",
    startInDays: 5,
    shipTo: "Remote — Denver, CO",
    overallStatus: "delayed",
    items: [
      {
        assetType: "laptop",
        make: "ThinkPad X1 Carbon Gen 11",
        serialNumber: "PF3X7RJK",
        status: "delayed",
        trackingNumber: "273891004882",
        carrier: "FedEx",
        estimatedDelivery: "Jun 14, 2026",
        notes: "Carrier delay — weather in Memphis hub",
      },
      {
        assetType: "headset",
        make: "Poly Voyager Focus 2",
        status: "delayed",
        notes: "Included in same shipment",
      },
      {
        assetType: "security-token",
        make: "RSA SecurID 700",
        status: "shipped",
        trackingNumber: "273891004883",
        carrier: "FedEx",
        estimatedDelivery: "Jun 11, 2026",
      },
    ],
    itAccess: {
      email: true,
      vpn: false,
      clientCredentials: false,
      deviceEnrolled: false,
    },
  },
  {
    id: "EQ-004",
    candidateId: "noah-klein",
    candidateName: "Noah Klein",
    client: "Vertex Financial",
    startDate: "Jun 23, 2026",
    startInDays: 16,
    shipTo: "Remote — Chicago, IL",
    overallStatus: "approved",
    items: [
      {
        assetType: "laptop",
        make: "MacBook Pro 16\"",
        status: "approved",
        notes: "Order placed; awaiting warehouse assignment",
      },
      {
        assetType: "monitor",
        make: "LG UltraFine 27\"",
        status: "requested",
      },
    ],
    itAccess: {
      email: false,
      vpn: false,
      clientCredentials: false,
      deviceEnrolled: false,
    },
  },
  {
    id: "EQ-005",
    candidateId: "sarah-chen",
    candidateName: "Sarah Chen",
    client: "Atlas Manufacturing",
    startDate: "Jun 9, 2026",
    startInDays: 2,
    shipTo: "Onsite — Chicago, IL",
    overallStatus: "ready",
    items: [
      {
        assetType: "laptop",
        make: "Surface Pro 10",
        serialNumber: "SP10-CHI-0042",
        status: "ready",
      },
      {
        assetType: "badge",
        make: "HID iClass Card",
        serialNumber: "BDG-33917",
        status: "ready",
      },
      {
        assetType: "phone",
        make: "iPhone 15",
        serialNumber: "DNQXK9XQ3X",
        status: "enrolled",
        notes: "MDM enrolled via Jamf",
      },
    ],
    itAccess: {
      email: true,
      vpn: true,
      clientCredentials: true,
      deviceEnrolled: true,
    },
  },
  {
    id: "EQ-006",
    candidateId: "ravi-menon",
    candidateName: "Ravi Menon",
    client: "Cobalt Systems",
    startDate: "Jun 17, 2026",
    startInDays: 10,
    shipTo: "Remote — San Jose, CA",
    overallStatus: "shipped",
    items: [
      {
        assetType: "laptop",
        make: "MacBook Air M3",
        serialNumber: "C02ZQ4CXMD6N",
        status: "shipped",
        trackingNumber: "9400111899223887123",
        carrier: "USPS",
        estimatedDelivery: "Jun 13, 2026",
      },
      {
        assetType: "security-token",
        make: "YubiKey 5C NFC",
        status: "shipped",
        trackingNumber: "9400111899223887123",
        carrier: "USPS",
        estimatedDelivery: "Jun 13, 2026",
      },
      {
        assetType: "software-license",
        make: "JetBrains All Products",
        status: "assigned",
        notes: "License key pending device enrollment",
      },
    ],
    itAccess: {
      email: true,
      vpn: true,
      clientCredentials: false,
      deviceEnrolled: false,
    },
  },
  {
    id: "EQ-007",
    candidateId: "mei-lin",
    candidateName: "Mei Lin",
    client: "Atlas Manufacturing",
    startDate: "Jun 11, 2026",
    startInDays: 4,
    shipTo: "Remote — Seattle, WA",
    overallStatus: "delayed",
    items: [
      {
        assetType: "laptop",
        make: "Dell XPS 15",
        serialNumber: "3GFWT43",
        status: "delayed",
        trackingNumber: "772891700299",
        carrier: "FedEx",
        estimatedDelivery: "Jun 13, 2026",
        notes: "Carrier transit delay; start date at risk",
      },
      {
        assetType: "monitor",
        make: "Dell WD19 Dock + 27\" monitor",
        status: "requested",
        notes: "Waiting on manager approval for dual-monitor request",
      },
    ],
    itAccess: {
      email: true,
      vpn: false,
      clientCredentials: false,
      deviceEnrolled: false,
    },
  },
  {
    id: "EQ-008",
    candidateId: "diego-santos",
    candidateName: "Diego Santos",
    client: "Cobalt Systems",
    startDate: "Jun 30, 2026",
    startInDays: 23,
    shipTo: "Remote — Miami, FL",
    overallStatus: "requested",
    items: [
      {
        assetType: "laptop",
        make: "MacBook Pro 14\"",
        status: "requested",
      },
      {
        assetType: "headset",
        make: "Bose 700",
        status: "requested",
      },
      {
        assetType: "security-token",
        make: "YubiKey 5C NFC",
        status: "requested",
      },
    ],
    itAccess: {
      email: false,
      vpn: false,
      clientCredentials: false,
      deviceEnrolled: false,
    },
  },
  {
    id: "EQ-009",
    candidateId: "grace-okafor",
    candidateName: "Grace Okafor",
    client: "Meridian Health",
    startDate: "Jun 8, 2026",
    startInDays: 1,
    shipTo: "Onsite — Houston, TX",
    overallStatus: "ready",
    items: [
      {
        assetType: "laptop",
        make: "HP EliteBook 840 G10",
        serialNumber: "5CG3501K9P",
        status: "ready",
      },
      {
        assetType: "badge",
        make: "HID Prox Card",
        serialNumber: "BDG-50012",
        status: "ready",
        notes: "Clinical floor access activated",
      },
      {
        assetType: "phone",
        make: "Samsung Galaxy S24",
        serialNumber: "R5CX80B4JKL",
        status: "enrolled",
      },
      {
        assetType: "software-license",
        make: "Epic EHR Access",
        status: "ready",
        notes: "Credentials issued; training required before use",
      },
    ],
    itAccess: {
      email: true,
      vpn: true,
      clientCredentials: true,
      deviceEnrolled: true,
    },
  },
  {
    id: "EQ-010",
    candidateId: "priya-sharma",
    candidateName: "Priya Sharma",
    client: "Vertex Financial",
    startDate: "Jun 14, 2026",
    startInDays: 7,
    shipTo: "Remote — Boston, MA",
    overallStatus: "shipped",
    items: [
      {
        assetType: "laptop",
        make: "MacBook Pro 16\"",
        serialNumber: "C02ZQ4CFMD6T",
        status: "shipped",
        trackingNumber: "1Z999AA10123499001",
        carrier: "UPS",
        estimatedDelivery: "Jun 12, 2026",
      },
      {
        assetType: "security-token",
        make: "RSA SecurID 700",
        status: "shipped",
        trackingNumber: "1Z999AA10123499001",
        carrier: "UPS",
        estimatedDelivery: "Jun 12, 2026",
      },
    ],
    itAccess: {
      email: true,
      vpn: true,
      clientCredentials: false,
      deviceEnrolled: false,
    },
  },
];

export function equipmentStats(): {
  ready: number;
  delayed: number;
  inFlight: number;
  itIncomplete: number;
} {
  return {
    ready: EQUIPMENT_RECORDS.filter(
      (r) => r.overallStatus === "ready" || r.overallStatus === "enrolled",
    ).length,
    delayed: EQUIPMENT_RECORDS.filter((r) => r.overallStatus === "delayed").length,
    inFlight: EQUIPMENT_RECORDS.filter((r) => r.overallStatus === "shipped").length,
    itIncomplete: EQUIPMENT_RECORDS.filter(
      (r) =>
        !r.itAccess.email ||
        !r.itAccess.vpn ||
        !r.itAccess.clientCredentials ||
        !r.itAccess.deviceEnrolled,
    ).length,
  };
}
