"use client";
import { getAllDecisions, DOCUMENTS } from "@/lib/data/documents";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { useState, useMemo, useRef, useEffect } from "react";
import {
  User, Calendar, GitBranch, RefreshCw,
  ChevronDown, ChevronRight, CheckCircle2, Clock, AlertCircle,
  Search, X, SlidersHorizontal,
} from "lucide-react";

// ── Config ────────────────────────────────────────────────────────────────────

const statusConfig = {
  active:         { label: "Active",       color: "bg-confluence-green-light text-green-800",  icon: CheckCircle2, iconColor: "text-confluence-green" },
  "under-review": { label: "Under Review", color: "bg-confluence-yellow-light text-amber-800", icon: Clock,        iconColor: "text-amber-500" },
  superseded:     { label: "Superseded",   color: "bg-gray-100 text-gray-500",                 icon: AlertCircle,  iconColor: "text-gray-400" },
};
type StatusKey = keyof typeof statusConfig;

const LINEAGE = [
  { label: "SEC-INC-2023-047", type: "Incident" },
  { label: "ADR-007",          type: "Architecture Decision" },
  { label: "Auth Policy 2024", type: "Policy Mandate" },
  { label: "PLAT-2301",        type: "Jira Epic" },
  { label: "API Gateway PRD",  type: "Implementation" },
];

const SOURCE_OPTIONS = [
  { value: "all",           label: "All" },
  { value: "adr",           label: "ADR" },
  { value: "rfc",           label: "RFC" },
  { value: "incident",      label: "Incident Review" },
  { value: "prd",           label: "PRD" },
  { value: "meeting-notes", label: "Meeting Notes" },
];

const REVIEW_OPTIONS = [
  { value: "all",              label: "All" },
  { value: "overdue",          label: "Overdue" },
  { value: "due-this-quarter", label: "Due this quarter" },
  { value: "up-to-date",       label: "Up to date" },
];

const OWNER_OPTIONS = [
  { value: "all",        label: "All" },
  { value: "assigned",   label: "Assigned" },
  { value: "unassigned", label: "Unassigned" },
];

