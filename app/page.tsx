import Link from "next/link";
import { DOCUMENTS, getSpaceHealth } from "@/lib/data/documents";
import { TRUST_THRESHOLDS } from "@/lib/config";
import { trustBgColor, trustLabel, formatDate } from "@/lib/utils";
import {
  AlertTriangle, CheckCircle2, Clock, Users, GitBranch,
  ArrowRight, BarChart3, TrendingDown, Flame,
} from "lucide-react";

const PREVIEW_LIMIT = 3;

export default function SpaceHealthDashboard() {
  const health = getSpaceHealth();
  const overallScore = Math.round(
    DOCUMENTS.reduce((s, d) => s + d.trustScore, 0) / DOCUMENTS.length
  );

  const attentionPages = DOCUMENTS.filter((d) => d.trustScore < 50)
    .sort((a, b) => b.viewCount - a.viewCount);
  const attentionPreview = attentionPages.slice(0, PREVIEW_LIMIT);
  const attentionRemaining = Math.max(0, attentionPages.length - PREVIEW_LIMIT);

  const conflictingPages = DOCUMENTS.filter((d) => d.conflictsWith.length > 0);
  const conflictPreview = conflictingPages.slice(0, PREVIEW_LIMIT);
  const conflictRemaining = Math.max(0, conflictingPages.length - PREVIEW_LIMIT);

  const recentlyReviewed = DOCUMENTS.filter((d) => d.lastValidated)
    .sort((a, b) => new Date(b.lastValidated!).getTime() - new Date(a.lastValidated!).getTime())
    .slice(0, 3);

  return (
    <div className="px-8 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-confluence-text-subtle mb-6">
        <span>Platform Engineering</span>
        <span>/</span>
        <span className="text-confluence-text font-medium">Space Health</span>
      </div>

      {/* Page header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-confluence-text mb-1">
            Space Health
          </h1>
          <p className="text-confluence-text-subtle text-sm">
            AI-powered knowledge health monitoring for Platform Engineering
          </p>
        </div>
        <Link
          href="/library"
          className="flex items-center gap-1.5 text-sm text-confluence-blue hover:underline"
        >
          View all pages <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Overall health score */}
      <div className="bg-white border border-confluence-border rounded-lg p-6 mb-6 flex items-center gap-8">
        <div className="relative w-28 h-28 shrink-0">
          <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="none" stroke="#DFE1E6" strokeWidth="10" />
            <circle
              cx="50" cy="50" r="42" fill="none"
              stroke={overallScore >= 80 ? "#36B37E" : overallScore >= 50 ? "#FF991F" : "#DE350B"}
              strokeWidth="10"
              strokeDasharray={`${(overallScore / 100) * 263.9} 263.9`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-confluence-text">{overallScore}</span>
            <span className="text-xs text-confluence-text-subtle">/ 100</span>
          </div>
        </div>

        <div className="flex-1">
          <div className="text-lg font-semibold text-confluence-text mb-1">
            Space Health Score
          </div>
          <p className="text-sm text-confluence-text-subtle mb-4">
            {health.critical > 0 || health.stale > 0
              ? `${health.critical + health.stale} pages require attention. ${health.conflicting} pages contain conflicting information.`
              : "All pages are in good health."}
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            {[
              { count: health.healthy,    band: TRUST_THRESHOLDS.trusted },
              { count: health.needsReview,band: TRUST_THRESHOLDS.needsReview },
              { count: health.stale,      band: TRUST_THRESHOLDS.stale },
              { count: health.critical,   band: TRUST_THRESHOLDS.critical },
            ].map(({ count, band }) => (
              <span key={band.label} className={`text-xs px-2.5 py-1 rounded-full font-medium ${band.bg}`}>
                {count} {band.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          {
            icon: Users,
            label: "Ownerless Pages",
            value: health.ownerless,
            color: "text-amber-600",
            bg: "bg-amber-50",
            border: "border-amber-200",
            desc: "No assigned owner",
          },
          {
            icon: GitBranch,
            label: "Conflicting Pages",
            value: health.conflicting,
            color: "text-red-600",
            bg: "bg-red-50",
            border: "border-red-200",
            desc: "Contradictory information",
          },
          {
            icon: Flame,
            label: "High-Traffic Stale",
            value: health.highTrafficOutdated,
            color: "text-orange-600",
            bg: "bg-orange-50",
            border: "border-orange-200",
            desc: "Viewed often but outdated",
          },
          {
            icon: Clock,
            label: "Unreviewed",
            value: DOCUMENTS.filter((d) => !d.lastValidated).length,
            color: "text-gray-600",
            bg: "bg-gray-50",
            border: "border-gray-200",
            desc: "Never reviewed",
          },
        ].map(({ icon: Icon, label, value, color, bg, border, desc }) => (
          <div
            key={label}
            className={`${bg} border ${border} rounded-lg p-4`}
          >
            <div className="flex items-center gap-2 mb-2">
              <Icon className={`w-4 h-4 ${color}`} />
              <span className="text-xs text-confluence-text-subtle font-medium">{label}</span>
            </div>
            <div className={`text-3xl font-bold ${color} mb-0.5`}>{value}</div>
            <div className="text-xs text-confluence-text-subtle">{desc}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Attention Required */}
        <div className="border border-confluence-border rounded-lg overflow-hidden">
          <div className="px-4 py-3 bg-confluence-surface-overlay border-b border-confluence-border flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-confluence-text-subtle" />
            <span className="font-semibold text-sm text-confluence-text">Attention Required</span>
            <span className="ml-auto text-xs text-confluence-text-subtle">{attentionPages.length} pages</span>
          </div>
          <div className="divide-y divide-confluence-border">
            {attentionPreview.map((doc) => (
              <Link
                key={doc.id}
                href={`/document/${doc.id}`}
                className="flex items-start gap-3 px-4 py-3 hover:bg-confluence-surface-overlay transition-colors group"
              >
                <div className="mt-0.5">
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${trustBgColor(doc.trustScore)}`}>
                    {doc.trustScore}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-confluence-text truncate group-hover:text-confluence-blue">
                    {doc.title}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${trustBgColor(doc.trustScore)}`}>
                      {trustLabel(doc.trustScore)}
                    </span>
                    {!doc.owner && (
                      <span className="text-xs text-amber-600">No owner</span>
                    )}
                    {doc.conflictsWith.length > 0 && (
                      <span className="text-xs text-red-600 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Conflict
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-confluence-text-subtle mt-0.5">
                    {doc.viewCount.toLocaleString()} views · Updated {formatDate(doc.lastUpdated)}
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-confluence-text-subtle opacity-0 group-hover:opacity-100 transition-opacity mt-0.5 shrink-0" />
              </Link>
            ))}
          </div>
          {attentionRemaining > 0 && (
            <div className="px-4 py-2.5 bg-confluence-surface-overlay border-t border-confluence-border">
              <Link
                href="/library"
                className="text-xs text-confluence-blue hover:underline flex items-center gap-1"
              >
                View {attentionRemaining} more in Knowledge Library <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          )}
        </div>

        {/* Conflict report */}
        <div className="border border-confluence-border rounded-lg overflow-hidden">
          <div className="px-4 py-3 bg-confluence-surface-overlay border-b border-confluence-border flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span className="font-semibold text-sm text-confluence-text">Conflicting Content</span>
            <span className="ml-auto text-xs text-confluence-text-subtle">{conflictingPages.length} pairs</span>
          </div>
          <div className="divide-y divide-confluence-border">
            {conflictPreview.map((doc) => {
              const conflictDoc = DOCUMENTS.find((d) => doc.conflictsWith.includes(d.id));
              return (
                <div key={doc.id} className="px-4 py-3">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                    <span className="text-xs font-semibold text-red-700 bg-red-50 px-2 py-0.5 rounded">
                      Content Conflict
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    <Link href={`/document/${doc.id}`} className="flex items-center gap-2 group">
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${trustBgColor(doc.trustScore)}`}>
                        {doc.trustScore}
                      </span>
                      <span className="text-sm text-confluence-text group-hover:text-confluence-blue truncate">
                        {doc.title}
                      </span>
                    </Link>
                    {conflictDoc && (
                      <Link href={`/document/${conflictDoc.id}`} className="flex items-center gap-2 group">
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${trustBgColor(conflictDoc.trustScore)}`}>
                          {conflictDoc.trustScore}
                        </span>
                        <span className="text-sm text-confluence-text group-hover:text-confluence-blue truncate">
                          {conflictDoc.title}
                        </span>
                      </Link>
                    )}
                  </div>
                  <p className="text-xs text-confluence-text-subtle mt-2">
                    These pages contain contradictory information about API authentication standards.
                  </p>
                </div>
              );
            })}
          </div>

          {conflictRemaining > 0 && (
            <div className="px-4 py-2.5 border-t border-confluence-border">
              <Link
                href="/library"
                className="text-xs text-confluence-blue hover:underline flex items-center gap-1"
              >
                View {conflictRemaining} more in Knowledge Library <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          )}

          {/* Recently reviewed */}
          <div className="px-4 py-3 bg-confluence-surface-overlay border-t border-confluence-border">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-confluence-green" />
              <span className="text-xs font-semibold text-confluence-text">Recently Reviewed</span>
            </div>
            <div className="space-y-1.5">
              {recentlyReviewed.map((doc) => (
                <Link
                  key={doc.id}
                  href={`/document/${doc.id}`}
                  className="flex items-center justify-between group"
                >
                  <span className="text-sm text-confluence-text group-hover:text-confluence-blue truncate">
                    {doc.title}
                  </span>
                  <span className="text-xs text-confluence-text-subtle shrink-0 ml-2">
                    {formatDate(doc.lastValidated!)}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* AI insight banner */}
      <div className="mt-6 border border-confluence-blue/20 bg-confluence-blue-light rounded-lg px-5 py-4 flex items-start gap-3">
        <div className="w-6 h-6 rounded bg-confluence-blue flex items-center justify-center shrink-0 mt-0.5">
          <BarChart3 className="w-3.5 h-3.5 text-white" />
        </div>
        <div>
          <div className="text-sm font-semibold text-confluence-blue mb-1">AI Knowledge Steward Insight</div>
          <p className="text-sm text-confluence-text">
            The most urgent issue in this space is a <strong>live conflict</strong> between the 2021 Authentication Policy
            (still referenced by your highest-traffic runbook) and the 2024 OAuth mandate. Engineers troubleshooting
            auth failures are following outdated API key steps. Recommended action:{" "}
            <Link href="/document/doc-006" className="underline font-medium">archive or update Runbook doc-006</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
