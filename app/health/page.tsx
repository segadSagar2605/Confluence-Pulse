"use client";
import { useState } from "react";
import Link from "next/link";
import { DOCUMENTS } from "@/lib/data/documents";
import { computeSpaceScore } from "@/lib/trust";
import { Info, X, ShieldCheck, AlertTriangle, ShieldAlert, SlidersHorizontal } from "lucide-react";

const CIRC = 2 * Math.PI * 65; // ≈ 408.41

const spaceData = computeSpaceScore(DOCUMENTS);

function trustScoreColor(score: number) {
  if (score >= 80) return "text-green-600";
  if (score >= 50) return "text-amber-600";
  return "text-red-600";
}

export default function SpaceHealth() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { spaceScore, spaceVerdict, tierBreakdown, pageSummaries } = spaceData;

  const trustedCount   = pageSummaries.filter((p) => p.verdict === "Trusted").length;
  const verifyCount    = pageSummaries.filter((p) => p.verdict === "Verify Before Using").length;
  const doNotRelyCount = pageSummaries.filter((p) => p.verdict === "Do Not Rely On").length;

  const ringColor =
    spaceVerdict === "Healthy"         ? "#36B37E" :
    spaceVerdict === "Needs Attention" ? "#FF991F" :
    "#DE350B";

  const { critical, standard, reference } = tierBreakdown;

  const tiers = [
    { label: "Critical",  data: critical,  badgeClass: "bg-red-100 text-red-700 border border-red-200"       },
    { label: "Standard",  data: standard,  badgeClass: "bg-amber-100 text-amber-700 border border-amber-200" },
    { label: "Reference", data: reference, badgeClass: "bg-gray-200 text-gray-700 border border-gray-300"    },
  ] as const;

  // Per-tier page lists for the drawer
  const criticalPages  = pageSummaries.filter((p) => p.tier === "Critical");
  const standardPages  = pageSummaries.filter((p) => p.tier === "Standard");
  const referencePages = pageSummaries.filter((p) => p.tier === "Reference");

  return (
    <>
      {/* ── Side drawer backdrop ──────────────────────────────────────────── */}
      {drawerOpen && (
        <div
          className="fixed inset-0 bg-black/25 z-40"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* ── Side drawer panel ────────────────────────────────────────────── */}
      <div
        className={`fixed top-0 right-0 h-full w-[480px] bg-white z-50 shadow-2xl overflow-y-auto transform transition-transform duration-300 ease-in-out ${
          drawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-6 pb-16">

          {/* Drawer header */}
          <div className="flex items-center justify-between mb-7">
            <h2 className="text-base font-bold text-confluence-text">
              How is the Space Score calculated?
            </h2>
            <button
              onClick={() => setDrawerOpen(false)}
              className="text-confluence-text-subtle hover:text-confluence-text transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* ── Step 1: Page Trust Scores ─────────────────────────────────── */}
          <section className="mb-8">
            <p className="text-[11px] font-semibold text-confluence-text-subtle uppercase tracking-widest mb-3">
              Step 1 — Each page gets a Trust Score
            </p>
            <p className="text-sm text-confluence-text-subtle leading-relaxed mb-4">
              Every page starts at 100. Points are deducted based on three risk signals:
            </p>

            <div className="space-y-4">
              {[
                {
                  signal: "Owner",
                  rows: [
                    { label: "Confirmed owner",   penalty: "0 pts",   color: "text-green-600" },
                    { label: "Owner unconfirmed", penalty: "−15 pts", color: "text-amber-600" },
                    { label: "No owner assigned", penalty: "−30 pts", color: "text-red-600"   },
                  ],
                },
                {
                  signal: "Freshness",
                  rows: [
                    { label: "Updated < 3 months",  penalty: "0 pts",   color: "text-green-600" },
                    { label: "3–6 months old",       penalty: "−10 pts", color: "text-amber-600" },
                    { label: "6–12 months old",      penalty: "−20 pts", color: "text-amber-600" },
                    { label: "> 12 months old",      penalty: "−40 pts", color: "text-red-600"   },
                  ],
                },
                {
                  signal: "Conflicts",
                  rows: [
                    { label: "No conflicting pages", penalty: "0 pts",   color: "text-green-600" },
                    { label: "Conflicts detected",   penalty: "−30 pts", color: "text-red-600"   },
                  ],
                },
              ].map(({ signal, rows }) => (
                <div key={signal} className="border border-[#E5E7EB] rounded-lg overflow-hidden">
                  <div className="bg-[#F9FAFB] px-3 py-2 text-xs font-semibold text-confluence-text border-b border-[#E5E7EB]">
                    {signal}
                  </div>
                  {rows.map(({ label, penalty, color }) => (
                    <div
                      key={label}
                      className="flex items-center justify-between px-3 py-2 text-xs border-b border-[#E5E7EB] last:border-0"
                    >
                      <span className="text-confluence-text-subtle">{label}</span>
                      <span className={`font-semibold tabular-nums ${color}`}>{penalty}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <p className="text-xs text-confluence-text-subtle mt-3">
              Trust Score = 100 − total penalties &nbsp;·&nbsp; Range: 0 to 100
            </p>
          </section>

          {/* ── Step 2: Tier averages ─────────────────────────────────────── */}
          <section className="mb-8">
            <p className="text-[11px] font-semibold text-confluence-text-subtle uppercase tracking-widest mb-3">
              Step 2 — Pages are grouped by tier and averaged
            </p>
            <p className="text-sm text-confluence-text-subtle leading-relaxed mb-5">
              Pages are grouped by how dangerous they are if wrong. The tier average
              is the mean Trust Score of all pages in that tier.
            </p>

            <div className="space-y-6">
              {[
                { label: "Critical",  badge: "bg-red-700 text-white",   pages: criticalPages,  data: critical,  pct: 60 },
                { label: "Standard",  badge: "bg-amber-600 text-white", pages: standardPages,  data: standard,  pct: 30 },
                { label: "Reference", badge: "bg-gray-500 text-white",  pages: referencePages, data: reference, pct: 10 },
              ].map(({ label, badge, pages, data, pct }) => (
                <div key={label}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded ${badge}`}>{label}</span>
                    <span className="text-xs text-confluence-text-subtle">
                      {pages.length} page{pages.length !== 1 ? "s" : ""} — {pct}% weight
                    </span>
                  </div>

                  {pages.length > 0 ? (
                    <>
                      <div className="border border-[#E5E7EB] rounded-lg overflow-hidden mb-2">
                        <table className="w-full">
                          <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                            <tr>
                              <th className="text-left px-3 py-1.5 text-[11px] font-semibold text-confluence-text-subtle">
                                Page
                              </th>
                              <th className="text-right px-3 py-1.5 text-[11px] font-semibold text-confluence-text-subtle">
                                Trust Score
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#E5E7EB]">
                            {pages.map((p) => (
                              <tr key={p.id}>
                                <td className="px-3 py-2 text-xs text-confluence-text max-w-0 w-full">
                                  <span className="block truncate">{p.title}</span>
                                </td>
                                <td className={`px-3 py-2 text-xs font-semibold text-right tabular-nums whitespace-nowrap ${trustScoreColor(p.trustScore)}`}>
                                  {p.trustScore}/100
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <p className="text-xs text-confluence-text-subtle">
                        Average = ({pages.map((p) => p.trustScore).join(" + ")}) ÷ {pages.length}{" "}
                        = <span className="font-semibold text-confluence-text">{data.avgScore}</span>
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-confluence-text-subtle italic">
                      No pages in this tier — contributes 0 pts
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* ── Step 3: Final formula ────────────────────────────────────── */}
          <section>
            <p className="text-[11px] font-semibold text-confluence-text-subtle uppercase tracking-widest mb-3">
              Step 3 — Space Score
            </p>
            <p className="text-sm text-confluence-text-subtle leading-relaxed mb-4">
              Each tier&apos;s average is weighted and the three results are summed:
            </p>
            <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg p-4 space-y-2.5">
              {[
                { tier: "Critical",  avg: critical.avgScore,  contrib: critical.contribution,  pct: 60 },
                { tier: "Standard",  avg: standard.avgScore,  contrib: standard.contribution,  pct: 30 },
                { tier: "Reference", avg: reference.avgScore, contrib: reference.contribution, pct: 10 },
              ].map(({ tier, avg, contrib, pct }) => (
                <div key={tier} className="flex items-center justify-between text-sm">
                  <span className="text-confluence-text-subtle">
                    {tier}: {avg} × {pct}%
                  </span>
                  <span className="font-semibold text-confluence-text tabular-nums">
                    = {Math.round(contrib)} pts
                  </span>
                </div>
              ))}
              <div className="border-t border-[#E5E7EB] pt-2.5 flex items-center justify-between">
                <span className="text-sm font-semibold text-confluence-text">
                  Space Score = {Math.round(critical.contribution)} + {Math.round(standard.contribution)} + {Math.round(reference.contribution)}
                </span>
                <span className="text-2xl font-bold tabular-nums" style={{ color: ringColor }}>
                  {spaceScore}
                </span>
              </div>
            </div>
            <p className="text-xs text-confluence-text-subtle mt-4 italic leading-relaxed">
              A single bad policy page damages the score 6× more than a bad meeting note —
              because the blast radius is 6× greater.
            </p>
          </section>

        </div>
      </div>

      {/* ── Main page ────────────────────────────────────────────────────── */}
      <div className="min-h-screen bg-[#F9FAFB] px-6 py-8">

        {/* Breadcrumb — left-aligned, outside the centered column */}
        <p className="text-sm text-confluence-text-subtle mb-4">
          Monitor{" "}
          <span className="mx-1">›</span>{" "}
          <span className="text-confluence-text font-medium">Space Health</span>
        </p>

        <div className="max-w-[900px] mx-auto">

          {/* Page heading */}
          <div className="mb-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-confluence-text">Space Health Overview</h1>
                <p className="text-sm text-confluence-text-subtle mt-1">
                  AI-powered knowledge health monitoring
                </p>
              </div>
              <Link
                href="/library"
                className="shrink-0 mt-1 inline-flex items-center gap-1.5 text-sm text-confluence-text border border-confluence-border rounded-lg px-3 py-1.5 bg-white hover:bg-confluence-surface-overlay transition-colors shadow-sm"
              >
                Knowledge Library <span aria-hidden>→</span>
              </Link>
            </div>
          </div>

          {/* ── SECTION 1: Hero Card ───────────────────────────────────── */}
          {/* overflow-hidden keeps rounded corners when children go edge-to-edge */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl shadow-sm overflow-hidden mb-5">
            <div className="flex items-stretch">

              {/* Score ring + label — centered vertically in its column */}
              <div className="flex flex-col items-center justify-center gap-3 px-8 py-6 shrink-0">
                <div className="relative w-36 h-36">
                  <svg className="w-36 h-36 -rotate-90" viewBox="0 0 160 160">
                    <circle cx="80" cy="80" r="65" fill="none" stroke="#F0F0F0" strokeWidth="14" />
                    <circle
                      cx="80" cy="80" r="65" fill="none"
                      stroke={ringColor}
                      strokeWidth="14"
                      strokeDasharray={`${(spaceScore / 100) * CIRC} ${CIRC}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-5xl font-extrabold leading-none tabular-nums" style={{ color: ringColor }}>
                      {spaceScore}
                    </span>
                    <span className="text-xs text-confluence-text-subtle mt-0.5">/100</span>
                  </div>
                </div>
                <span className="text-xs font-medium text-confluence-text-subtle">Global Health Score</span>
              </div>

              {/* Vertical separator — stretches to full card height automatically */}
              <div className="w-px bg-[#E5E7EB]" />

              {/* Count cards — stretch to match ring section height */}
              <div className="flex flex-1 divide-x divide-[#E5E7EB]">

                {/* Trusted */}
                <Link
                  href="/library?verdict=trusted"
                  className="flex-1 relative flex flex-col items-center justify-center gap-2 py-6 px-4 hover:bg-green-50/40 transition-colors"
                >
                  <SlidersHorizontal className="absolute top-3 right-3 w-3.5 h-3.5 text-gray-300" />
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-6 h-6 text-green-600 shrink-0" />
                    <span className="text-[44px] font-bold text-green-600 tabular-nums leading-none">{trustedCount}</span>
                  </div>
                  <p className="text-sm font-semibold text-green-700 text-center">Trusted</p>
                </Link>

                {/* Unverified */}
                <Link
                  href="/library?verdict=verify"
                  className="flex-1 relative flex flex-col items-center justify-center gap-2 py-6 px-4 hover:bg-amber-50/40 transition-colors"
                >
                  <SlidersHorizontal className="absolute top-3 right-3 w-3.5 h-3.5 text-gray-300" />
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0" />
                    <span className="text-[44px] font-bold text-amber-500 tabular-nums leading-none">{verifyCount}</span>
                  </div>
                  <p className="text-sm font-semibold text-amber-600 text-center">Unverified</p>
                </Link>

                {/* Untrusted */}
                <Link
                  href="/library?verdict=do-not-rely"
                  className="flex-1 relative flex flex-col items-center justify-center gap-2 py-6 px-4 hover:bg-red-50/40 transition-colors"
                >
                  <SlidersHorizontal className="absolute top-3 right-3 w-3.5 h-3.5 text-gray-300" />
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center shrink-0">
                      <X className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-[44px] font-bold text-red-600 tabular-nums leading-none">{doNotRelyCount}</span>
                  </div>
                  <p className="text-sm font-semibold text-red-700 text-center">Untrusted</p>
                </Link>

              </div>
            </div>
          </div>

          {/* ── SECTION 2: Tier Breakdown Card ────────────────────────── */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl shadow-sm p-6">

            {/* Card header — title + legend */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-bold text-confluence-text">
                Tiered Contribution &amp; Status Breakdown
              </h2>
              <div className="flex items-center gap-4">
                {[
                  { dot: "bg-green-500",  label: "Trusted"    },
                  { dot: "bg-amber-400",  label: "Unverified" },
                  { dot: "bg-red-500",    label: "Untrusted"  },
                ].map(({ dot, label }) => (
                  <span key={label} className="flex items-center gap-1.5 text-xs text-confluence-text-subtle">
                    <span className={`w-2 h-2 rounded-full ${dot} shrink-0`} />
                    {label}
                  </span>
                ))}
              </div>
            </div>

            {/* Table with Status Mix column */}
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E5E7EB]">
                  <th className="text-left pb-3 text-xs font-semibold text-confluence-text-subtle uppercase tracking-wide">
                    Tier
                  </th>
                  <th className="text-left pb-3 text-xs font-semibold text-confluence-text-subtle uppercase tracking-wide pl-6">
                    Pages
                  </th>
                  <th className="text-left pb-3 text-xs font-semibold text-confluence-text-subtle uppercase tracking-wide pl-6">
                    Status Mix
                  </th>
                  <th className="text-right pb-3 text-xs font-semibold text-confluence-text-subtle uppercase tracking-wide">
                    Contribution
                  </th>
                </tr>
              </thead>
              <tbody>
                {tiers.map(({ label, data, badgeClass }) => {
                  const empty = data.pages.length === 0;
                  const t = data.pages.filter((p) => p.verdict === "Trusted").length;
                  const v = data.pages.filter((p) => p.verdict === "Verify Before Using").length;
                  const d = data.pages.filter((p) => p.verdict === "Do Not Rely On").length;
                  return (
                    <tr
                      key={label}
                      className="border-b border-[#E5E7EB] last:border-0"
                    >
                      <td className="py-4">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded ${badgeClass}`}>
                          {label}
                        </span>
                      </td>
                      <td className={`py-4 text-sm pl-6 ${empty ? "text-gray-400" : "text-confluence-text"}`}>
                        {data.pages.length} page{data.pages.length !== 1 ? "s" : ""}
                      </td>
                      <td className="py-4 pl-6">
                        <div className="flex items-center gap-3">
                          {[
                            { count: t, dot: empty ? "bg-gray-300" : "bg-green-500",  text: empty ? "text-gray-400" : "text-green-600" },
                            { count: v, dot: empty ? "bg-gray-300" : "bg-amber-400",  text: empty ? "text-gray-400" : "text-amber-600" },
                            { count: d, dot: empty ? "bg-gray-300" : "bg-red-500",    text: empty ? "text-gray-400" : "text-red-600"   },
                          ].map(({ count, dot, text }, i) => (
                            <span key={i} className={`flex items-center gap-1 text-xs font-semibold ${text}`}>
                              <span className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />
                              {count}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className={`py-4 text-sm font-semibold text-right tabular-nums ${empty ? "text-gray-400" : "text-confluence-text"}`}>
                        {empty ? "0" : `${Math.round(data.contribution)} pts`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Bottom action */}
            <div className="mt-5 pt-4 border-t border-[#E5E7EB] flex justify-end">
              <button
                onClick={() => setDrawerOpen(true)}
                className="flex items-center gap-1.5 text-xs text-confluence-text-subtle hover:text-confluence-blue transition-colors"
              >
                <Info className="w-3.5 h-3.5" />
                View Calculation Methodology
              </button>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