function classifyReviewDate(reviewDate: string): "overdue" | "due-this-quarter" | "up-to-date" {
  const NOW = new Date("2026-05-17");
  const NOW_QUARTER = Math.floor(NOW.getMonth() / 3);
  const iso = new Date(reviewDate);
  if (!isNaN(iso.getTime())) {
    if (iso < NOW) return "overdue";
    if (iso.getFullYear() === NOW.getFullYear() && Math.floor(iso.getMonth() / 3) === NOW_QUARTER)
      return "due-this-quarter";
    return "up-to-date";
  }
  const m = reviewDate.match(/Q([1-4])\s*(\d{4})/i);
  if (m) {
    const q = parseInt(m[1]) - 1;
    const y = parseInt(m[2]);
    if (y < NOW.getFullYear() || (y === NOW.getFullYear() && q < NOW_QUARTER)) return "overdue";
    if (y === NOW.getFullYear() && q === NOW_QUARTER) return "due-this-quarter";
    return "up-to-date";
  }
  return "up-to-date";
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function DecisionGraph() {
  const [selected, setSelected]     = useState<string | null>(null);
  const [searchQ, setSearchQ]       = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters]       = useState({ source: "all", reviewStatus: "all", owner: "all" });
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  const decisions = useMemo(() =>
    getAllDecisions().map((dec) => ({
      ...dec,
      sourceContentType: DOCUMENTS.find((d) => d.id === dec.sourceDocId)?.contentType ?? "unknown",
      reviewCode: classifyReviewDate(dec.reviewDate),
    })), []);

  const filtered = useMemo(() => {
    let items = decisions;
    if (searchQ.trim()) {
      const q = searchQ.toLowerCase();
      items = items.filter((d) => d.title.toLowerCase().includes(q) || d.summary.toLowerCase().includes(q));
    }
    if (filters.source !== "all")
      items = items.filter((d) => d.sourceContentType === filters.source);
    if (filters.reviewStatus !== "all")
      items = items.filter((d) => d.reviewCode === filters.reviewStatus);
    if (filters.owner !== "all") {
      if (filters.owner === "unassigned") items = items.filter((d) => !d.owner);
      else items = items.filter((d) => !!d.owner);
    }
    return items;
  }, [decisions, searchQ, filters]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const d of decisions) c[d.status] = (c[d.status] ?? 0) + 1;
    return c;
  }, [decisions]);

  const activePills = useMemo(() => {
    const pills: { key: string; label: string }[] = [];
    if (filters.source !== "all")       pills.push({ key: "source",       label: `Source: ${SOURCE_OPTIONS.find((o) => o.value === filters.source)?.label}` });
    if (filters.reviewStatus !== "all") pills.push({ key: "reviewStatus", label: `Review: ${REVIEW_OPTIONS.find((o) => o.value === filters.reviewStatus)?.label}` });
    if (filters.owner !== "all")        pills.push({ key: "owner",        label: `Owner: ${OWNER_OPTIONS.find((o) => o.value === filters.owner)?.label}` });
    return pills;
  }, [filters]);

  function clearFilter(key: string) {
    setFilters((prev) => ({ ...prev, [key]: "all" }));
  }
  function clearAll() {
    setFilters({ source: "all", reviewStatus: "all", owner: "all" });
    setSearchQ("");
    setFilterOpen(false);
  }

  const activeFilterCount = activePills.length;

  return (
    <div className="px-8 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-confluence-text-subtle mb-6">
        <Link href="/" className="hover:text-confluence-blue">Platform Engineering</Link>
        <span>/</span>
        <span className="text-confluence-text font-medium">Decision Intelligence</span>
      </div>

      <h1 className="text-2xl font-semibold text-confluence-text mb-1">Decision Intelligence</h1>
      <p className="text-sm text-confluence-text-subtle mb-6">
        {decisions.length} decisions extracted from {DOCUMENTS.length} pages · AI-identified and structured
      </p>

      {/* ── Search + Filter row ─────────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-3">

        {/* Search — wide, takes remaining space */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-confluence-text-subtle" />
          <input
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            placeholder="Search decisions by title, summary, owner…"
            className="w-full pl-9 pr-8 py-2 text-sm border border-confluence-border rounded-md bg-white outline-none focus:border-confluence-blue focus:ring-1 focus:ring-confluence-blue/20"
          />
          {searchQ && (
            <button onClick={() => setSearchQ("")} className="absolute right-2.5 top-1/2 -translate-y-1/2">
              <X className="w-3.5 h-3.5 text-confluence-text-subtle" />
            </button>
          )}
        </div>

        {/* Filter button + dropdown */}
        <div className="relative shrink-0" ref={filterRef}>
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className={`flex items-center gap-2 text-sm px-4 py-2 rounded-md border transition-colors ${
              activeFilterCount > 0 || filterOpen
                ? "border-confluence-blue bg-confluence-blue-light text-confluence-blue"
                : "border-confluence-border text-confluence-text-subtle hover:bg-confluence-surface-overlay"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filter
            {activeFilterCount > 0 && (
              <span className="bg-confluence-blue text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-semibold leading-none">
                {activeFilterCount}
              </span>
            )}
          </button>

          {filterOpen && (
            <div className="absolute right-0 top-full mt-2 z-50 bg-white border border-confluence-border rounded-xl shadow-xl w-80 overflow-hidden">
              <div className="px-5 py-4 border-b border-confluence-border bg-confluence-surface-overlay">
                <p className="text-xs font-semibold text-confluence-text-subtle uppercase tracking-widest">Filter decisions</p>
              </div>
              <div className="px-5 py-4 space-y-5">
                {[
                  { key: "source",       label: "Source",        options: SOURCE_OPTIONS },
                  { key: "reviewStatus", label: "Review Status", options: REVIEW_OPTIONS },
                  { key: "owner",        label: "Owner",         options: OWNER_OPTIONS },
                ].map((group, gi) => (
                  <div key={group.key}>
                    {gi > 0 && <div className="border-t border-confluence-border -mx-5 mb-5" />}
                    <p className="text-xs font-semibold text-confluence-text-subtle uppercase tracking-widest mb-3">{group.label}</p>
                    <div className="grid grid-cols-2 gap-y-2 gap-x-3">
                      {group.options.map((opt) => (
                        <label key={opt.value} className="flex items-center gap-2 cursor-pointer group">
                          <input
                            type="radio"
                            name={group.key}
                            value={opt.value}
                            checked={filters[group.key as keyof typeof filters] === opt.value}
                            onChange={() => setFilters((prev) => ({ ...prev, [group.key]: opt.value }))}
                            className="accent-confluence-blue"
                          />
                          <span className="text-sm text-confluence-text group-hover:text-confluence-blue transition-colors">{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              {activeFilterCount > 0 && (
                <div className="px-5 py-3 border-t border-confluence-border bg-confluence-surface-overlay flex items-center justify-between">
                  <span className="text-xs text-confluence-text-subtle">{activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""} active</span>
                  <button onClick={clearAll} className="text-xs text-confluence-blue font-medium hover:underline">
                    Clear all
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Summary count bar */}
        <div className="shrink-0 flex items-center gap-2 text-xs text-confluence-text-subtle">
          {(["active", "under-review", "superseded"] as StatusKey[])
            .filter((k) => (counts[k] ?? 0) > 0)
            .map((k, i) => (
              <span key={k} className="flex items-center gap-1.5">
                {i > 0 && <span className="text-confluence-border">·</span>}
                <span className="font-semibold text-confluence-text">{counts[k]}</span>
                <span>{statusConfig[k].label}</span>
              </span>
            ))}
        </div>
      </div>

      {/* Active filter pills */}
      {activePills.length > 0 && (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {activePills.map((pill) => (
            <span
              key={pill.key}
              className="flex items-center gap-1 text-xs bg-confluence-blue-light text-confluence-blue border border-confluence-blue/30 px-2.5 py-1 rounded-full"
            >
              {pill.label}
              <button onClick={() => clearFilter(pill.key)}>
                <X className="w-3 h-3 ml-0.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* ── Decision list ──────────────────────────────────────────────── */}
      <div className="border border-confluence-border rounded-lg overflow-hidden">
        {filtered.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-confluence-text-subtle">
            No decisions match the current filters.
            <button onClick={clearAll} className="ml-2 text-confluence-blue hover:underline">Clear all</button>
          </div>
        ) : (
          filtered.map((dec) => {
            const cfg = statusConfig[dec.status as StatusKey];
            const StatusIcon = cfg.icon;
            const isOpen = selected === dec.id;
            const srcDoc = DOCUMENTS.find((d) => d.id === dec.sourceDocId);

            return (
              <div key={dec.id} className="border-b border-confluence-border last:border-b-0">

                {/* ── Row ── */}
                <button
                  onClick={() => setSelected(isOpen ? null : dec.id)}
                  className={`w-full flex items-center gap-4 px-4 py-4 text-left transition-colors ${
                    isOpen ? "bg-confluence-blue-light/40" : "hover:bg-confluence-surface-overlay"
                  }`}
                >
                  {/* Status badge — fixed width */}
                  <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${cfg.color}`}>
                    <StatusIcon className={`w-3 h-3 ${cfg.iconColor}`} />
                    {cfg.label}
                  </span>

                  {/* Decision title + meta key-value pairs */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-confluence-text truncate">{dec.title}</p>
                    <div className="flex items-center flex-wrap gap-x-3 gap-y-0.5 mt-1">
                      <span className="text-xs text-confluence-text-subtle">
                        <span className="font-medium text-gray-400">Source</span>
                        <span className="mx-1 text-gray-300">·</span>
                        <span className="truncate max-w-[220px] inline-block align-bottom">{dec.sourceDocTitle.split(":")[0]}</span>
                      </span>
                      {dec.owner && (
                        <span className="text-xs text-confluence-text-subtle">
                          <span className="font-medium text-gray-400">Owner</span>
                          <span className="mx-1 text-gray-300">·</span>
                          {dec.owner}
                        </span>
                      )}
                      <span className="text-xs text-confluence-text-subtle">
                        <span className="font-medium text-gray-400">Review by</span>
                        <span className="mx-1 text-gray-300">·</span>
                        {formatDate(dec.reviewDate)}
                      </span>
                    </div>
                  </div>

                  <ChevronDown className={`w-4 h-4 text-confluence-text-subtle shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>

                {/* ── Expanded panel ── */}
                {isOpen && (
                  <div className="border-t border-confluence-border bg-gray-50/60 px-6 py-5">

                    {/* Lineage — impactful horizontal timeline */}
                    <div className="mb-6">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Decision Lineage</p>
                      <div className="relative flex items-stretch gap-0">
                        {LINEAGE.map((node, i) => (
                          <div key={i} className="flex items-center">
                            {/* Node — fixed width, equal sizing */}
                            <div className="w-36 border-2 border-gray-300 bg-white rounded-lg px-3 py-3 flex flex-col gap-1 shadow-sm">
                              <p className="text-xs font-bold text-gray-800 truncate" title={node.label}>
                                {node.label}
                              </p>
                              <p className="text-[10px] font-medium text-gray-400 truncate" title={node.type}>
                                {node.type}
                              </p>
                            </div>
                            {/* Arrow connector */}
                            {i < LINEAGE.length - 1 && (
                              <div className="flex items-center mx-1.5 shrink-0">
                                <div className="w-5 h-px bg-gray-300" />
                                <svg width="8" height="10" viewBox="0 0 8 10" className="text-gray-400 -ml-px shrink-0">
                                  <path d="M0 0 L8 5 L0 10 Z" fill="currentColor" />
                                </svg>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-gray-400 mt-3 italic">
                        Oct 2023 incident triggered ADR-007 → drove the 2024 Auth Policy → became PLAT-2301 → delivered the API Gateway PRD
                      </p>
                    </div>

                    {/* Detail: 2 columns */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <p className="text-sm text-confluence-text-subtle leading-relaxed">{dec.summary}</p>
                        <div className="bg-white border border-confluence-border rounded-lg p-3">
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Rationale</p>
                          <p className="text-sm text-confluence-text">{dec.rationale}</p>
                        </div>
                        {dec.alternativesConsidered.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Alternatives Rejected</p>
                            <div className="flex flex-wrap gap-2">
                              {dec.alternativesConsidered.map((alt) => (
                                <span key={alt} className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded line-through">
                                  {alt}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex items-center gap-2 text-xs text-confluence-text-subtle">
                            <User className="w-3.5 h-3.5 shrink-0" />
                            <span>Owner: <span className="text-confluence-text font-medium">{dec.owner}</span></span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-confluence-text-subtle">
                            <Calendar className="w-3.5 h-3.5 shrink-0" />
                            <span>Decided: <span className="text-confluence-text font-medium">{formatDate(dec.dateDecided)}</span></span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-confluence-text-subtle">
                            <RefreshCw className="w-3.5 h-3.5 shrink-0" />
                            <span>Review by: <span className="text-confluence-text font-medium">{formatDate(dec.reviewDate)}</span></span>
                          </div>
                          {dec.linkedJira.length > 0 && (
                            <div className="flex items-center gap-2 text-xs text-confluence-blue">
                              <GitBranch className="w-3.5 h-3.5 shrink-0" />
                              <span>{dec.linkedJira.join(", ")}</span>
                            </div>
                          )}
                        </div>

                        {srcDoc && (
                          <div>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Source Document</p>
                            <Link
                              href={`/document/${srcDoc.id}`}
                              className="flex items-center gap-3 border border-confluence-border rounded-lg px-3 py-2.5 bg-white hover:border-confluence-blue hover:bg-confluence-blue-light transition-colors group"
                            >
                              <span className={`text-xs font-bold px-1.5 py-0.5 rounded shrink-0 ${
                                srcDoc.trustScore >= 80 ? "bg-confluence-green-light text-green-800" :
                                srcDoc.trustScore >= 50 ? "bg-amber-100 text-amber-800" :
                                "bg-red-100 text-red-800"
                              }`}>
                                {srcDoc.trustScore}
                              </span>
                              <span className="text-sm text-confluence-text group-hover:text-confluence-blue font-medium flex-1 truncate">
                                {srcDoc.title}
                              </span>
                              <ChevronRight className="w-4 h-4 text-confluence-text-subtle shrink-0" />
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {selected === null && filtered.length > 0 && (
        <p className="mt-3 text-xs text-confluence-text-subtle">
          Click a decision row to see rationale, lineage, and linked work.
        </p>
      )}
    </div>
  );
}
