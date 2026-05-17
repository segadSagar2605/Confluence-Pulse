import { Decision } from "@/lib/data/documents";
import { formatDate } from "@/lib/utils";
import { User, Calendar, GitBranch, CheckCircle2, Clock, RefreshCw } from "lucide-react";

interface Props { decisions: Decision[] }

const statusConfig = {
  active: { label: "Active", color: "bg-confluence-green-light text-green-800" },
  superseded: { label: "Superseded", color: "bg-gray-100 text-gray-600" },
  "under-review": { label: "Under Review", color: "bg-confluence-yellow-light text-amber-800" },
};

export default function DecisionCards({ decisions }: Props) {
  return (
    <div className="space-y-3">
      {decisions.map((dec) => {
        const status = statusConfig[dec.status];
        return (
          <div key={dec.id} className="border border-confluence-purple/30 bg-confluence-purple-light/20 rounded-lg px-4 py-4">
            <div className="flex items-start justify-between gap-3 mb-2">
              <h3 className="text-sm font-semibold text-confluence-text">{dec.title}</h3>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${status.color}`}>
                {status.label}
              </span>
            </div>

            <p className="text-sm text-confluence-text-subtle mb-3">{dec.summary}</p>

            <div className="bg-white/70 rounded border border-confluence-border/60 px-3 py-2 mb-3">
              <div className="text-xs font-semibold text-confluence-text-subtle uppercase tracking-wide mb-1">Rationale</div>
              <p className="text-sm text-confluence-text">{dec.rationale}</p>
            </div>

            {dec.alternativesConsidered.length > 0 && (
              <div className="mb-3">
                <div className="text-xs font-semibold text-confluence-text-subtle uppercase tracking-wide mb-1">
                  Alternatives Considered & Rejected
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {dec.alternativesConsidered.map((alt) => (
                    <span key={alt} className="text-xs bg-gray-100 text-confluence-text-subtle px-2 py-0.5 rounded line-through">
                      {alt}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-4 flex-wrap text-xs text-confluence-text-subtle">
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" /> {dec.owner}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Decided {formatDate(dec.dateDecided)}
              </span>
              <span className="flex items-center gap-1">
                <RefreshCw className="w-3 h-3" /> Review by {dec.reviewDate}
              </span>
              {dec.linkedJira.length > 0 && (
                <span className="flex items-center gap-1 text-confluence-blue">
                  <GitBranch className="w-3 h-3" /> {dec.linkedJira.join(", ")}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
