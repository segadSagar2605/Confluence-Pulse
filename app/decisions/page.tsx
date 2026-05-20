"use client";
import { getAllDecisions, DOCUMENTS } from "@/lib/data/documents";
import { formatDate } from "@/lib/utils";
import { computeTrust } from "@/lib/trust";
import Link from "next/link";
import { useState, useMemo, useRef, useEffect } from "react";
import {
  User, Calendar, GitBranch, RefreshCw,
  ChevronDown, ChevronRight, CheckCircle2, Clock, AlertCircle,
  Search, X, SlidersHorizontal,
  Network, FileText, Package, Layers, CircleDot,
} from "lucide-react";

// ── Status config ─────────────────────────────────────────────────────────────

const statusConfig = {
  active:         { label: "Active",       color: "bg-green-100 text-green-700",  dot: "bg-green-500",  icon: CheckCircle2, iconColor: "text-green-600" },
  "under-review": { label: "Under Review", color: "bg-amber-100 text-amber-700",  dot: "bg-amber-400",  icon: Clock,        iconColor: "text-amber-500" },
  superseded:     { label: "Superseded",   color: "bg-gray-100 text-gray-500",    dot: "bg-gray-300",   icon: AlertCircle,  iconColor: "text-gray-400" },
};
type StatusKey = keyof typeof statusConfig;

// ── Lineage node config ───────────────────────────────────────────────────────

const lineageNodeConfig: Record<string, {
  icon: React.ComponentType<{ className?: string }>;
  strip: string; iconText: string; labelText: string; typeCls: string;
}> = {
  "Incident":               { icon: AlertCircle, strip: "bg-red-500",    iconText: "text-white", labelText: "text-gray-900", typeCls: "text-red-500"    },
  "Architecture Decision":  { icon: Network,     strip: "bg-blue-500",   iconText: "text-white", labelText: "text-gray-900", typeCls: "text-blue-500"   },
  "Policy Mandate":         { icon: FileText,    strip: "bg-indigo-500", iconText: "text-white", labelText: "text-gray-900", typeCls: "text-indigo-500" },
  "Jira Epic":              { icon: Layers,      strip: "bg-cyan-500",   iconText: "text-white", labelText: "text-gray-900", typeCls: "text-cyan-600"   },
  "Implementation":         { icon: Package,     strip: "bg-teal-500",   iconText: "text-white", labelText: "text-gray-900", typeCls: "text-teal-600"   },
};

// ── Jira epic mock data ───────────────────────────────────────────────────────

const JIRA_EPIC_DATA: Record<string, {
  epicTitle: string;
  epicStatus: string;
  features: Array<{
    key: string; title: string; status: string;
    stories: Array<{ key: string; title: string; status: string; points: number }>;
  }>;
}> = {
  "PLAT-2301": {
    epicTitle: "API Gateway OAuth Migration",
    epicStatus: "Done",
    features: [
      {
        key: "PLAT-2301-F1",
        title: "Gateway OAuth Token Validation",
        status: "Done",
        stories: [
          { key: "PLAT-2312", title: "Implement JWT validation middleware",   status: "Done",        points: 5 },
          { key: "PLAT-2313", title: "Configure JWKS endpoint integration",   status: "Done",        points: 3 },
          { key: "PLAT-2314", title: "Add token expiry & refresh handling",   status: "Done",        points: 3 },
        ],
      },
      {
        key: "PLAT-2301-F2",
        title: "API Key Deprecation & Sunset",
        status: "Done",
        stories: [
          { key: "PLAT-2315", title: "Add deprecation warning headers",       status: "Done",        points: 2 },
          { key: "PLAT-2316", title: "Sunset logging for X-API-Key header",   status: "Done",        points: 3 },
          { key: "PLAT-2317", title: "Block API key auth after Dec 2024",     status: "Done",        points: 5 },
        ],
      },
      {
        key: "PLAT-2301-F3",
        title: "Service Team Migration Tooling",
        status: "In Progress",
        stories: [
          { key: "PLAT-2318", title: "Build OAuth migration CLI for teams",   status: "Done",        points: 8 },
          { key: "PLAT-2319", title: "Write migration guide docs",            status: "Done",        points: 3 },
          { key: "PLAT-2320", title: "Dashboard: migration status per service", status: "In Progress", points: 5 },
        ],
      },
    ],
  },
};

