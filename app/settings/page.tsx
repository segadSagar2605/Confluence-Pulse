import Link from "next/link";
import { PAGE_TYPE_RULES, TRUST_THRESHOLDS, STEWARD_ALLOWED, STEWARD_NOT_ALLOWED } from "@/lib/config";
import { ChevronDown, ShieldCheck } from "lucide-react";

function SectionHeader({ letter, title, subtitle }: { letter: string; title: string; subtitle?: string }) {
  return (
    <div className="flex items-start gap-3 mb-4">
      <div className="w-7 h-7 rounded bg-confluence-blue text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
        {letter}
      </div>
      <div>
        <h2 className="text-base font-semibold text-confluence-text">{title}</h2>
        {subtitle && <p className="text-sm text-confluence-text-subtle mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

function DisabledSelect({ value }: { value: string }) {
  return (
    <div className="inline-flex items-center gap-1.5 text-xs border border-gray-200 rounded px-2.5 py-1.5 bg-gray-50 text-gray-500 cursor-not-allowed select-none w-full max-w-[160px]">
      <span className="flex-1 truncate">{value}</span>
      <ChevronDown className="w-3 h-3 text-gray-400 shrink-0" />
    </div>
  );
}

export default function SettingsPage() {
  return (
    <div className="px-8 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-confluence-text-subtle mb-6">
        <Link href="/" className="hover:text-confluence-blue">Platform Engineering</Link>
        <span>/</span>
        <span className="text-confluence-text font-medium">Settings</span>
      </div>

      <h1 className="text-2xl font-semibold text-confluence-text mb-1">Space Settings</h1>
      <p className="text-sm text-confluence-text-subtle mb-2">
        Governance rules, trust thresholds, and AI steward permissions for this space.
      </p>
      <p className="text-xs text-gray-400 mb-8">Read-only — contact your space admin to modify these settings.</p>

      <div className="space-y-8">

        {/* ── A. Page Type Rules + Cadence ────────────────────────────────── */}
        <section className="border border-confluence-border rounded-lg overflow-hidden">
          <div className="px-5 py-4 bg-confluence-surface-overlay border-b border-confluence-border">
            <SectionHeader
              letter="A"
              title="Page Type Rules"
              subtitle="Review requirements and cadence per page type."
            />
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-confluence-border bg-white">
                {["Page Type", "Review Required", "Cadence", "Notes"].map((h) => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-confluence-border">
              {Object.entries(PAGE_TYPE_RULES).map(([, rule]) => (
                <tr key={rule.label}>
                  <td className="px-4 py-3 font-medium text-confluence-text text-sm">{rule.label}</td>
                  <td className="px-4 py-3">
                    <DisabledSelect value={rule.reviewRequired ? "Required" : "Not required"} />
                  </td>
                  <td className="px-4 py-3">
                    <DisabledSelect value={rule.cadenceMonths ? `Every ${rule.cadenceMonths} months` : "Not applicable"} />
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">{rule.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* ── B. Trust Score Thresholds ────────────────────────────────────── */}
        <section className="border border-confluence-border rounded-lg overflow-hidden">
          <div className="px-5 py-4 bg-confluence-surface-overlay border-b border-confluence-border">
            <SectionHeader
              letter="B"
              title="Trust Score Thresholds"
              subtitle="How trust scores map to health bands. Based on: Accountable Owner · Conflict Status · Conditional Review Status."
            />
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-confluence-border bg-white">
                {["Score Range", "Band", "Meaning"].map((h) => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-confluence-border">
              {[
                { range: "80 – 100", band: TRUST_THRESHOLDS.trusted,     meaning: "Owner assigned, no conflicts, review up to date (or not required)" },
                { range: "50 – 79",  band: TRUST_THRESHOLDS.needsReview, meaning: "Review overdue, or owner unassigned on a medium-risk page" },
                { range: "20 – 49",  band: TRUST_THRESHOLDS.stale,       meaning: "Significantly overdue, owner missing on high-risk page, or multiple issues" },
                { range: "0 – 19",   band: TRUST_THRESHOLDS.critical,    meaning: "Active conflict, owner missing on high-risk page, or severely overdue review" },
              ].map(({ range, band, meaning }) => (
                <tr key={range}>
                  <td className="px-4 py-3">
                    <DisabledSelect value={range} />
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-medium text-gray-700 border border-gray-200 rounded px-2 py-1 bg-gray-50">
                      {band.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">{meaning}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-2.5 bg-gray-50 border-t border-confluence-border">
            <p className="text-xs text-gray-400">
              Jira / work linkage is not a trust-score factor. It is shown as supporting context on the page detail view only.
            </p>
          </div>
        </section>

        {/* ── C. AI Steward Permissions ─────────────────────────────────────── */}
        <section className="border border-confluence-border rounded-lg overflow-hidden">
          <div className="px-5 py-4 bg-confluence-surface-overlay border-b border-confluence-border">
            <SectionHeader
              letter="C"
              title="AI Steward Permissions"
              subtitle="What the AI Knowledge Steward is and is not permitted to do in this space."
            />
          </div>
          <div className="px-5 py-4">
            <ul className="space-y-3">
              {STEWARD_ALLOWED.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    defaultChecked
                    disabled
                    className="mt-0.5 shrink-0 w-4 h-4 cursor-not-allowed"
                  />
                  <span className="text-sm text-confluence-text">{item}</span>
                </li>
              ))}
              {STEWARD_NOT_ALLOWED.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    defaultChecked={false}
                    disabled
                    className="mt-0.5 shrink-0 w-4 h-4 cursor-not-allowed"
                  />
                  <span className="text-sm text-gray-400">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="px-5 py-3 bg-gray-50 border-t border-confluence-border flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-gray-400 shrink-0" />
            <p className="text-xs text-gray-400">
              All AI Steward suggestions require human approval before any action is taken.
              Autonomous destructive actions are never permitted.
            </p>
          </div>
        </section>

      </div>
    </div>
  );
}
