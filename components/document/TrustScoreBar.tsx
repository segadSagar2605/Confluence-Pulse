"use client";
import { useState } from "react";
import { Document, DOCUMENTS } from "@/lib/data/documents";
import { computeTrust, getTierInfo } from "@/lib/trust";
import Link from "next/link";
import {
  ShieldCheck, ShieldAlert, ShieldOff,
  CheckCircle2, AlertTriangle, XCircle,
  ChevronDown, ChevronUp,
} from "lucide-react";

interface Props { doc: Document }

const SIGNAL_ICON = {
  green: CheckCircle2,
  amber: AlertTriangle,
  red:   XCircle,
} as const;

// Blue = confirmed (Atlassian convention), amber/red for warnings
const SIGNAL_ICON_COLOR = {
  green: "text-confluence-blue",
  amber: "text-amber-500",
  red:   "text-red-500",
} as const;

const SIGNAL_TEXT_COLOR = {
  green: "text-confluence-text",
  amber: "text-amber-700",
  red:   "text-red-700",
} as const;

export default function TrustScoreBar({ doc }: Props) {
  const [expanded, setExpanded] = useState(false);

  const conflictTitles = doc.conflictsWith
    .map((id) => DOCUMENTS.find((d) => d.id === id)?.title)
    .filter(Boolean) as string[];

  const { score, verdict, signals, colorClass, borderClass, scoreConfidence } =
    computeTrust(doc, conflictTitles);

  const tierInfo = getTierInfo(doc.contentType);

  const ShieldIcon =
    verdict === "Trusted"            ? ShieldCheck :
    verdict === "Verify Before Using" ? ShieldAlert :
    ShieldOff;

  return (
    <div className={`border rounded-lg mb-6 overflow-hidden ${borderClass}`}>

      {/* ── Verdict header + expand toggle ──────────────────────────────── */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-black/5 transition-colors"
      >
        <ShieldIcon className={`w-5 h-5 shrink-0 ${colorClass}`} />
        <span className={`text-base font-bold ${colorClass}`}>{verdict}</span>
        <span className="ml-auto flex items-center gap-1 text-xs text-confluence-text-subtle shrink-0">
          {expanded ? "Show less" : "Show details"}
          {expanded
            ? <ChevronUp   className="w-3.5 h-3.5" />
            : <ChevronDown className="w-3.5 h-3.5" />
          }
        </span>
      </button>

      {/* ── Three signal rows (always visible) ────────────────────────────── */}
      <div className="border-t border-black/10 px-4 py-3 bg-white/70 space-y-2.5">
        {signals.map((signal) => {
          const Icon = SIGNAL_ICON[signal.level];
          return (
            <div key={signal.key} className="flex items-center gap-2.5 min-w-0">
              <span className="text-xs text-confluence-text-subtle w-16 shrink-0">
                {signal.displayName}
              </span>
              <Icon className={`w-3.5 h-3.5 shrink-0 ${SIGNAL_ICON_COLOR[signal.level]}`} />
              <span className={`text-xs ${SIGNAL_TEXT_COLOR[signal.level]}`}>
                {signal.label}
                {expanded && signal.penalty > 0 && (
                  <span className="text-confluence-text-subtle ml-1.5">
                    (−{signal.penalty} points)
                  </span>
                )}
              </span>
            </div>
          );
        })}
      </div>

      {/* ── Expanded details ──────────────────────────────────────────────── */}
      {expanded && (
        <div className="border-t border-black/10 px-4 py-4 bg-white/60 space-y-3">

          {/* Score */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-semibold text-confluence-text">
                Score:{" "}
                <span className={colorClass}>{score}/100</span>
              </span>
              {/* ℹ️ tooltip */}
              <span
                className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-confluence-text-subtle/20 text-confluence-text-subtle text-xs font-bold cursor-help leading-none"
                title="Score is computed from owner status, freshness, and conflict signals. Weights: Owner 30%, Freshness 40%, Conflicts 30% = 100%"
              >
                i
              </span>
            </div>
            <p className="text-xs text-confluence-text-subtle">
              Score is calculated from the three signals above.
              100 = fully trusted, 0 = do not use.
            </p>
          </div>

          {/* Confidence indicator */}
          <div className={`flex items-center gap-2 text-xs px-2.5 py-1.5 rounded ${
            scoreConfidence === "high"
              ? "bg-confluence-blue-light text-confluence-blue"
              : "bg-amber-50 text-amber-700"
          }`}>
            {scoreConfidence === "high"
              ? <CheckCircle2  className="w-3.5 h-3.5 shrink-0" />
              : <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            }
            <span>
              {scoreConfidence === "high"
                ? "High confidence — all signals verified"
                : "Medium confidence — some signals inferred from edit history"
              }
            </span>
          </div>

          {/* Tier classification + Space Health link */}
          <div className="border-t border-black/10 pt-3 flex items-center justify-between gap-3">
            <p className="text-xs text-confluence-text-subtle">
              This is a{" "}
              <span className={`font-semibold ${
                tierInfo.tier === "Critical" ? "text-red-700" :
                tierInfo.tier === "Standard" ? "text-amber-700" :
                "text-gray-600"
              }`}>
                {tierInfo.tier}
              </span>{" "}
              page — contributes at{" "}
              <span className="font-semibold text-confluence-text">{tierInfo.weight * 100}%</span>{" "}
              tier weight to Space Health.
            </p>
            <Link
              href="/"
              className="text-xs text-confluence-blue hover:underline shrink-0 flex items-center gap-1"
            >
              View Space Health
            </Link>
          </div>

          {/* Recommended action */}
          {doc.recommendedActions.length > 0 && (
            <div className="border-t border-black/10 pt-3">
              <p className="text-xs font-semibold text-confluence-text-subtle uppercase tracking-wide mb-1">
                Recommended action
              </p>
              <p className="text-xs text-confluence-text">{doc.recommendedActions[0]}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
