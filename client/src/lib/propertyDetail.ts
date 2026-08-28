import type { Property } from "./api";
import { inr } from "./money";

const CITIES: [string, string][] = [
  ["Bengaluru", "BLR"],
  ["Mumbai", "BOM"],
  ["Gurugram", "GGN"],
  ["Hyderabad", "HYD"],
  ["Ahmedabad", "AMD"],
  ["Kolkata", "CCU"],
  ["Chennai", "MAA"],
  ["Pune", "PNQ"],
  ["Lucknow", "LKO"],
  ["Delhi", "DEL"],
  ["Noida", "NDA"],
  ["District 1", "CBD"],
  ["West End", "WEQ"],
  ["Industrial Park", "IND"],
];

const EXPOSURE = ["South-East", "North", "West", "East", "South"] as const;

export function propertyCode(id: number) {
  return `P-${String(id).padStart(4, "0")}`;
}

export function passportId(item: Property) {
  const hit = CITIES.find(([name]) => item.location.includes(name));
  return `#${hit?.[1] ?? "IND"}-${String(item.id).padStart(5, "0")}`;
}

export function floorLevel(id: number) {
  return `${(id % 38) + 4}/42`;
}

export function exposure(id: number) {
  return EXPOSURE[id % EXPOSURE.length];
}

export function taxDue(price: number) {
  return Math.round(price * 0.004);
}

export function renewalDays(id: number) {
  return (id % 40) + 18;
}

export function deedId(id: number) {
  return `SD-${String(id).padStart(6, "0")}`;
}

export function annualNet(item: Property) {
  return Math.round((item.price * item.yield_pct) / 100);
}

export function mapEmbed(location: string) {
  const boxes: [string, string][] = [
    ["Bengaluru", "77.49,12.90,77.70,13.08"],
    ["Mumbai", "72.77,18.89,72.98,19.12"],
    ["Delhi", "77.12,28.53,77.35,28.72"],
    ["Gurugram", "76.98,28.38,77.12,28.52"],
    ["Hyderabad", "78.38,17.33,78.55,17.48"],
    ["Chennai", "80.17,12.95,80.32,13.12"],
    ["Pune", "73.78,18.45,73.95,18.62"],
  ];
  const hit = boxes.find(([name]) => location.includes(name));
  const bbox = hit?.[1] ?? "77.49,12.90,77.70,13.08";
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik`;
}

export function areaLabel(n: number) {
  return `${new Intl.NumberFormat("en-IN").format(n)} SQFT`;
}

export type AuditStatus = "pass" | "pending" | "fail";

export type AuditRow = {
  label: string;
  value: string;
  tone?: "danger";
};

export type AuditItem = {
  id: "title" | "tax" | "rera" | "lawyer";
  status: AuditStatus;
  rows: AuditRow[];
};

export function auditChecklist(item: Property): AuditItem[] {
  const arrears = taxDue(item.price);
  const khata = `${String(item.id).padStart(4, "0")}/${(item.id % 90) + 10}`;
  return [
    {
      id: "title",
      status: "pass",
      rows: [
        { label: "Registered owner", value: `${item.title} Holdings Pvt Ltd` },
        { label: "Khata / PID", value: khata },
        { label: "Deed chain", value: "3 instruments · 2009–2023" },
      ],
    },
    {
      id: "tax",
      status: "fail",
      rows: [
        { label: "Encumbrance", value: "Open charge — HDFC hypothecation" },
        { label: "Pending liens", value: "1 (term loan, 2022)", tone: "danger" },
        { label: "Tax arrears", value: inr(arrears), tone: "danger" },
      ],
    },
    {
      id: "rera",
      status: item.verified ? "pass" : "pending",
      rows: item.verified
        ? [
            { label: "RERA ID", value: `PRM/${item.id % 99}/2024/${item.id}` },
            { label: "Occupancy certificate", value: "Issued 18 Apr 2026" },
            { label: "Plan sanction", value: "BBMP / BDA current" },
          ]
        : [
            { label: "RERA ID", value: "Application filed · not allotted" },
            { label: "Occupancy certificate", value: "Awaiting civic sign-off" },
            { label: "Plan sanction", value: "Deviation note on file" },
          ],
    },
    {
      id: "lawyer",
      status: item.verified ? "pass" : "pending",
      rows: item.verified
        ? [
            { label: "Counsel", value: "Rao & Menon LLP" },
            { label: "Opinion date", value: "Aug 2024" },
            { label: "Caveat", value: "None" },
          ]
        : lawyerPending(item)
          ? [
              { label: "Counsel", value: "Rao & Menon LLP · on file" },
              { label: "Opinion date", value: "Physical review in progress" },
              { label: "Caveat", value: "Held until counsel signs" },
            ]
          : [
              { label: "Counsel", value: "Assigned · Rao & Menon LLP" },
              { label: "Opinion date", value: "Not issued" },
              { label: "Caveat", value: "Held pending EC and RERA" },
            ],
    },
  ];
}

export function lawyerPending(item: Property) {
  return Boolean(item.verify_pending) && !item.verified;
}

export function timeline(item: Property) {
  const listed = "12 Jan 2026";
  const title = "03 Mar 2026";
  const rera = "18 Apr 2026";
  const awaiting = lawyerPending(item);
  const events = [
    { at: listed, label: "Listed on Aeris ledger", done: true },
    { at: title, label: "Title & ownership scrub", done: true },
    { at: rera, label: "Approvals & RERA file", done: item.verified },
    {
      at: item.verified ? "Aug 2024" : awaiting ? "In review" : "Pending",
      label: item.verified ? "Lawyer certified" : awaiting ? "Lawyer review in progress" : "Lawyer review queued",
      done: item.verified,
    },
    { at: item.status, label: `Occupancy · ${item.status}`, done: item.status !== "Vacant" },
  ];
  return events;
}
