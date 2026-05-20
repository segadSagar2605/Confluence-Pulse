import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { PAGE_TYPE_RULES, getTrustBand } from "@/lib/config";
import type { Document } from "@/lib/data/documents";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Legacy trust display helpers (used by config-band filters) ───────────────

export function trustBgColor(score: number): string {
  return getTrustBand(score).bg;
}

export function trustLabel(score: number): string {
  return getTrustBand(score).label;
}

export function trustColorClass(score: number): string {
  return getTrustBand(score).color;
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────

export function lifecycleLabel(state: string): string {
  const map: Record<string, string> = {
    current: "Current",
    "needs-review": "Needs Review",
    stale: "Stale",
    archived: "Archived",
  };
  return map[state] ?? state;
}

export function lifecycleBadgeColor(state: string): string {
  const map: Record<string, string> = {
    current: "bg-confluence-green-light text-green-800",
    "needs-review": "bg-confluence-yellow-light text-amber-800",
    stale: "bg-confluence-red-light text-red-800",
    archived: "bg-gray-100 text-gray-600",
  };
  return map[state] ?? "bg-gray-100 text-gray-600";
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function monthsAgo(dateStr: string): number {
  const date = new Date(dateStr);
  const now  = new Date();
  return (
    (now.getFullYear() - date.getFullYear()) * 12 +
    (now.getMonth() - date.getMonth())
  );
}

// ─── Review Status ────────────────────────────────────────────────────────────

export type ReviewStatusCode =
  | "not-required"
  | "never-reviewed"
  | "overdue"
  | "up-to-date";

export interface ReviewStatus {
  code: ReviewStatusCode;
  label: string;
  explanation: string;
  badgeColor: string;
  monthsOverdue?: number;
}

export function getReviewStatus(doc: Document): ReviewStatus {
  const rule = PAGE_TYPE_RULES[doc.contentType];

  if (!rule.reviewRequired || rule.cadenceMonths === null) {
    return {
      code: "not-required",
      label: "Not required",
      explanation: "Review status: not required for this page type.",
      badgeColor: "bg-gray-100 text-gray-500",
    };
  }

  if (!doc.lastValidated) {
    return {
      code: "never-reviewed",
      label: "Never reviewed",
      explanation: `Required — never reviewed. ${rule.label} pages must be reviewed every ${rule.cadenceMonths} months.`,
      badgeColor: "bg-confluence-red-light text-red-800",
    };
  }

  const elapsed = monthsAgo(doc.lastValidated);
  const overdue = elapsed - rule.cadenceMonths;

  if (overdue <= 0) {
    const dueIn = Math.abs(overdue);
    return {
      code: "up-to-date",
      label: "Up to date",
      explanation: `Reviewed ${formatDate(doc.lastValidated)} — next review due in ${dueIn} month${dueIn !== 1 ? "s" : ""}.`,
      badgeColor: "bg-confluence-green-light text-green-800",
    };
  }

  return {
    code: "overdue",
    label: `Overdue ${overdue}m`,
    explanation: `Required — overdue by ${overdue} month${overdue !== 1 ? "s" : ""}. Last reviewed ${formatDate(doc.lastValidated)}.`,
    badgeColor: "bg-confluence-yellow-light text-amber-800",
    monthsOverdue: overdue,
  };
}