const storyStatusCfg: Record<string, { cls: string; dot: string }> = {
  "Done":        { cls: "bg-green-100 text-green-700",  dot: "bg-green-500"  },
  "In Progress": { cls: "bg-blue-100 text-blue-700",    dot: "bg-blue-500"   },
  "To Do":       { cls: "bg-gray-100 text-gray-500",    dot: "bg-gray-400"   },
};

// ── Lineage ───────────────────────────────────────────────────────────────────

const LINEAGE = [
  { label: "SEC-INC-2023-047", type: "Incident" },
  { label: "ADR-007",          type: "Architecture Decision" },
  { label: "Auth Policy 2024", type: "Policy Mandate" },
  { label: "PLAT-2301",        type: "Jira Epic" },
  { label: "API Gateway PRD",  type: "Implementation" },
];

// ── Filter options ────────────────────────────────────────────────────────────

const SOURCE_OPTIONS  = [{ value:"all",label:"All" },{ value:"adr",label:"ADR" },{ value:"rfc",label:"RFC" },{ value:"incident",label:"Incident Review" },{ value:"prd",label:"PRD" },{ value:"meeting-notes",label:"Meeting Notes" }];
const REVIEW_OPTIONS  = [{ value:"all",label:"All" },{ value:"overdue",label:"Overdue" },{ value:"due-this-quarter",label:"Due this quarter" },{ value:"up-to-date",label:"Up to date" }];
const OWNER_OPTIONS   = [{ value:"all",label:"All" },{ value:"assigned",label:"Assigned" },{ value:"unassigned",label:"Unassigned" }];

