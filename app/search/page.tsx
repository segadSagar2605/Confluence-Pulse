"use client";
import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Search, Sparkles, AlertTriangle, CheckCircle2, Clock,
  ChevronRight, User, RotateCcw, ThumbsUp, ThumbsDown,
} from "lucide-react";

interface Source {
  id: string;
  title: string;
  relevance: string;
  freshness: "fresh" | "aging" | "stale";
  trustScore: number;
}

interface Conflict {
  summary: string;
  docA: { id: string; title: string };
  docB: { id: string; title: string };
}

interface SearchResult {
  answer: string;
  confidence: "high" | "medium" | "low";
  confidenceReason: string;
  sources: Source[];
  conflicts: Conflict[];
  recommendedAction: string;
  peopleToAsk: string[];
}

const SUGGESTED: { label: string; confidence: "high" | "medium" | "low" }[] = [
  { label: "What decisions are active in this space?",                   confidence: "high"   },
  { label: "What is the current API authentication standard?",           confidence: "medium" },
  { label: "Why did we stop using API keys?",                            confidence: "medium" },
  { label: "Is the runbook for auth failures up to date?",               confidence: "low"    },
  { label: "Which document should engineers follow for auth troubleshooting?", confidence: "low" },
];

const confidenceConfig = {
  high: { color: "text-confluence-green", bg: "bg-confluence-green-light border-green-200", label: "High Confidence", icon: CheckCircle2 },
  medium: { color: "text-amber-700", bg: "bg-amber-50 border-amber-200", label: "Medium Confidence", icon: Clock },
  low: { color: "text-red-700", bg: "bg-red-50 border-red-200", label: "Low Confidence", icon: AlertTriangle },
};

