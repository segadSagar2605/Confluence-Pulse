"use client";
import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DOCUMENTS } from "@/lib/data/documents";
import { PAGE_TYPE_RULES } from "@/lib/config";
import { getReviewStatus, formatDate } from "@/lib/utils";
import { computeTrust, getTierInfo, computeSpaceScore, TierLabel } from "@/lib/trust";
import {
  Search, AlertTriangle, X, Info,
  ExternalLink, Sparkles, ClipboardCheck, UserPlus, GitMerge,
  SlidersHorizontal, MoreHorizontal,
  ChevronDown, ChevronUp,
} from "lucide-react";

const ALL_OWNERS = Array.from(
  new Set(DOCUMENTS.map((d) => d.owner).filter(Boolean) as string[])
);

const TYPE_OPTIONS = Object.entries(PAGE_TYPE_RULES).map(([key, rule]) => ({
  value: key,
  label: rule.label,
}));

type TrustFilter = "all" | "trusted" | "verify" | "do-not-rely";
type SortKey     = "trust" | "title" | "updated" | "tier";

function tierSortOrder(tier: TierLabel): number {
  return tier === "Critical" ? 0 : tier === "Standard" ? 1 : 2;
}

function tierBadge(tier: TierLabel): string {
  if (tier === "Critical") return "bg-red-700 text-white";
  if (tier === "Standard") return "bg-amber-600 text-white";
  return "bg-gray-500 text-white";
}

function verdictStyle(verdict: string): { label: string; cls: string; scoreCls: string } {
  if (verdict === "Trusted")             return { label: "Trusted",    cls: "bg-green-100 text-green-700", scoreCls: "text-green-600" };
  if (verdict === "Verify Before Using") return { label: "Unverified", cls: "bg-amber-100 text-amber-700", scoreCls: "text-amber-600" };
  return                                        { label: "Untrusted",  cls: "bg-red-100 text-red-700",    scoreCls: "text-red-600"   };
}

