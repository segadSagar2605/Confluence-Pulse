import type { Document } from "@/lib/data/documents";

// ─── Types ────────────────────────────────────────────────────────────────────

export type SignalLevel  = "green" | "amber" | "red";
export type VerdictLabel = "Trusted" | "Verify Before Using" | "Do Not Rely On";
export type Confidence   = "high" | "medium";
export type TierLabel    = "Critical" | "Standard" | "Reference";
export type SpaceVerdict = "Healthy" | "Needs Attention" | "At Risk";

export interface Signal {
  key:         "owner" | "freshness" | "conflicts";
  displayName: string;
  level:       SignalLevel;
  label:       string;
  reason:      string;
  penalty:     number;
}

export interface TrustResult {
  score:           number;
  verdict:         VerdictLabel;
  signals:         Signal[];
  colorClass:      string;
  bgClass:         string;
  borderClass:     string;
  scoreConfidence: Confidence;
}

export interface TierInfo {
  tier:   TierLabel;
  weight: 0.6 | 0.3 | 0.1;
  reason: string;
}

export interface PageSummary {
  id:               string;
  title:            string;
  contentType:      string;
  tier:             TierLabel;
  tierWeight:       number;
  tierReason:       string;
  trustScore:       number;
  verdict:          VerdictLabel;
  signals:          Signal[];
  topRiskReason:    string;
  recommendedAction: string;
}

export interface TierBreakdownItem {
  pages:        PageSummary[];
  avgScore:     number;   // rounded integer for display
  contribution: number;   // integer points contributed to space score
}

export interface SpaceScoreResult {
  spaceScore:         number;
  spaceVerdict:       SpaceVerdict;
  hasCriticalRisk:    boolean;
  criticalRiskPages:  PageSummary[];
  tierBreakdown: {
    critical:  TierBreakdownItem;
    standard:  TierBreakdownItem;
    reference: TierBreakdownItem;
  };
  pageSummaries: PageSummary[];
}

// ─── Internal helper ──────────────────────────────────────────────────────────

