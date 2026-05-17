"use client";
import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DOCUMENTS } from "@/lib/data/documents";
import { PAGE_TYPE_RULES, getTrustBand } from "@/lib/config";
import { getReviewStatus, formatDate } from "@/lib/utils";
import {
  Search, AlertTriangle, ChevronDown, ChevronUp,
  X, ExternalLink, Sparkles, ClipboardCheck, UserPlus, GitMerge,
  SlidersHorizontal, MoreHorizontal, Users,
} from "lucide-react";

const ALL_OWNERS = Array.from(
  new Set(DOCUMENTS.map((d) => d.owner).filter(Boolean) as string[])
);

const TYPE_OPTIONS = Object.entries(PAGE_TYPE_RULES).map(([key, rule]) => ({
  value: key,
  label: rule.label,
}));

type TrustFilter = "all" | "trusted" | "needs-review" | "critical";
type ConflictFilter = "all" | "conflicts" | "clean";
type ReviewFilter = "all" | "not-required" | "up-to-date" | "overdue" | "never-reviewed";
type FlagFilter = "all" | "flagged" | "clean";

export default function KnowledgeLibrary() {
  const router = useRouter();

  // ── Filter state ──────────────────────────────────────────────────────────
  const [searchQ, setSearchQ]             = useState("");
  const [typeFilter, setTypeFilter]       = useState("all");
  const [ownerFilter, setOwnerFilter]     = useState("all");
  const [reviewFilter, setReviewFilter]   = useState<ReviewFilter>("all");
  const [trustFilter, setTrustFilter]     = useState<TrustFilter>("all");
  const [conflictFilter, setConflictFilter] = useState<ConflictFilter>("all");
  const [flagFilter, setFlagFilter]       = useState<FlagFilter>("all");
  const [filtersOpen, setFiltersOpen]     = useState(false);
  const [sortKey, setSortKey]             = useState<"trust" | "title" | "updated">("trust");
  const [sortAsc, setSortAsc]             = useState(true);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  useEffect(() => {
    function handleClick() { setOpenDropdownId(null); }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // ── Filtered + sorted documents ───────────────────────────────────────────
  const filtered = useMemo(() => {
    let docs = DOCUMENTS.map((doc) => ({
      doc,
      review: getReviewStatus(doc),
      band: getTrustBand(doc.trustScore),
    }));

    if (searchQ.trim()) {
      const q = searchQ.toLowerCase();
      docs = docs.filter(({ doc }) => doc.title.toLowerCase().includes(q));
    }
    if (typeFilter !== "all") {
      docs = docs.filter(({ doc }) => doc.contentType === typeFilter);
    }
    if (ownerFilter !== "all") {
      docs = docs.filter(({ doc }) =>
        ownerFilter === "__unassigned" ? !doc.owner : doc.owner === ownerFilter
      );
    }
    if (reviewFilter !== "all") {
      docs = docs.filter(({ review }) => review.code === reviewFilter);
    }
    if (trustFilter !== "all") {
      docs = docs.filter(({ doc }) => {
        if (trustFilter === "trusted")     return doc.trustScore >= 80;
        if (trustFilter === "needs-review") return doc.trustScore >= 50 && doc.trustScore < 80;
        if (trustFilter === "critical")    return doc.trustScore < 50;
        return true;
      });
    }
    if (conflictFilter !== "all") {
      docs = docs.filter(({ doc }) =>
        conflictFilter === "conflicts"
          ? doc.conflictsWith.length > 0
          : doc.conflictsWith.length === 0
      );
    }
    if (flagFilter !== "all") {
      docs = docs.filter(({ doc }) =>
        flagFilter === "flagged"
          ? doc.stewardFlags.length > 0
          : doc.stewardFlags.length === 0
      );
    }

    docs.sort((a, b) => {
      let v = 0;
      if (sortKey === "trust")   v = a.doc.trustScore - b.doc.trustScore;
      if (sortKey === "title")   v = a.doc.title.localeCompare(b.doc.title);
      if (sortKey === "updated") v = new Date(a.doc.lastUpdated).getTime() - new Date(b.doc.lastUpdated).getTime();
      return sortAsc ? v : -v;
    });

    return docs;
  }, [searchQ, typeFilter, ownerFilter, reviewFilter, trustFilter, conflictFilter, flagFilter, sortKey, sortAsc]);

  function toggleSort(key: typeof sortKey) {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
  }

  const activeFilterCount = [
    searchQ.trim(), typeFilter !== "all", ownerFilter !== "all",
    reviewFilter !== "all", trustFilter !== "all",
    conflictFilter !== "all", flagFilter !== "all",
  ].filter(Boolean).length;

  function clearFilters() {
    setSearchQ(""); setTypeFilter("all"); setOwnerFilter("all");
    setReviewFilter("all"); setTrustFilter("all");
    setConflictFilter("all"); setFlagFilter("all");
  }

  // ── Mock row actions ──────────────────────────────────────────────────────
  const mockAlert = (msg: string) => alert(msg);

  const SortIcon = ({ col }: { col: typeof sortKey }) =>
    sortKey === col
      ? (sortAsc ? <ChevronUp className="w-3 h-3 inline ml-0.5" /> : <ChevronDown className="w-3 h-3 inline ml-0.5" />)
      : null;

  return (
    <div className="px-6 py-6 w-full">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-confluence-text-subtle mb-5">
        <Link href="/" className="hover:text-confluence-blue">Platform Engineering</Link>
        <span>/</span>
        <span className="text-confluence-text font-medium">Knowledge Library</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-semibold text-confluence-text mb-0.5">Knowledge Library</h1>
          <p className="text-sm text-confluence-text-subtle">
            {filtered.length} of {DOCUMENTS.length} pages
            {activeFilterCount > 0 && (
              <button onClick={clearFilters} className="ml-2 text-confluence-blue hover:underline text-xs">
                Clear {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""}
              </button>
            )}
          </p>
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

      {/* ── Filter panel ──────────────────────────────────────────────────── */}
      {filtersOpen && (
        <div className="border border-confluence-border rounded-lg bg-confluence-surface-overlay p-4 mb-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
          {/* Search */}
          <div className="col-span-2 relative">
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

          {/* Review status */}
          <select
            value={reviewFilter}
            onChange={(e) => setReviewFilter(e.target.value as ReviewFilter)}
            className="text-xs border border-confluence-border rounded px-2 py-1.5 bg-white text-confluence-text outline-none focus:border-confluence-blue"
          >
            <option value="all">All review statuses</option>
            <option value="up-to-date">Up to date</option>
            <option value="overdue">Overdue</option>
            <option value="never-reviewed">Never reviewed</option>
            <option value="not-required">Not required</option>
          </select>

          {/* Trust band */}
          <select
            value={trustFilter}
            onChange={(e) => setTrustFilter(e.target.value as TrustFilter)}
            className="text-xs border border-confluence-border rounded px-2 py-1.5 bg-white text-confluence-text outline-none focus:border-confluence-blue"
          >
            <option value="all">All trust levels</option>
            <option value="trusted">Trusted (80+)</option>
            <option value="needs-review">Needs Review (50–79)</option>
            <option value="critical">Critical (0–49)</option>
          </select>

          {/* Conflict */}
          <select
            value={conflictFilter}
            onChange={(e) => setConflictFilter(e.target.value as ConflictFilter)}
            className="text-xs border border-confluence-border rounded px-2 py-1.5 bg-white text-confluence-text outline-none focus:border-confluence-blue"
          >
            <option value="all">All conflict status</option>
            <option value="conflicts">Has conflicts</option>
            <option value="clean">No conflicts</option>
          </select>

          {/* Flags */}
          <select
            value={flagFilter}
            onChange={(e) => setFlagFilter(e.target.value as FlagFilter)}
            className="text-xs border border-confluence-border rounded px-2 py-1.5 bg-white text-confluence-text outline-none focus:border-confluence-blue"
          >
            <option value="all">All flags</option>
            <option value="flagged">Has flags</option>
            <option value="clean">No flags</option>
          </select>
        </div>
      )}

      {/* ── Table ──────────────────────────────────────────────────────────── */}
      <div className="border border-confluence-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-confluence-surface-overlay border-b border-confluence-border">
              <th className="text-left px-3 py-2.5 text-xs font-semibold text-confluence-text-subtle uppercase tracking-wide w-10">
                #
              </th>
              <th
                onClick={() => toggleSort("title")}
                className="text-left px-3 py-2.5 text-xs font-semibold text-confluence-text-subtle uppercase tracking-wide cursor-pointer hover:text-confluence-text select-none"
              >
                Title <SortIcon col="title" />
              </th>
              <th
                onClick={() => toggleSort("trust")}
                className="text-left px-3 py-2.5 text-xs font-semibold text-confluence-text-subtle uppercase tracking-wide cursor-pointer hover:text-confluence-text w-20 select-none"
              >
                Score <SortIcon col="trust" />
              </th>
              <th className="text-left px-3 py-2.5 text-xs font-semibold text-confluence-text-subtle uppercase tracking-wide hidden md:table-cell w-36">
                Type
              </th>
              <th className="text-left px-3 py-2.5 text-xs font-semibold text-confluence-text-subtle uppercase tracking-wide hidden lg:table-cell w-32">
                Owner
              </th>
              <th
                onClick={() => toggleSort("updated")}
                className="text-left px-3 py-2.5 text-xs font-semibold text-confluence-text-subtle uppercase tracking-wide cursor-pointer hover:text-confluence-text hidden xl:table-cell w-28 select-none"
              >
                Updated <SortIcon col="updated" />
              </th>
              <th className="text-left px-3 py-2.5 text-xs font-semibold text-confluence-text-subtle uppercase tracking-wide hidden lg:table-cell w-36">
                Review Status
              </th>
              <th className="text-left px-3 py-2.5 text-xs font-semibold text-confluence-text-subtle uppercase tracking-wide hidden md:table-cell w-28">
                Conflicts
              </th>
              <th className="text-left px-3 py-2.5 text-xs font-semibold text-confluence-text-subtle uppercase tracking-wide w-28">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-confluence-border">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-sm text-confluence-text-subtle">
                  No pages match the current filters.
                  <button onClick={clearFilters} className="ml-2 text-confluence-blue hover:underline">Clear filters</button>
                </td>
              </tr>
            ) : (
              filtered.map(({ doc, review, band }, idx) => {
                const rule = PAGE_TYPE_RULES[doc.contentType];
                return (
                  <tr
                    key={doc.id}
                    className="hover:bg-confluence-surface-overlay transition-colors group"
                  >
                    {/* Row number */}
                    <td className="px-3 py-2.5 text-xs text-confluence-text-subtle tabular-nums">
                      {idx + 1}
                    </td>

                    {/* Title */}
                    <td className="px-3 py-2.5">
                      <Link
                        href={`/document/${doc.id}`}
                        className="font-medium text-confluence-text group-hover:text-confluence-blue hover:underline leading-snug"
                      >
                        {doc.title}
                      </Link>
                    </td>

                    {/* Trust score — after title */}
                    <td className="px-3 py-2.5">
                      <span className={`inline-block text-xs font-bold px-2 py-1 rounded min-w-[36px] text-center ${band.bg}`}>
                        {doc.trustScore}
                      </span>
                    </td>

                    {/* Type — single line, truncated with tooltip */}
                    <td className="px-3 py-2.5 hidden md:table-cell max-w-[130px]">
                      <span
                        title={rule.label}
                        className="text-xs text-confluence-text-subtle bg-gray-100 px-1.5 py-0.5 rounded block truncate whitespace-nowrap"
                      >
                        {rule.label}
                      </span>
                    </td>

                    {/* Owner */}
                    <td className="px-3 py-2.5 hidden lg:table-cell">
                      {doc.owner ? (
                        <span className="text-xs text-confluence-text">{doc.owner}</span>
                      ) : (
                        <span className="text-xs text-amber-600 flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {rule.risk === "low" ? "—" : "Unassigned"}
                        </span>
                      )}
                    </td>

                    {/* Last Updated */}
                    <td className="px-3 py-2.5 text-xs text-confluence-text-subtle hidden xl:table-cell">
                      {formatDate(doc.lastUpdated)}
                    </td>

                    {/* Review Status */}
                    <td className="px-3 py-2.5 hidden lg:table-cell">
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${review.badgeColor}`}>
                        {review.label}
                      </span>
                    </td>

                    {/* Conflict Status */}
                    <td className="px-3 py-2.5 hidden md:table-cell">
                      {doc.conflictsWith.length > 0 ? (
                        <span className="text-xs text-red-600 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 shrink-0" />
                          {doc.conflictsWith.length} conflict{doc.conflictsWith.length > 1 ? "s" : ""}
                        </span>
                      ) : (
                        <span className="text-xs text-confluence-green">✓ Clean</span>
                      )}
                    </td>

                    {/* Row actions — single dropdown */}
                    <td className="px-3 py-2.5">
                      <div className="relative" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => { e.stopPropagation(); setOpenDropdownId(openDropdownId === doc.id ? null : doc.id); }}
                          className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded border border-confluence-border text-confluence-text-subtle hover:bg-confluence-surface-overlay hover:text-confluence-text transition-colors"
                        >
                          Actions
                          <MoreHorizontal className="w-3.5 h-3.5" />
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

      {/* Footer note */}
      <p className="mt-3 text-xs text-confluence-text-subtle">
        Trust is based on: Accountable Owner · Conflict Status · Conditional Review Status.
        Jira/work linkage shown as supporting context only.
      </p>
    </div>
  );
}