function classifyReviewDate(reviewDate: string): "overdue" | "due-this-quarter" | "up-to-date" {
  const NOW = new Date("2026-05-17");
  const NOW_QUARTER = Math.floor(NOW.getMonth() / 3);
  const iso = new Date(reviewDate);
  if (!isNaN(iso.getTime())) {
    if (iso < NOW) return "overdue";
    if (iso.getFullYear() === NOW.getFullYear() && Math.floor(iso.getMonth() / 3) === NOW_QUARTER) return "due-this-quarter";
    return "up-to-date";
  }
  const m = reviewDate.match(/Q([1-4])\s*(\d{4})/i);
  if (m) {
    const q = parseInt(m[1]) - 1, y = parseInt(m[2]);
    if (y < NOW.getFullYear() || (y === NOW.getFullYear() && q < NOW_QUARTER)) return "overdue";
    if (y === NOW.getFullYear() && q === NOW_QUARTER) return "due-this-quarter";
    return "up-to-date";
  }
  return "up-to-date";
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] font-semibold text-confluence-text-subtle uppercase tracking-widest mb-3">{children}</p>;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function DecisionGraph() {
  const [selected, setSelected]         = useState<string | null>(null);
  const [expandedJira, setExpandedJira] = useState<string | null>(null);
  const [expandedFeatures, setExpandedFeatures] = useState<Set<string>>(new Set());
  const [searchQ, setSearchQ]           = useState("");
  const [filterOpen, setFilterOpen]     = useState(false);
  const [filters, setFilters]           = useState({ source: "all", reviewStatus: "all", owner: "all" });
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterOpen(false);
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
    if (searchQ.trim()) { const q = searchQ.toLowerCase(); items = items.filter((d) => d.title.toLowerCase().includes(q) || d.summary.toLowerCase().includes(q)); }
    if (filters.source !== "all")       items = items.filter((d) => d.sourceContentType === filters.source);
    if (filters.reviewStatus !== "all") items = items.filter((d) => d.reviewCode === filters.reviewStatus);
    if (filters.owner !== "all") {
      if (filters.owner === "unassigned") items = items.filter((d) => !d.owner);
      else items = items.filter((d) => !!d.owner);
    }
    return items;
  }, [decisions, searchQ, filters]);

  const counts = useMemo(() => { const c: Record<string,number> = {}; for (const d of decisions) c[d.status] = (c[d.status] ?? 0) + 1; return c; }, [decisions]);

  const activePills = useMemo(() => {
    const pills: { key: string; label: string }[] = [];
    if (filters.source !== "all")       pills.push({ key: "source",       label: `Source: ${SOURCE_OPTIONS.find((o) => o.value === filters.source)?.label}` });
    if (filters.reviewStatus !== "all") pills.push({ key: "reviewStatus", label: `Review: ${REVIEW_OPTIONS.find((o) => o.value === filters.reviewStatus)?.label}` });
    if (filters.owner !== "all")        pills.push({ key: "owner",        label: `Owner: ${OWNER_OPTIONS.find((o) => o.value === filters.owner)?.label}` });
    return pills;
  }, [filters]);

  function clearFilter(key: string) { setFilters((prev) => ({ ...prev, [key]: "all" })); }
  function clearAll() { setFilters({ source: "all", reviewStatus: "all", owner: "all" }); setSearchQ(""); setFilterOpen(false); }

  function toggleFeature(key: string) {
    setExpandedFeatures((prev) => { const next = new Set(prev); next.has(key) ? next.delete(key) : next.add(key); return next; });
  }

  const activeFilterCount = activePills.length;

  return (
    <div className="px-6 py-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-confluence-text-subtle mb-5">
        <Link href="/" className="hover:text-confluence-blue">Platform Engineering</Link>
        <span>/</span>
        <span className="text-confluence-text font-medium">Decision Intelligence</span>
      </div>

      <div className="max-w-5xl mx-auto">

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-confluence-text mb-1">Decision Intelligence</h1>
          <p className="text-sm text-confluence-text-subtle">
            {decisions.length} decisions extracted from {DOCUMENTS.length} pages · AI-identified and structured
          </p>
        </div>

        {/* Search + Filter */}
        <div className="flex items-center gap-3 mb-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-confluence-text-subtle" />
            <input value={searchQ} onChange={(e) => setSearchQ(e.target.value)}
              placeholder="Search decisions by title, summary, owner…"
              className="w-full pl-9 pr-8 py-2 text-sm border border-confluence-border rounded-lg bg-white outline-none focus:border-confluence-blue focus:ring-1 focus:ring-confluence-blue/20"
            />
            {searchQ && <button onClick={() => setSearchQ("")} className="absolute right-2.5 top-1/2 -translate-y-1/2"><X className="w-3.5 h-3.5 text-confluence-text-subtle" /></button>}
          </div>

          <div className="relative shrink-0" ref={filterRef}>
            <button onClick={() => setFilterOpen(!filterOpen)}
              className={`flex items-center gap-2 text-sm px-4 py-2 rounded-lg border transition-colors ${activeFilterCount > 0 || filterOpen ? "border-confluence-blue bg-confluence-blue-light text-confluence-blue" : "border-confluence-border text-confluence-text-subtle hover:bg-confluence-surface-overlay"}`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filter
              {activeFilterCount > 0 && <span className="bg-confluence-blue text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-semibold leading-none">{activeFilterCount}</span>}
            </button>
            {filterOpen && (
              <div className="absolute right-0 top-full mt-2 z-50 bg-white border border-confluence-border rounded-xl shadow-xl w-80 overflow-hidden">
                <div className="px-5 py-4 border-b border-confluence-border bg-confluence-surface-overlay">
                  <p className="text-xs font-semibold text-confluence-text-subtle uppercase tracking-widest">Filter decisions</p>
                </div>
                <div className="px-5 py-4 space-y-5">
                  {[{ key:"source",label:"Source",options:SOURCE_OPTIONS },{ key:"reviewStatus",label:"Review Status",options:REVIEW_OPTIONS },{ key:"owner",label:"Owner",options:OWNER_OPTIONS }].map((group, gi) => (
                    <div key={group.key}>
                      {gi > 0 && <div className="border-t border-confluence-border -mx-5 mb-5" />}
                      <p className="text-xs font-semibold text-confluence-text-subtle uppercase tracking-widest mb-3">{group.label}</p>
                      <div className="grid grid-cols-2 gap-y-2 gap-x-3">
                        {group.options.map((opt) => (
                          <label key={opt.value} className="flex items-center gap-2 cursor-pointer group">
                            <input type="radio" name={group.key} value={opt.value}
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
                    <button onClick={clearAll} className="text-xs text-confluence-blue font-medium hover:underline">Clear all</button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="shrink-0 flex items-center gap-3 text-xs text-confluence-text-subtle">
            {(["active", "under-review", "superseded"] as StatusKey[]).filter((k) => (counts[k] ?? 0) > 0).map((k, i) => (
              <span key={k} className="flex items-center gap-1.5">
                {i > 0 && <span className="text-confluence-border">·</span>}
                <span className={`w-2 h-2 rounded-full ${statusConfig[k].dot}`} />
                <span className="font-semibold text-confluence-text">{counts[k]}</span>
                <span>{statusConfig[k].label}</span>
              </span>
            ))}
          </div>
        </div>

        {activePills.length > 0 && (
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {activePills.map((pill) => (
              <span key={pill.key} className="flex items-center gap-1 text-xs bg-confluence-blue-light text-confluence-blue border border-confluence-blue/30 px-2.5 py-1 rounded-full">
                {pill.label}
                <button onClick={() => clearFilter(pill.key)}><X className="w-3 h-3 ml-0.5" /></button>
              </span>
            ))}
          </div>
        )}

        {/* Decision list */}
        <div className="bg-white border border-confluence-border rounded-2xl overflow-hidden shadow-sm">
          {filtered.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-confluence-text-subtle">
              No decisions match the current filters.{" "}
              <button onClick={clearAll} className="text-confluence-blue hover:underline">Clear all</button>
            </div>
          ) : (
            filtered.map((dec) => {
              const cfg = statusConfig[dec.status as StatusKey];
              const StatusIcon = cfg.icon;
              const isOpen = selected === dec.id;
              const srcDoc = DOCUMENTS.find((d) => d.id === dec.sourceDocId);

              return (
                <div key={dec.id} className="border-b border-confluence-border last:border-b-0">

                  {/* Row */}
                  <button
                    onClick={() => { setSelected(isOpen ? null : dec.id); setExpandedJira(null); setExpandedFeatures(new Set()); }}
                    className={`w-full flex items-center gap-4 px-5 py-4 text-left transition-colors ${isOpen ? "bg-[#F0F4FF]" : "hover:bg-confluence-surface-overlay/60"}`}
                  >
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${cfg.color}`}>
                      <StatusIcon className={`w-3 h-3 ${cfg.iconColor}`} />
                      {cfg.label}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-confluence-text truncate mb-1">{dec.title}</p>
                      <div className="flex items-center flex-wrap gap-x-4 gap-y-0.5">
                        <span className="flex items-center gap-1 text-xs text-confluence-text-subtle">
                          <FileText className="w-3 h-3 shrink-0" />
                          <span className="truncate max-w-[200px]">{dec.sourceDocTitle.split(":")[0]}</span>
                        </span>
                        {dec.owner && (
                          <span className="flex items-center gap-1 text-xs text-confluence-text-subtle">
                            <User className="w-3 h-3 shrink-0" />{dec.owner}
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-xs text-confluence-text-subtle">
                          <RefreshCw className="w-3 h-3 shrink-0" />Review by {formatDate(dec.reviewDate)}
                        </span>
                      </div>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-confluence-text-subtle shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                  </button>

                  {/* Expanded panel */}
                  {isOpen && (
                    <div className="border-t border-confluence-border bg-[#F8F9FB] px-6 py-6 space-y-6">

                      {/* ── Decision Lineage ── */}
                      <div>
                        <SectionLabel>Decision Lineage</SectionLabel>

                        {/* Nodes row — equal-width flex, text truncates if too long */}
                        <div className="flex items-center gap-0">
                          {LINEAGE.map((node, i) => {
                            const nc = lineageNodeConfig[node.type] ?? lineageNodeConfig["Implementation"];
                            const NodeIcon = nc.icon;
                            const jiraData = node.type === "Jira Epic" ? JIRA_EPIC_DATA[node.label] : null;
                            const isJiraExpanded = expandedJira === node.label;

                            return (
                              <div key={i} className="flex items-center shrink-0">
                                {/* Node card — horizontal split design */}
                                <div
                                  className={`flex items-stretch border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white flex-1 min-w-0 ${jiraData ? "cursor-pointer hover:border-cyan-400 hover:shadow-md" : ""} transition-all`}
                                  onClick={jiraData ? () => setExpandedJira(isJiraExpanded ? null : node.label) : undefined}
                                >
                                  {/* Left colored strip */}
                                  <div className={`w-10 flex items-center justify-center shrink-0 ${nc.strip}`}>
                                    <NodeIcon className="w-4 h-4 text-white" />
                                  </div>
                                  {/* Right text */}
                                  <div className="px-3 py-2.5 flex flex-col justify-center min-w-0 flex-1">
                                    <p className="text-xs font-bold text-gray-900 truncate">{node.label}</p>
                                    <p className={`text-[10px] font-semibold uppercase tracking-wide flex items-center gap-0.5 ${nc.typeCls}`}>
                                      {node.type}
                                      {jiraData && (
                                        <ChevronDown className={`w-3 h-3 shrink-0 transition-transform duration-200 ${isJiraExpanded ? "rotate-180" : ""}`} />
                                      )}
                                    </p>
                                  </div>
                                </div>

                                {/* Arrow connector — fixed width, never shrinks */}
                                {i < LINEAGE.length - 1 && (
                                  <div className="flex items-center mx-1.5 shrink-0">
                                    <div className="w-5 h-px bg-gray-300" />
                                    <svg width="7" height="10" viewBox="0 0 7 10" className="text-gray-400 -ml-px">
                                      <path d="M0 0 L7 5 L0 10 Z" fill="currentColor" />
                                    </svg>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Jira epic expansion panel */}
                        {expandedJira && JIRA_EPIC_DATA[expandedJira] && (() => {
                          const epic = JIRA_EPIC_DATA[expandedJira];
                          const totalStories = epic.features.reduce((n, f) => n + f.stories.length, 0);
                          const doneStories  = epic.features.reduce((n, f) => n + f.stories.filter((s) => s.status === "Done").length, 0);
                          return (
                            <div className="mt-3 border border-cyan-200 rounded-xl bg-white overflow-hidden shadow-sm">
                              {/* Epic header */}
                              <div className="flex items-center gap-3 px-4 py-3 bg-cyan-50 border-b border-cyan-200">
                                <Layers className="w-4 h-4 text-cyan-600 shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-cyan-700">{expandedJira}</span>
                                    <span className="text-xs text-confluence-text-subtle">·</span>
                                    <span className="text-sm font-semibold text-confluence-text truncate">{epic.epicTitle}</span>
                                  </div>
                                </div>
                                <span className="text-xs text-confluence-text-subtle shrink-0">
                                  {doneStories}/{totalStories} stories done
                                </span>
                                <div className="w-20 bg-gray-200 rounded-full h-1.5 shrink-0">
                                  <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${Math.round((doneStories / totalStories) * 100)}%` }} />
                                </div>
                              </div>

                              {/* Features */}
                              <div className="divide-y divide-gray-100">
                                {epic.features.map((feat) => {
                                  const isExpanded = expandedFeatures.has(feat.key);
                                  const doneCount = feat.stories.filter((s) => s.status === "Done").length;
                                  const featCfg = storyStatusCfg[feat.status] ?? storyStatusCfg["To Do"];
                                  return (
                                    <div key={feat.key}>
                                      {/* Feature row */}
                                      <button
                                        onClick={() => toggleFeature(feat.key)}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 transition-colors"
                                      >
                                        <ChevronRight className={`w-3.5 h-3.5 text-confluence-text-subtle shrink-0 transition-transform duration-150 ${isExpanded ? "rotate-90" : ""}`} />
                                        <CircleDot className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                                        <span className="text-sm font-medium text-confluence-text flex-1 truncate text-left">{feat.title}</span>
                                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${featCfg.cls}`}>{feat.status}</span>
                                        <span className="text-xs text-confluence-text-subtle shrink-0 mr-1">{doneCount}/{feat.stories.length}</span>
                                      </button>

                                      {/* Stories */}
                                      {isExpanded && (
                                        <div className="bg-gray-50/70 border-t border-gray-100">
                                          {feat.stories.map((story) => {
                                            const sCfg = storyStatusCfg[story.status] ?? storyStatusCfg["To Do"];
                                            return (
                                              <div key={story.key} className="flex items-center gap-3 px-10 py-2 border-b border-gray-100 last:border-0">
                                                <span className={`w-2 h-2 rounded-full shrink-0 ${sCfg.dot}`} />
                                                <span className="text-xs text-confluence-blue font-medium shrink-0 w-20">{story.key}</span>
                                                <span className="text-xs text-confluence-text flex-1 truncate">{story.title}</span>
                                                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${sCfg.cls}`}>{story.status}</span>
                                                <span className="text-[11px] text-confluence-text-subtle shrink-0">{story.points} pts</span>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })()}

                        <p className="text-xs text-confluence-text-subtle mt-3 italic leading-relaxed">
                          Oct 2023 incident triggered ADR-007 → drove the 2024 Auth Policy → became PLAT-2301 → delivered the API Gateway PRD
                        </p>
                      </div>

                      {/* Detail grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* Left */}
                        <div className="space-y-4">
                          <p className="text-sm text-confluence-text leading-relaxed">{dec.summary}</p>
                          <div className="bg-white border border-confluence-border rounded-xl p-4">
                            <SectionLabel>Rationale</SectionLabel>
                            <p className="text-sm text-confluence-text leading-relaxed">{dec.rationale}</p>
                          </div>
                          {dec.alternativesConsidered.length > 0 && (
                            <div>
                              <SectionLabel>Alternatives Rejected</SectionLabel>
                              <div className="flex flex-wrap gap-2">
                                {dec.alternativesConsidered.map((alt) => (
                                  <span key={alt} className="text-xs bg-white border border-confluence-border text-confluence-text-subtle px-2.5 py-1 rounded-lg line-through">
                                    {alt}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Right */}
                        <div className="space-y-4">
                          <div className="bg-white border border-confluence-border rounded-xl p-4 space-y-3">
                            <div className="flex items-center gap-2 text-xs text-confluence-text-subtle">
                              <User className="w-3.5 h-3.5 shrink-0" />
                              <span>Owner</span>
                              <span className="ml-auto font-medium text-confluence-text">{dec.owner || "—"}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-confluence-text-subtle border-t border-confluence-border pt-3">
                              <Calendar className="w-3.5 h-3.5 shrink-0" />
                              <span>Decided</span>
                              <span className="ml-auto font-medium text-confluence-text">{formatDate(dec.dateDecided)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-confluence-text-subtle border-t border-confluence-border pt-3">
                              <RefreshCw className="w-3.5 h-3.5 shrink-0" />
                              <span>Review by</span>
                              <span className="ml-auto font-medium text-confluence-text">{formatDate(dec.reviewDate)}</span>
                            </div>
                            {dec.linkedJira.length > 0 && (
                              <div className="flex items-center gap-2 text-xs text-confluence-text-subtle border-t border-confluence-border pt-3">
                                <GitBranch className="w-3.5 h-3.5 shrink-0" />
                                <span>Linked Issues</span>
                                <span className="ml-auto font-medium text-confluence-blue">{dec.linkedJira.join(", ")}</span>
                              </div>
                            )}
                          </div>

                          {srcDoc && (
                            <div>
                              <SectionLabel>Source Document</SectionLabel>
                              {(() => {
                                const srcTrust = computeTrust(srcDoc);
                                const verdictCls =
                                  srcTrust.verdict === "Trusted"             ? "bg-green-100 text-green-700" :
                                  srcTrust.verdict === "Verify Before Using" ? "bg-amber-100 text-amber-700" :
                                  "bg-red-100 text-red-700";
                                const verdictLabel =
                                  srcTrust.verdict === "Trusted"             ? "Trusted"    :
                                  srcTrust.verdict === "Verify Before Using" ? "Unverified" :
                                  "Untrusted";
                                return (
                                  <Link href={`/document/${srcDoc.id}`}
                                    className="flex items-center gap-3 bg-white border border-confluence-border rounded-xl px-4 py-3 hover:border-confluence-blue hover:bg-confluence-blue-light transition-colors group"
                                  >
                                    <span className={`text-xs font-semibold px-2 py-0.5 rounded shrink-0 ${verdictCls}`}>{verdictLabel}</span>
                                    <span className="text-sm text-confluence-text group-hover:text-confluence-blue font-medium flex-1 truncate">{srcDoc.title}</span>
                                    <ChevronRight className="w-4 h-4 text-confluence-text-subtle shrink-0" />
                                  </Link>
                                );
                              })()}
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
    </div>
  );
}
