"use client";
import { useState } from "react";
import { Document } from "@/lib/data/documents";
import { computeTrust } from "@/lib/trust";
import {
  Sparkles, X, Archive, UserPlus, CheckSquare,
  AlertTriangle, ChevronRight, ExternalLink,
  ShieldCheck, ShieldAlert, ShieldOff,
} from "lucide-react";
import Link from "next/link";

interface Props { doc: Document }

const actionConfig = [
  { key: "archive", icon: Archive, label: "Archive page", description: "Move to archive — remove from search results", color: "text-red-600", bg: "bg-red-50 hover:bg-red-100 border-red-200" },
  { key: "validate", icon: CheckSquare, label: "Mark as validated", description: "Confirm content is current and accurate", color: "text-green-700", bg: "bg-green-50 hover:bg-green-100 border-green-200" },
  { key: "assign", icon: UserPlus, label: "Assign owner", description: "Set a responsible owner for this page", color: "text-blue-700", bg: "bg-blue-50 hover:bg-blue-100 border-blue-200" },
  { key: "jira", icon: ExternalLink, label: "Create Jira task", description: "Open a task to update this page", color: "text-purple-700", bg: "bg-purple-50 hover:bg-purple-100 border-purple-200" },
];

export default function StewardPanel({ doc }: Props) {
  const [open, setOpen] = useState(true);
  const [actioned, setActioned] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"flags" | "actions">("flags");

  const trust = computeTrust(doc);
  const VerdictIcon =
    trust.verdict === "Trusted"            ? ShieldCheck :
    trust.verdict === "Verify Before Using" ? ShieldAlert :
    ShieldOff;

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed right-4 top-20 bg-confluence-blue text-white rounded-full p-2.5 shadow-lg hover:bg-confluence-blue-hover transition-colors z-40"
        title="Open AI Steward"
      >
        <Sparkles className="w-4 h-4" />
      </button>
    );
  }

  return (
    <div className="w-80 shrink-0 border-l border-confluence-border bg-white flex flex-col overflow-hidden">
      {/* Panel header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-confluence-border bg-confluence-surface-overlay">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-confluence-blue rounded flex items-center justify-center">
            <Sparkles className="w-3 h-3 text-white" />
          </div>
          <span className="text-sm font-semibold text-confluence-text">AI Knowledge Steward</span>
        </div>
        <button onClick={() => setOpen(false)} className="text-confluence-text-subtle hover:text-confluence-text transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Attribution */}
      <div className="px-4 py-2 border-b border-confluence-border bg-confluence-blue-light/40">
        <span className="text-xs text-confluence-blue">Powered by Atlassian Intelligence</span>
        <span className="text-xs text-confluence-text-subtle ml-1">· Beta</span>
      </div>

      {/* Verdict summary */}
      <div className={`px-4 py-2 border-b border-confluence-border flex items-center gap-2 ${trust.borderClass}`}>
        <VerdictIcon className={`w-3.5 h-3.5 shrink-0 ${trust.colorClass}`} />
        <span className="text-xs text-confluence-text-subtle">Page verdict:</span>
        <span className={`text-xs font-semibold ${trust.colorClass}`}>{trust.verdict}</span>
        <span className="text-xs text-confluence-text-subtle ml-auto">{trust.score}/100</span>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-confluence-border">
        {(["flags", "actions"] as const).map((tab) => {
          const issueTotal = doc.stewardFlags.length + doc.conflictsWith.length;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 text-xs font-semibold capitalize transition-colors ${
                activeTab === tab
                  ? "border-b-2 border-confluence-blue text-confluence-blue"
                  : "text-confluence-text-subtle hover:text-confluence-text"
              }`}
            >
              {tab === "flags" ? `Issues (${issueTotal})` : "Actions"}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === "flags" && (() => {
          const totalIssues = doc.stewardFlags.length + doc.conflictsWith.length;
          return (
            <div className="p-4 space-y-3">
              {totalIssues === 0 ? (
                <div className="text-center py-8">
                  <div className="w-10 h-10 bg-confluence-green-light rounded-full flex items-center justify-center mx-auto mb-3">
                    <Sparkles className="w-5 h-5 text-confluence-green" />
                  </div>
                  <p className="text-sm text-confluence-text font-medium">No issues found</p>
                  <p className="text-xs text-confluence-text-subtle mt-1">This page looks healthy</p>
                </div>
              ) : (
                <>
                  {doc.stewardFlags.map((flag, i) => (
                    <div key={i} className="flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-confluence-text leading-relaxed">{flag}</p>
                    </div>
                  ))}

                  {doc.conflictsWith.length > 0 && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                        <span className="text-xs font-semibold text-red-700">Content conflict</span>
                      </div>
                      <p className="text-xs text-red-600 mb-2">
                        This page directly contradicts the following page(s):
                      </p>
                      {doc.conflictsWith.map((cid) => (
                        <Link
                          key={cid}
                          href={`/document/${cid}`}
                          className="flex items-center gap-1 text-xs text-confluence-blue hover:underline"
                        >
                          <ChevronRight className="w-3 h-3" />
                          {cid === "doc-002" ? "Authentication Policy 2024" : cid}
                          {cid === "doc-001" ? "Authentication Policy 2021" : ""}
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })()}

        {activeTab === "actions" && (
          <div className="p-4 space-y-2">
            <p className="text-xs text-confluence-text-subtle mb-3">
              AI-recommended actions for this page. All actions require your confirmation.
            </p>
            {actionConfig.map(({ key, icon: Icon, label, description, color, bg }) => {
              const done = actioned.includes(key);
              return (
                <button
                  key={key}
                  onClick={() => !done && setActioned((prev) => [...prev, key])}
                  className={`w-full flex items-start gap-3 p-3 rounded-lg border text-left transition-all ${
                    done ? "bg-confluence-green-light border-green-300 opacity-70" : bg
                  }`}
                  disabled={done}
                >
                  <div className={`w-7 h-7 rounded flex items-center justify-center shrink-0 ${done ? "bg-confluence-green" : "bg-white border border-confluence-border"}`}>
                    {done
                      ? <span className="text-white text-xs">✓</span>
                      : <Icon className={`w-3.5 h-3.5 ${color}`} />
                    }
                  </div>
                  <div>
                    <div className={`text-xs font-semibold ${done ? "text-confluence-green" : "text-confluence-text"}`}>
                      {done ? "Done — " : ""}{label}
                    </div>
                    <div className="text-xs text-confluence-text-subtle mt-0.5">{description}</div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Panel footer */}
      <div className="px-4 py-3 border-t border-confluence-border bg-confluence-surface-overlay">
        <p className="text-xs text-confluence-text-subtle text-center">
          Content quality may vary · Powered by AI ✦
        </p>
      </div>
    </div>
  );
}