function monthsSince(dateStr: string): number {
  const d   = new Date(dateStr);
  const now = new Date();
  return (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
}

// ─── computeTrust ─────────────────────────────────────────────────────────────
//
// Single source of truth for every individual page trust score and verdict.
// Never set score and verdict independently — always call this function.
//
// Weights: Owner 30% · Freshness 40% · Conflicts 30% = 100%

export function computeTrust(doc: Document, conflictTitles?: string[]): TrustResult {
  const signals: Signal[] = [];
  let penalty = 0;

  // ── Signal 1: Owner (max penalty -30) ────────────────────────────────────
  if (doc.owner !== null && doc.ownerConfirmed) {
    signals.push({
      key: "owner", displayName: "Owner",
      level: "green", label: doc.owner, penalty: 0,
      reason: `Owner confirmed: ${doc.owner} is actively accountable for this page.`,
    });
  } else if (doc.owner !== null && !doc.ownerConfirmed) {
    penalty += 15;
    signals.push({
      key: "owner", displayName: "Owner",
      level: "amber", label: "Unconfirmed — inferred from edit history", penalty: 15,
      reason: `${doc.owner} is listed but has not confirmed ownership. Score may improve once confirmed.`,
    });
  } else {
    penalty += 30;
    signals.push({
      key: "owner", displayName: "Owner",
      level: "red", label: "No owner assigned", penalty: 30,
      reason: "No owner has been assigned. No one is accountable for keeping this page accurate or up to date.",
    });
  }

  // ── Signal 2: Freshness (max penalty -40) ────────────────────────────────
  const months = monthsSince(doc.lastUpdated);
  if (months < 3) {
    signals.push({
      key: "freshness", displayName: "Freshness",
      level: "green", label: "Reviewed within cadence", penalty: 0,
      reason: `Last updated ${months} month${months !== 1 ? "s" : ""} ago — within the expected review window.`,
    });
  } else if (months < 6) {
    penalty += 10;
    signals.push({
      key: "freshness", displayName: "Freshness",
      level: "amber", label: "Getting old — review recommended", penalty: 10,
      reason: `Last updated ${months} months ago — approaching the review deadline.`,
    });
  } else if (months < 12) {
    penalty += 20;
    signals.push({
      key: "freshness", displayName: "Freshness",
      level: "amber", label: `Not reviewed in ${months} months`, penalty: 20,
      reason: `Last updated ${months} months ago — overdue for a content review.`,
    });
  } else {
    penalty += 40;
    signals.push({
      key: "freshness", displayName: "Freshness",
      level: "red", label: `Not reviewed in ${months} months`, penalty: 40,
      reason: `Last updated ${months} months ago — significantly overdue. Content may be outdated or incorrect.`,
    });
  }

  // ── Signal 3: Conflicts (max penalty -30) ────────────────────────────────
  if (doc.conflictsWith.length === 0) {
    signals.push({
      key: "conflicts", displayName: "Conflicts",
      level: "green", label: "No conflicts found", penalty: 0,
      reason: "No conflicting pages detected in this space.",
    });
  } else {
    penalty += 30;
    const names = conflictTitles && conflictTitles.length > 0
      ? conflictTitles[0] + (conflictTitles.length > 1 ? ` and ${conflictTitles.length - 1} more` : "")
      : `${doc.conflictsWith.length} other page${doc.conflictsWith.length > 1 ? "s" : ""}`;
    signals.push({
      key: "conflicts", displayName: "Conflicts",
      level: "red", label: `Conflicts detected with ${names}`, penalty: 30,
      reason: `This page directly contradicts ${conflictTitles?.join(", ") ?? doc.conflictsWith.join(", ")}. Readers may receive conflicting guidance.`,
    });
  }

  const score = Math.max(0, Math.min(100, 100 - penalty));

  const hasRed   = signals.some((s) => s.level === "red");
  const hasAmber = signals.some((s) => s.level === "amber");
  const verdict: VerdictLabel =
    hasRed   ? "Do Not Rely On"      :
    hasAmber ? "Verify Before Using" :
    "Trusted";

  const colorClass  = hasRed ? "text-red-700"    : hasAmber ? "text-amber-700"           : "text-confluence-blue";
  const bgClass     = hasRed ? "bg-confluence-red-light text-red-700"
                             : hasAmber ? "bg-confluence-yellow-light text-amber-700"
                             : "bg-confluence-blue-light text-confluence-blue";
  const borderClass = hasRed ? "border-red-200 bg-red-50/40"
                             : hasAmber ? "border-amber-200 bg-amber-50/40"
                             : "border-blue-200 bg-blue-50/40";

  const ownerAmber = signals.find((s) => s.key === "owner")?.level === "amber";
  const scoreConfidence: Confidence = ownerAmber ? "medium" : "high";

  return { score, verdict, signals, colorClass, bgClass, borderClass, scoreConfidence };
}

// ─── getTierInfo ──────────────────────────────────────────────────────────────
//
// Maps content type to one of three risk tiers.
// Tier determines how much a page's trust score influences the space score.
//
// Critical 60% · Standard 30% · Reference 10% = 100%

export function getTierInfo(contentType: string): TierInfo {
  const map: Record<string, TierInfo> = {
    "policy":            { tier: "Critical",  weight: 0.6, reason: "Org-wide impact if wrong" },
    "runbook":           { tier: "Critical",  weight: 0.6, reason: "Followed in production incidents" },
    "adr":               { tier: "Critical",  weight: 0.6, reason: "Shapes system architecture decisions" },
    "incident":          { tier: "Standard",  weight: 0.3, reason: "Scoped to one team or product area" },
    "prd":               { tier: "Standard",  weight: 0.3, reason: "Guides one feature or product area" },
    "knowledge-article": { tier: "Reference", weight: 0.1, reason: "Informational — rarely acted on directly" },
    "meeting-notes":     { tier: "Reference", weight: 0.1, reason: "Context and records only" },
    "general":           { tier: "Reference", weight: 0.1, reason: "Unclassified — low blast radius" },
  };
  return map[contentType] ?? { tier: "Reference", weight: 0.1, reason: "Unclassified content" };
}

// ─── computeSpaceScore ────────────────────────────────────────────────────────
//
// Aggregates all page trust scores into a single space-level health score.
//
// Formula:
//   spaceScore = (criticalAvg × 60%) + (standardAvg × 30%) + (referenceAvg × 10%)
//
// Each contribution is rounded to the nearest integer so that
// contribution1 + contribution2 + contribution3 = spaceScore exactly.

export function computeSpaceScore(documents: Document[]): SpaceScoreResult {
  // Build one PageSummary per document by calling computeTrust internally.
  // Never reads a hardcoded trustScore from the data model.
  const pageSummaries: PageSummary[] = documents.map((doc) => {
    const conflictTitles = doc.conflictsWith
      .map((id) => documents.find((d) => d.id === id)?.title)
      .filter(Boolean) as string[];

    const trust    = computeTrust(doc, conflictTitles);
    const tierInfo = getTierInfo(doc.contentType);

    // Pick the most actionable risk reason from signals
    const redSignals   = trust.signals.filter((s) => s.level === "red");
    const amberSignals = trust.signals.filter((s) => s.level === "amber");
    let topRiskReason  = "All signals healthy";
    if (redSignals.length > 0) {
      const ownerRed     = redSignals.find((s) => s.key === "owner");
      const conflictRed  = redSignals.find((s) => s.key === "conflicts");
      const freshnessRed = redSignals.find((s) => s.key === "freshness");
      topRiskReason = (ownerRed ?? conflictRed ?? freshnessRed)!.label;
    } else if (amberSignals.length > 0) {
      topRiskReason = amberSignals[0].label;
    }

    return {
      id: doc.id,
      title: doc.title,
      contentType: doc.contentType,
      tier: tierInfo.tier,
      tierWeight: tierInfo.weight,
      tierReason: tierInfo.reason,
      trustScore: trust.score,
      verdict:    trust.verdict,
      signals:    trust.signals,
      topRiskReason,
      recommendedAction: doc.recommendedActions[0] ?? "",
    };
  });

  // ── Group by tier ──────────────────────────────────────────────────────────
  const critical  = pageSummaries.filter((p) => p.tier === "Critical");
  const standard  = pageSummaries.filter((p) => p.tier === "Standard");
  const reference = pageSummaries.filter((p) => p.tier === "Reference");

  // ── Per-tier averages (0 if no pages in tier) ─────────────────────────────
  const avg = (pages: PageSummary[]) =>
    pages.length === 0 ? 0
    : pages.reduce((s, p) => s + p.trustScore, 0) / pages.length;

  const criticalAvgRaw  = avg(critical);
  const standardAvgRaw  = avg(standard);
  const referenceAvgRaw = avg(reference);

  // ── Contributions — round each to integer so they sum to spaceScore exactly
  const criticalContrib  = Math.round(criticalAvgRaw  * 0.6);
  const standardContrib  = Math.round(standardAvgRaw  * 0.3);
  const referenceContrib = Math.round(referenceAvgRaw * 0.1);

  const spaceScore = Math.max(0, Math.min(100, criticalContrib + standardContrib + referenceContrib));

  const spaceVerdict: SpaceVerdict =
    spaceScore >= 80 ? "Healthy"          :
    spaceScore >= 50 ? "Needs Attention"  :
    "At Risk";

  const criticalRiskPages = critical.filter((p) => p.verdict === "Do Not Rely On");

  return {
    spaceScore,
    spaceVerdict,
    hasCriticalRisk:   criticalRiskPages.length > 0,
    criticalRiskPages,
    tierBreakdown: {
      critical:  { pages: critical,  avgScore: Math.round(criticalAvgRaw),  contribution: criticalContrib  },
      standard:  { pages: standard,  avgScore: Math.round(standardAvgRaw),  contribution: standardContrib  },
      reference: { pages: reference, avgScore: Math.round(referenceAvgRaw), contribution: referenceContrib },
    },
    pageSummaries,
  };
}