export default function KnowledgeLibrary() {
  const router = useRouter();

  const [searchQ, setSearchQ]         = useState("");
  const [typeFilter, setTypeFilter]   = useState("all");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [trustFilter, setTrustFilter] = useState<TrustFilter>("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortKey, setSortKey]         = useState<SortKey>("trust");
  const [sortAsc, setSortAsc]         = useState(true);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [verdictInfoOpen, setVerdictInfoOpen] = useState(false);

  // Read ?verdict= URL param to support click-through from Space Health
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const v = params.get("verdict");
    if (v === "trusted" || v === "verify" || v === "do-not-rely") {
      setTrustFilter(v);
      setFiltersOpen(true);
    }
  }, []);

  useEffect(() => {
    function handleClick() { setOpenDropdownId(null); setVerdictInfoOpen(false); }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Space score — computed once for the header summary (static data, no deps)
  const spaceData = useMemo(() => computeSpaceScore(DOCUMENTS), []);

  const filtered = useMemo(() => {
    let docs = DOCUMENTS.map((doc) => {
      const conflictTitles = doc.conflictsWith
        .map((id) => DOCUMENTS.find((d) => d.id === id)?.title)
        .filter(Boolean) as string[];
      return {
        doc,
        review:   getReviewStatus(doc),
        trust:    computeTrust(doc, conflictTitles),
        tierInfo: getTierInfo(doc.contentType),
      };
    });

    if (searchQ.trim()) {
      const q = searchQ.toLowerCase();
      docs = docs.filter(({ doc }) => doc.title.toLowerCase().includes(q));
    }
    if (typeFilter !== "all")  docs = docs.filter(({ doc }) => doc.contentType === typeFilter);
    if (ownerFilter !== "all") {
      docs = docs.filter(({ doc }) =>
        ownerFilter === "__unassigned" ? !doc.owner : doc.owner === ownerFilter
      );
    }
    if (trustFilter !== "all") {
      docs = docs.filter(({ trust }) => {
        if (trustFilter === "trusted")     return trust.verdict === "Trusted";
        if (trustFilter === "verify")      return trust.verdict === "Verify Before Using";
        if (trustFilter === "do-not-rely") return trust.verdict === "Do Not Rely On";
        return true;
      });
    }

    docs.sort((a, b) => {
      let v = 0;
      if (sortKey === "trust")   v = a.trust.score - b.trust.score;
      if (sortKey === "title")   v = a.doc.title.localeCompare(b.doc.title);
      if (sortKey === "updated") v = new Date(a.doc.lastUpdated).getTime() - new Date(b.doc.lastUpdated).getTime();
      if (sortKey === "tier")    v = tierSortOrder(a.tierInfo.tier) - tierSortOrder(b.tierInfo.tier);
      return sortAsc ? v : -v;
    });

    return docs;
  }, [searchQ, typeFilter, ownerFilter, trustFilter, sortKey, sortAsc]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
  }

  const activeFilterCount = [
    searchQ.trim(), typeFilter !== "all", ownerFilter !== "all", trustFilter !== "all",
  ].filter(Boolean).length;

  function clearFilters() {
    setSearchQ(""); setTypeFilter("all"); setOwnerFilter("all"); setTrustFilter("all");
  }

  const mockAlert = (msg: string) => alert(msg);

  const SortIcon = ({ col }: { col: typeof sortKey }) =>
    sortKey === col
      ? (sortAsc ? <ChevronUp className="w-3 h-3 inline ml-0.5" /> : <ChevronDown className="w-3 h-3 inline ml-0.5" />)
      : null;

  return (
    <div className="px-6 py-6">
      {/* Breadcrumb — left-aligned, outside the centered column */}
      <div className="flex items-center gap-1.5 text-sm text-confluence-text-subtle mb-5">
        <Link href="/" className="hover:text-confluence-blue">Platform Engineering</Link>
        <span>/</span>
        <span className="text-confluence-text font-medium">Knowledge Library</span>
      </div>

      <div className="w-full max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold text-confluence-text mb-0.5">Knowledge Library</h1>
          <div className="flex items-center gap-3 text-sm text-confluence-text-subtle">
            <span>
              {filtered.length} of {DOCUMENTS.length} pages
              {activeFilterCount > 0 && (
                <button onClick={clearFilters} className="ml-2 text-confluence-blue hover:underline text-xs">
                  Clear {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""}
                </button>
              )}
            </span>
            <span className="text-confluence-border">·</span>
            <span>
              Space Health:{" "}
              <span className={`font-semibold ${
                spaceData.spaceVerdict === "Healthy"         ? "text-confluence-green" :
                spaceData.spaceVerdict === "Needs Attention" ? "text-amber-600" :
                "text-red-600"
              }`}>
                {spaceData.spaceScore}
              </span>
            </span>
            <Link href="/" className="text-confluence-blue hover:underline text-xs flex items-center gap-1">
              View Space Health →
            </Link>
          </div>
        </div>
        <button
          onClick={() => setFiltersOpen(!filtersOpen)}
          className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded border transition-colors ${
            filtersOpen || activeFilterCount > 0
              ? "border-confluence-blue bg-confluence-blue-light text-confluence-blue"
              : "border-confluence-border text-confluence-text-subtle hover:bg-confluence-surface-overlay"
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Filters
          {activeFilterCount > 0 && (
            <span className="bg-confluence-blue text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-semibold">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Filter panel — simplified to 4 controls */}
      {filtersOpen && (
        <div className="border border-confluence-border rounded-lg bg-confluence-surface-overlay p-4 mb-5 flex flex-wrap gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-confluence-text-subtle" />
            <input
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              placeholder="Search by title…"
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-confluence-border rounded bg-white outline-none focus:border-confluence-blue"
            />
            {searchQ && (
              <button onClick={() => setSearchQ("")} className="absolute right-2 top-1/2 -translate-y-1/2">
                <X className="w-3 h-3 text-confluence-text-subtle" />
              </button>
            )}
          </div>

          {/* Verdict */}
          <select
            value={trustFilter}
            onChange={(e) => setTrustFilter(e.target.value as TrustFilter)}
            className="text-xs border border-confluence-border rounded px-2 py-1.5 bg-white text-confluence-text outline-none focus:border-confluence-blue"
          >
            <option value="all">All verdicts</option>
            <option value="trusted">Trusted</option>
            <option value="verify">Unverified</option>
            <option value="do-not-rely">Untrusted</option>
          </select>

          {/* Owner */}
          <select
            value={ownerFilter}
            onChange={(e) => setOwnerFilter(e.target.value)}
            className="text-xs border border-confluence-border rounded px-2 py-1.5 bg-white text-confluence-text outline-none focus:border-confluence-blue"
          >
            <option value="all">All owners</option>
            <option value="__unassigned">Unassigned</option>
            {ALL_OWNERS.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>

          {/* Page type */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs border border-confluence-border rounded px-2 py-1.5 bg-white text-confluence-text outline-none focus:border-confluence-blue"
          >
            <option value="all">All types</option>
            {TYPE_OPTIONS.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
      )}

      {/* ── Table ──────────────────────────────────────────────────────────── */}
      <div className="border border-confluence-border rounded-lg overflow-hidden bg-white">
        <table className="w-full">
          <thead>
            <tr className="bg-confluence-surface-overlay border-b border-confluence-border">
              <th
                onClick={() => toggleSort("title")}
                className="text-left px-4 py-3 text-xs font-semibold text-confluence-text-subtle uppercase tracking-wide cursor-pointer hover:text-confluence-text select-none"
              >
                Title <SortIcon col="title" />
              </th>
              <th
                onClick={() => toggleSort("trust")}
                className="text-left px-4 py-3 text-xs font-semibold text-confluence-text-subtle uppercase tracking-wide cursor-pointer hover:text-confluence-text select-none w-40 relative"
              >
                <span className="flex items-center gap-1.5">
                  Verdict <SortIcon col="trust" />
                  <button
                    onClick={(e) => { e.stopPropagation(); setVerdictInfoOpen((o) => !o); }}
                    className={`transition-colors ${verdictInfoOpen ? "text-confluence-blue" : "text-confluence-text-subtle hover:text-confluence-blue"}`}
                    title="How is the Trust Score calculated?"
                  >
                    <Info className="w-3.5 h-3.5" />
                  </button>
                </span>

                {/* Score methodology popover */}
                {verdictInfoOpen && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute left-0 top-full mt-1 z-50 bg-white border border-confluence-border rounded-xl shadow-xl p-4 w-72 font-normal normal-case tracking-normal cursor-default"
                  >
                    <p className="text-xs font-semibold text-confluence-text mb-1">How is the Trust Score calculated?</p>
                    <p className="text-xs text-confluence-text-subtle mb-3 leading-relaxed">
                      Each page starts at 100. Penalties are deducted based on three signals:
                    </p>
                    <div className="space-y-2">
                      {[
                        { signal: "Owner",     rows: ["Confirmed: 0 pts", "Unconfirmed: −15 pts", "No owner: −30 pts"] },
                        { signal: "Freshness", rows: ["< 3 months: 0 pts", "3–6 months: −10 pts", "6–12 months: −20 pts", "> 12 months: −40 pts"] },
                        { signal: "Conflicts", rows: ["None: 0 pts", "Detected: −30 pts"] },
                      ].map(({ signal, rows }) => (
                        <div key={signal}>
                          <p className="text-[11px] font-semibold text-confluence-text">{signal}</p>
                          <ul className="text-[11px] text-confluence-text-subtle space-y-0.5 ml-2">
                            {rows.map((r) => <li key={r}>· {r}</li>)}
                          </ul>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-confluence-border text-[11px] text-confluence-text-subtle">
                      ≥ 80 → <span className="text-green-600 font-medium">Trusted</span>
                      {" · "}50–79 → <span className="text-amber-600 font-medium">Verify</span>
                      {" · "}
                      &lt; 50 → <span className="text-red-600 font-medium">Do Not Rely On</span>
                    </div>
                  </div>
                )}
              </th>
              <th
                onClick={() => toggleSort("tier")}
                className="text-left px-4 py-3 text-xs font-semibold text-confluence-text-subtle uppercase tracking-wide cursor-pointer hover:text-confluence-text select-none w-28"
              >
                Tier <SortIcon col="tier" />
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-confluence-text-subtle uppercase tracking-wide w-36">
                Owner
              </th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-confluence-text-subtle uppercase tracking-wide w-24">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-confluence-border">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-sm text-confluence-text-subtle">
                  No pages match the current filters.{" "}
                  <button onClick={clearFilters} className="text-confluence-blue hover:underline">
                    Clear filters
                  </button>
                </td>
              </tr>
            ) : (
              filtered.map(({ doc, review, trust, tierInfo }) => {
                const rule = PAGE_TYPE_RULES[doc.contentType];
                return (
                  <tr
                    key={doc.id}
                    className="hover:bg-confluence-surface-overlay/60 transition-colors group"
                  >
                    {/* Title — with type chip and conflict badge inline */}
                    <td className="px-4 py-3.5">
                      <Link
                        href={`/document/${doc.id}`}
                        className="text-sm font-medium text-confluence-text group-hover:text-confluence-blue hover:underline leading-snug block"
                      >
                        {doc.title}
                      </Link>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-xs text-confluence-text-subtle bg-gray-100 px-1.5 py-0.5 rounded">
                          {rule.label}
                        </span>
                        {doc.conflictsWith.length > 0 && (
                          <span className="text-xs text-red-600 bg-red-50 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 shrink-0" />
                            {doc.conflictsWith.length} conflict
                          </span>
                        )}
                        <span className="text-xs text-confluence-text-subtle">
                          {formatDate(doc.lastUpdated)}
                        </span>
                      </div>
                    </td>

                    {/* Verdict — badge + score */}
                    <td className="px-4 py-3.5">
                      {(() => {
                        const { label, cls, scoreCls } = verdictStyle(trust.verdict);
                        return (
                          <>
                            <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded ${cls}`}>
                              {label}
                            </span>
                            <span className={`block text-xs font-medium mt-1 tabular-nums ${scoreCls}`}>
                              {trust.score}/100
                            </span>
                          </>
                        );
                      })()}
                    </td>

                    {/* Tier */}
                    <td className="px-4 py-3.5">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded ${tierBadge(tierInfo.tier)}`}>
                        {tierInfo.tier}
                      </span>
                      <span className="block text-xs text-confluence-text-subtle mt-1">
                        {Math.round(tierInfo.weight * 100)}% weight
                      </span>
                    </td>

                    {/* Owner */}
                    <td className="px-4 py-3.5">
                      {doc.owner ? (
                        <div>
                          <span className="text-sm text-confluence-text">{doc.owner}</span>
                          {!doc.ownerConfirmed && (
                            <span className="block text-xs text-amber-600 mt-0.5">Unconfirmed</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-amber-600">Unassigned</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5 text-right">
                      <div className="relative inline-block" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => { e.stopPropagation(); setOpenDropdownId(openDropdownId === doc.id ? null : doc.id); }}
                          className="p-1.5 rounded text-confluence-text-subtle hover:bg-confluence-surface-overlay hover:text-confluence-text transition-colors"
                          title="Actions"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>

                        {openDropdownId === doc.id && (
                          <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-confluence-border rounded-lg shadow-lg py-1 w-44">
                            <button
                              onClick={() => { setOpenDropdownId(null); router.push(`/document/${doc.id}`); }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-confluence-text hover:bg-confluence-surface-overlay"
                            >
                              <ExternalLink className="w-3.5 h-3.5 text-confluence-blue" /> Open page
                            </button>
                            <button
                              onClick={() => { setOpenDropdownId(null); router.push(`/search?q=${encodeURIComponent("What is " + doc.title + "?")}`); }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-confluence-text hover:bg-confluence-surface-overlay"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-confluence-blue" /> Ask AI
                            </button>
                            {review.code !== "not-required" && (
                              <button
                                onClick={() => { setOpenDropdownId(null); mockAlert(`Review requested for: ${doc.title}`); }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-confluence-text hover:bg-confluence-surface-overlay"
                              >
                                <ClipboardCheck className={`w-3.5 h-3.5 ${review.code === "overdue" || review.code === "never-reviewed" ? "text-amber-500" : "text-confluence-text-subtle"}`} />
                                {review.code === "overdue" || review.code === "never-reviewed" ? "Request review" : "Mark reviewed"}
                              </button>
                            )}
                            {!doc.owner && rule.risk !== "low" && (
                              <button
                                onClick={() => { setOpenDropdownId(null); mockAlert(`Assign owner for: ${doc.title}`); }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-confluence-text hover:bg-confluence-surface-overlay"
                              >
                                <UserPlus className="w-3.5 h-3.5 text-amber-500" /> Assign owner
                              </button>
                            )}
                            {doc.conflictsWith.length > 0 && (
                              <button
                                onClick={() => { setOpenDropdownId(null); router.push(`/document/${doc.id}`); }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-confluence-text hover:bg-confluence-surface-overlay"
                              >
                                <GitMerge className="w-3.5 h-3.5 text-red-500" /> View conflicts
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-confluence-text-subtle">
        Verdict computed from Owner (30%) · Freshness (40%) · Conflicts (30%).
        Score and verdict always derive from the same calculation.
      </p>
      </div>
    </div>
  );
}
