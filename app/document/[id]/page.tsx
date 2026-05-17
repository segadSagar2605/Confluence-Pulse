import { notFound } from "next/navigation";
import Link from "next/link";
import { getDocumentById, DOCUMENTS } from "@/lib/data/documents";
import { trustBgColor, trustLabel, lifecycleBadgeColor, lifecycleLabel, formatDate, monthsAgo } from "@/lib/utils";
import TrustScoreBar from "@/components/document/TrustScoreBar";
import DocumentContent from "@/components/document/DocumentContent";
import StewardPanel from "@/components/document/StewardPanel";
import DecisionCards from "@/components/document/DecisionCards";
import {
  Eye, Clock, User,
  GitBranch, ExternalLink, ChevronRight,
} from "lucide-react";

export function generateStaticParams() {
  return DOCUMENTS.map((d) => ({ id: d.id }));
}

export default async function DocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const doc = getDocumentById(id);
  if (!doc) notFound();

  const conflictingDocs = doc.conflictsWith.map((cid) => getDocumentById(cid)).filter(Boolean);
  const relatedDocs = doc.relatedDocIds.map((rid) => getDocumentById(rid)).filter(Boolean);

  const staleness = monthsAgo(doc.lastUpdated);

  return (
    <div className="flex h-full">
      {/* Main content area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-8 py-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-sm text-confluence-text-subtle mb-4 flex-wrap">
            <Link href="/" className="hover:text-confluence-blue">Platform Engineering</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href="/library" className="hover:text-confluence-blue">Knowledge Library</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-confluence-text font-medium truncate">{doc.title}</span>
          </div>

          {/* Page title */}
          <h1 className="text-2xl font-semibold text-confluence-text mb-3 leading-tight">{doc.title}</h1>

          {/* Page meta row — Confluence style */}
          <div className="flex items-center gap-4 text-xs text-confluence-text-subtle mb-4 flex-wrap border-b border-confluence-border pb-4">
            <span className="flex items-center gap-1">
              <User className="w-3.5 h-3.5" />
              Created by <span className="text-confluence-text font-medium ml-1">{doc.createdBy}</span>
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              Last updated {formatDate(doc.lastUpdated)}
              {staleness > 12 && (
                <span className="ml-1 text-red-500 font-medium">({staleness} months ago)</span>
              )}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              {doc.viewCount.toLocaleString()} views
            </span>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${lifecycleBadgeColor(doc.lifecycleState)}`}>
              {lifecycleLabel(doc.lifecycleState)}
            </span>
            {doc.linkedJira.length > 0 && (
              <span className="flex items-center gap-1 text-confluence-blue">
                <GitBranch className="w-3.5 h-3.5" />
                {doc.linkedJira.length} Jira link{doc.linkedJira.length > 1 ? "s" : ""}
              </span>
            )}
          </div>

          {/* ✨ NEW: Trust Score bar — this doesn't exist in Confluence today */}
          <TrustScoreBar doc={doc} />

          {/* Page content */}
          <DocumentContent content={doc.content} />

          {/* Decision cards if present */}
          {doc.decisions.length > 0 && (
            <div className="mt-8">
              <h2 className="text-base font-semibold text-confluence-text mb-3 flex items-center gap-2">
                <span className="w-5 h-5 bg-confluence-purple-light rounded flex items-center justify-center text-xs text-confluence-purple">D</span>
                Extracted Decisions
              </h2>
              <DecisionCards decisions={doc.decisions} />
            </div>
          )}

          {/* Related pages */}
          {relatedDocs.length > 0 && (
            <div className="mt-8 border-t border-confluence-border pt-6">
              <h3 className="text-sm font-semibold text-confluence-text mb-3">Related Pages</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {relatedDocs.map((rd) => rd && (
                  <Link
                    key={rd.id}
                    href={`/document/${rd.id}`}
                    className="flex items-center gap-3 border border-confluence-border rounded-lg px-3 py-2.5 hover:border-confluence-blue hover:bg-confluence-blue-light transition-colors group"
                  >
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${trustBgColor(rd.trustScore)}`}>
                      {rd.trustScore}
                    </span>
                    <span className="text-sm text-confluence-text group-hover:text-confluence-blue font-medium truncate">
                      {rd.title}
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 text-confluence-text-subtle ml-auto shrink-0" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ✨ NEW: Steward panel — slides in from right, Confluence AI panel style */}
      <StewardPanel doc={doc} />
    </div>
  );
}
