"use client";
import { useState } from "react";
import { Document, DOCUMENTS } from "@/lib/data/documents";
import { PAGE_TYPE_RULES, getTrustBand } from "@/lib/config";
import { getReviewStatus, formatDate, monthsAgo } from "@/lib/utils";
import {
  ShieldCheck, ShieldAlert, ChevronDown, ChevronUp,
  CheckCircle2, XCircle, AlertTriangle, Clock, Eye, GitBranch,
} from "lucide-react";

interface Props { doc: Document }

export default function TrustScoreBar({ doc }: Props) {
  const [contextOpen, setContextOpen] = useState(false);
  const [issuesOpen, setIssuesOpen] = useState(false);

  const band      = getTrustBand(doc.trustScore);
  const review    = getReviewStatus(doc);
  const rule      = PAGE_TYPE_RULES[doc.contentType];

  const conflictingDocs = doc.conflictsWith
    .map((id) => DOCUMENTS.find((d) => d.id === id))
    .filter(Boolean);

  // ── Three trust factors ───────────────────────────────────────────────────
  const ownerOk    = doc.owner !== null;
  const conflictOk = doc.conflictsWith.length === 0;
  const reviewOk   = review.code === "up-to-date" || review.code === "not-required";

  const issueCount = [!ownerOk, !conflictOk, !reviewOk].filter(Boolean).length;

  const barColor =
    doc.trustScore >= 80 ? "bg-confluence-green" :
    doc.trustScore >= 50 ? "bg-amber-400" :
    "bg-confluence-red";

  const borderColor =
    doc.trustScore >= 80 ? "border-green-200 bg-green-50/40" :
    doc.trustScore >= 50 ? "border-amber-200 bg-amber-50/40" :
    "border-red-200 bg-red-50/40";

  return (
    <div className={`border rounded-lg mb-6 overflow-hidden ${borderColor}`}>

      {/* ── Header row: score + bar + toggle ────────────────────────────── */}
      <button
        onClick={() => issueCount > 0 && setIssuesOpen(!issuesOpen)}
        className={`w-full flex items-center gap-4 px-4 py-3 text-left ${issueCount > 0 ? "hover:bg-black/5 transition-colors" : ""}`}
      >
        {doc.trustScore >= 80
          ? <ShieldCheck className={`w-5 h-5 shrink-0 ${band.color}`} />
          : <ShieldAlert className={`w-5 h-5 shrink-0 ${band.color}`} />
        }
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-sm font-semibold text-confluence-text">
              Trust Score:&nbsp;
              <span className={band.color}>{doc.trustScore}/100</span>
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${band.bg}`}>
              {band.label}
            </span>
            {issueCount > 0 && (
              <span className="text-xs text-confluence-text-subtle">
                · {issueCount} issue{issueCount > 1 ? "s" : ""} found
              </span>
            )}
            {issueCount === 0 && (
              <span className="text-xs text-confluence-green flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> No issues
              </span>
            )}
          </div>
          <div className="w-full bg-black/10 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full ${barColor}`}
              style={{ width: `${doc.trustScore}%` }}
            />
          </div>
        </div>
        {issueCount > 0 && (
          issuesOpen
            ? <ChevronUp className="w-4 h-4 text-confluence-text-subtle shrink-0" />
            : <ChevronDown className="w-4 h-4 text-confluence-text-subtle shrink-0" />
        )}
      </button>

      {/* ── Why this page needs attention (collapsible) ──────────────────── */}
      {issueCount > 0 && issuesOpen && (
        <div className="border-t border-black/10 px-4 py-3 bg-white/70">
          <p className="text-xs font-semibold text-confluence-text-subtle uppercase tracking-wide mb-2.5">
            Why this page needs attention
          </p>
          <div className="space-y-2">

            {/* Accountable Owner */}
            {!ownerOk && (
              <div className="flex items-start gap-2.5">
                <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <span className="text-sm font-medium text-confluence-text">Accountable Owner: </span>
                  <span className="text-sm text-red-700">Not assigned</span>
                  {rule.risk !== "low" && (
                    <span className="text-xs text-confluence-text-subtle ml-1">
                      — required for {rule.risk} risk pages
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Conflict Status */}
            {!conflictOk && (
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <span className="text-sm font-medium text-confluence-text">Conflict Status: </span>
                  <span className="text-sm text-red-700">
                    {doc.conflictsWith.length} confirmed conflict{doc.conflictsWith.length > 1 ? "s" : ""}
                  </span>
                  {conflictingDocs.length > 0 && (
                    <span className="text-xs text-confluence-text-subtle ml-1">
                      with {conflictingDocs.map((d) => d!.title).join(", ")}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Review Status */}
            {!reviewOk && (
              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <span className="text-sm font-medium text-confluence-text">Review Status: </span>
                  <span className="text-sm text-amber-700">{review.explanation}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Supporting context (collapsible) ────────────────────────────── */}
      <div className="border-t border-black/10">
        <button
          onClick={() => setContextOpen(!contextOpen)}
          className="w-full flex items-center justify-between px-4 py-2 text-left hover:bg-black/5 transition-colors"
        >
          <span className="text-xs font-medium text-confluence-text-subtle">Supporting context</span>
          {contextOpen
            ? <ChevronUp className="w-3.5 h-3.5 text-confluence-text-subtle" />
            : <ChevronDown className="w-3.5 h-3.5 text-confluence-text-subtle" />
          }
        </button>

        {contextOpen && (
          <div className="px-4 pb-3 bg-white/60 grid grid-cols-2 gap-x-8 gap-y-1.5">
            <div className="flex items-center gap-2 text-xs text-confluence-text-subtle">
              <Clock className="w-3 h-3 shrink-0" />
              <span>Last updated: <span className="text-confluence-text">{formatDate(doc.lastUpdated)}</span>
                {monthsAgo(doc.lastUpdated) > 12 && (
                  <span className="text-red-500 ml-1">({monthsAgo(doc.lastUpdated)}m ago)</span>
                )}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-confluence-text-subtle">
              <CheckCircle2 className="w-3 h-3 shrink-0" />
              <span>Last reviewed:{" "}
                <span className="text-confluence-text">
                  {doc.lastValidated ? formatDate(doc.lastValidated) : "Never"}
                </span>
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-confluence-text-subtle">
              <Eye className="w-3 h-3 shrink-0" />
              <span>Views: <span className="text-confluence-text">{doc.viewCount.toLocaleString()}</span></span>
            </div>

            {/* Show Jira only if it exists — supporting context, not a trust factor */}
            {doc.linkedJira.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-confluence-text-subtle">
                <GitBranch className="w-3 h-3 shrink-0 text-confluence-blue" />
                <span>Related work:{" "}
                  <span className="text-confluence-blue">{doc.linkedJira.join(", ")}</span>
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