const freshnessConfig = {
  fresh: { color: "text-confluence-green", label: "Fresh" },
  aging: { color: "text-amber-600", label: "Aging" },
  stale: { color: "text-red-500", label: "Stale" },
};

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(initialQ);
  const [inputVal, setInputVal] = useState(initialQ);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialQ) handleSearch(initialQ);
  }, []);

  async function handleSearch(q?: string) {
    const searchQuery = q ?? inputVal.trim();
    if (!searchQuery) return;
    setQuery(searchQuery);
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery }),
      });
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      setResult(data);
    } catch {
      setError("Search failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const conf = result ? confidenceConfig[result.confidence] : null;
  const ConfIcon = conf?.icon;

  return (
    <div className="px-8 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-confluence-text-subtle mb-6">
        <Link href="/" className="hover:text-confluence-blue">Platform Engineering</Link>
        <span>/</span>
        <span className="text-confluence-text font-medium">Trusted Search</span>
      </div>

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 bg-confluence-blue rounded-lg flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-confluence-text">Rovo Trusted Search</h1>
          <p className="text-xs text-confluence-text-subtle">Answers with confidence scores, source citations, and conflict detection</p>
        </div>
      </div>

      {/* Search input */}
      <form
        onSubmit={(e) => { e.preventDefault(); handleSearch(); }}
        className="relative mb-6"
      >
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-confluence-text-subtle" />
        <input
          ref={inputRef}
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder="Ask a question about your knowledge base..."
          className="w-full border border-confluence-border rounded-lg pl-11 pr-24 py-3 text-sm text-confluence-text placeholder-confluence-text-subtle outline-none focus:border-confluence-blue focus:ring-2 focus:ring-confluence-blue/20 transition-all"
        />
        <button
          type="submit"
          disabled={loading}
          className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5 bg-confluence-blue text-white text-sm font-medium px-3 py-1.5 rounded hover:bg-confluence-blue-hover transition-colors disabled:opacity-60"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Ask AI
        </button>
      </form>

      {/* Suggested queries */}
      {!result && !loading && (
        <div className="mb-6">
          <p className="text-xs text-confluence-text-subtle font-medium mb-2">Try asking:</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED.map(({ label }) => (
              <button
                key={label}
                onClick={() => { setInputVal(label); handleSearch(label); }}
                className="text-xs text-confluence-blue border border-confluence-blue/30 bg-confluence-blue-light hover:bg-blue-100 px-3 py-1.5 rounded-full transition-colors"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="border border-confluence-border rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-5 h-5 bg-confluence-blue rounded flex items-center justify-center animate-pulse">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm text-confluence-text-subtle animate-pulse">Analysing knowledge base…</span>
          </div>
          <div className="space-y-2">
            {[80, 60, 90, 50].map((w, i) => (
              <div key={i} className={`h-3 bg-gray-100 rounded animate-pulse`} style={{ width: `${w}%` }} />
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="border border-red-200 bg-red-50 rounded-lg p-4 text-sm text-red-700 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {/* Result card */}
      {result && conf && ConfIcon && (
        <div className="space-y-4">
          {/* Query echo */}
          <div className="text-xs text-confluence-text-subtle">
            Results for: <span className="font-medium text-confluence-text">"{query}"</span>
            <button onClick={() => { setResult(null); setInputVal(""); inputRef.current?.focus(); }} className="ml-3 text-confluence-blue hover:underline flex-inline items-center gap-1">
              <RotateCcw className="w-3 h-3 inline" /> New search
            </button>
          </div>

          {/* Answer card */}
          <div className="border border-confluence-border rounded-lg overflow-hidden shadow-sm">
            {/* Confidence header */}
            <div className={`flex items-center gap-2 px-4 py-2.5 border-b border-confluence-border ${conf.bg}`}>
              <ConfIcon className={`w-4 h-4 ${conf.color}`} />
              <span className={`text-sm font-semibold ${conf.color}`}>{conf.label}</span>
              <span className="text-xs text-confluence-text-subtle ml-1">— {result.confidenceReason}</span>
            </div>

            {/* Answer body */}
            <div className="px-5 py-4">
              <p className="text-sm text-confluence-text leading-relaxed">{result.answer}</p>
            </div>

            {/* Conflict warning */}
            {result.conflicts.length > 0 && (
              <div className="mx-4 mb-4 border border-red-200 bg-red-50 rounded-lg px-4 py-3">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <span className="text-sm font-semibold text-red-700">Conflicting sources detected</span>
                </div>
                {result.conflicts.map((c, i) => (
                  <div key={i} className="text-xs text-red-600 mb-2">
                    <p className="mb-1.5">{c.summary}</p>
                    <div className="flex gap-2 flex-wrap">
                      <Link href={`/document/${c.docA.id}`} className="underline font-medium hover:text-red-800">{c.docA.title}</Link>
                      <span>vs</span>
                      <Link href={`/document/${c.docB.id}`} className="underline font-medium hover:text-red-800">{c.docB.title}</Link>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Sources */}
            {result.sources.length > 0 && (
              <div className="border-t border-confluence-border px-4 py-3">
                <p className="text-xs font-semibold text-confluence-text-subtle uppercase tracking-wide mb-2">Sources</p>
                <div className="space-y-2">
                  {result.sources.map((src) => {
                    const freshConf = freshnessConfig[src.freshness];
                    return (
                      <Link
                        key={src.id}
                        href={`/document/${src.id}`}
                        className="flex items-start gap-3 group hover:bg-confluence-surface-overlay rounded-lg p-2 -mx-2 transition-colors"
                      >
                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded shrink-0 mt-0.5 ${
                          src.trustScore >= 80 ? "bg-confluence-green-light text-green-800" :
                          src.trustScore >= 50 ? "bg-amber-100 text-amber-800" :
                          "bg-red-100 text-red-800"
                        }`}>
                          {src.trustScore}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-confluence-blue group-hover:underline font-medium truncate">
                              {src.title}
                            </span>
                            <span className={`text-xs ${freshConf.color} shrink-0`}>· {freshConf.label}</span>
                          </div>
                          <p className="text-xs text-confluence-text-subtle mt-0.5">{src.relevance}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-confluence-text-subtle shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recommended action */}
            {result.recommendedAction && (
              <div className="border-t border-confluence-border px-4 py-3 bg-confluence-blue-light/50">
                <p className="text-xs font-semibold text-confluence-text-subtle uppercase tracking-wide mb-1">Recommended Action</p>
                <p className="text-sm text-confluence-text">{result.recommendedAction}</p>
              </div>
            )}

            {/* People to ask */}
            {result.peopleToAsk.length > 0 && (
              <div className="border-t border-confluence-border px-4 py-3">
                <p className="text-xs font-semibold text-confluence-text-subtle uppercase tracking-wide mb-2">People to Ask</p>
                <div className="flex flex-wrap gap-2">
                  {result.peopleToAsk.map((person) => (
                    <span key={person} className="flex items-center gap-1.5 text-xs border border-confluence-border rounded-full px-3 py-1 bg-white">
                      <User className="w-3 h-3 text-confluence-text-subtle" />
                      {person}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="border-t border-confluence-border px-4 py-2 bg-confluence-surface-overlay flex items-center justify-between">
              <span className="text-xs text-confluence-text-subtle">
                ✦ Answered by Atlassian Intelligence <span className="border border-confluence-blue/30 text-confluence-blue text-xs px-1.5 py-0.5 rounded ml-1">BETA</span>
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-confluence-text-subtle">Was this helpful?</span>
                <button className="text-confluence-text-subtle hover:text-confluence-green transition-colors"><ThumbsUp className="w-3.5 h-3.5" /></button>
                <button className="text-confluence-text-subtle hover:text-confluence-red transition-colors"><ThumbsDown className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-8 text-confluence-text-subtle text-sm">Loading search…</div>}>
      <SearchContent />
    </Suspense>
  );
}
