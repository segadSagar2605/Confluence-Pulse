"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronRight, ChevronDown, FileText, Settings,
  BarChart3, Network, ShieldCheck, AlertTriangle,
} from "lucide-react";
import { useState } from "react";
import { DOCUMENTS } from "@/lib/data/documents";

// Returns a CSS hex color — explicit style prop guarantees round rendering on all DPIs
const trustDotColor = (score: number): string => {
  if (score >= 80) return "#36B37E";  // green
  if (score >= 50) return "#FF991F";  // amber
  return "#DE350B";                   // red — only for genuine stale/critical
};

export default function Sidebar() {
  const pathname = usePathname();
  const [pagesOpen, setPagesOpen] = useState(true);

  const spaceNav = [
    { label: "Space Health", href: "/", icon: BarChart3 },
    { label: "Knowledge Library", href: "/library", icon: FileText },
    { label: "Trusted Search", href: "/search", icon: ShieldCheck },
    { label: "Decision Intelligence", href: "/decisions", icon: Network },
    { label: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <aside className="w-60 bg-confluence-sidebar border-r border-confluence-border flex flex-col shrink-0 overflow-hidden">
      {/* Space header */}
      <div className="px-4 py-4 border-b border-confluence-border shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-confluence-blue rounded flex items-center justify-center text-white text-xs font-bold">
            PE
          </div>
          <div>
            <div className="font-semibold text-confluence-text text-sm leading-tight">Platform Engineering</div>
            <div className="text-confluence-text-subtle text-xs">Space</div>
          </div>
        </div>
      </div>

      {/* Nav — owns the scroll so aside width stays stable */}
      <nav className="flex-1 flex flex-col py-2 overflow-y-auto">
        {spaceNav.map(({ label, href, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              style={{ display: "flex", width: "100%", boxSizing: "border-box" }}
              className={`items-center gap-2.5 px-4 py-2 text-sm transition-colors ${
                active
                  ? "bg-confluence-blue-light text-confluence-blue font-semibold"
                  : "text-confluence-text hover:bg-confluence-surface-overlay hover:text-confluence-text"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          );
        })}

        {/* Pages section header — direct child of nav */}
        <button
          onClick={() => setPagesOpen(!pagesOpen)}
          className="flex items-center gap-1.5 px-4 py-1.5 mt-3 text-left text-xs font-semibold text-confluence-text-subtle uppercase tracking-wide hover:text-confluence-text transition-colors"
        >
          {pagesOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          Pages
        </button>

        {/* Page items — direct children of nav, same level as nav Links */}
        {pagesOpen && DOCUMENTS.map((doc) => {
          const active = pathname === `/document/${doc.id}`;
          return (
            <Link
              key={doc.id}
              href={`/document/${doc.id}`}
              style={{ display: "flex", width: "100%", boxSizing: "border-box" }}
              className={`items-center gap-2.5 px-4 py-2 text-sm transition-colors group ${
                active
                  ? "bg-confluence-blue-light text-confluence-blue"
                  : "text-confluence-text hover:bg-confluence-surface-overlay"
              }`}
            >
              <FileText className="w-4 h-4 shrink-0" style={{ color: trustDotColor(doc.trustScore) }} />
              <span className="truncate flex-1">{doc.title}</span>
              {doc.stewardFlags.length > 0 && (
                <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0 ml-auto opacity-0 group-hover:opacity-100" />
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
