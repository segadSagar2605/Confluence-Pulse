import type { ContentType } from "@/lib/data/documents";

export type RiskLevel = "high" | "medium" | "low";

export interface PageTypeRule {
  label: string;
  risk: RiskLevel;
  reviewRequired: boolean;
  cadenceMonths: number | null; // null = no review required
  description: string;
}

// Section A — Page Type Rules
export const PAGE_TYPE_RULES: Record<ContentType, PageTypeRule> = {
  policy: {
    label: "Policy",
    risk: "high",
    reviewRequired: true,
    cadenceMonths: 3,
    description: "Authoritative standards and mandates that govern how work is done",
  },
  runbook: {
    label: "Runbook",
    risk: "high",
    reviewRequired: true,
    cadenceMonths: 3,
    description: "Operational procedures followed by engineers under time pressure",
  },
  adr: {
    label: "Architecture Decision Record",
    risk: "medium",
    reviewRequired: true,
    cadenceMonths: 6,
    description: "Architectural choices with long-term consequences",
  },
  prd: {
    label: "Product Requirement",
    risk: "medium",
    reviewRequired: true,
    cadenceMonths: 6,
    description: "Product specifications that guide engineering and design",
  },
  incident: {
    label: "Incident Review",
    risk: "medium",
    reviewRequired: true,
    cadenceMonths: 6,
    description: "Post-incident analysis with action items; reviewed to verify closure",
  },
  "knowledge-article": {
    label: "Knowledge Article",
    risk: "low",
    reviewRequired: false,
    cadenceMonths: null,
    description: "Reference and how-to content; low operational risk",
  },
};

// Section B — Review Cadence
export const REVIEW_CADENCE: Record<RiskLevel, { label: string; months: number | null }> = {
  high:   { label: "Every 3 months",  months: 3 },
  medium: { label: "Every 6 months",  months: 6 },
  low:    { label: "Not required",    months: null },
};

// Section D — Trust Score Thresholds (4 bands used everywhere)
export const TRUST_THRESHOLDS = {
  trusted:    { min: 80, max: 100, label: "Trusted",      color: "text-confluence-green",  bg: "bg-confluence-green-light text-green-800" },
  needsReview:{ min: 50, max: 79,  label: "Needs Review", color: "text-amber-700",         bg: "bg-confluence-yellow-light text-amber-800" },
  stale:      { min: 20, max: 49,  label: "Stale",        color: "text-red-700",           bg: "bg-confluence-red-light text-red-800" },
  critical:   { min: 0,  max: 19,  label: "Critical",     color: "text-white",             bg: "bg-red-900 text-white" },
};

export function getTrustBand(score: number) {
  if (score >= 80) return TRUST_THRESHOLDS.trusted;
  if (score >= 50) return TRUST_THRESHOLDS.needsReview;
  if (score >= 20) return TRUST_THRESHOLDS.stale;
  return TRUST_THRESHOLDS.critical;
}

// Section E — AI Steward Permissions
export const STEWARD_ALLOWED = [
  "Suggest accountable owner based on page content and team structure",
  "Suggest review request to the accountable owner",
  "Suggest archival for stale, ownerless, or superseded pages",
  "Create a draft Jira-style task for documentation updates",
];

export const STEWARD_NOT_ALLOWED = [
  "Auto-delete any page without human approval",
  "Auto-archive any page without human approval",
  "Auto-change page ownership without human approval",
  "Publish or modify page content autonomously",
];
