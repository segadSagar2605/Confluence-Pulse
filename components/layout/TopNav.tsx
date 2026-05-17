"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search, Bell, HelpCircle, ChevronDown, Plus, LayoutGrid,
  Sparkles,
} from "lucide-react";

export default function TopNav() {
  const router = useRouter();
  const [searchVal, setSearchVal] = useState("");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchVal.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchVal.trim())}`);
      setSearchVal("");
    }
  }

  return (
    <header className="h-12 bg-confluence-nav flex items-center px-3 gap-2 shrink-0 z-50 fixed top-0 left-0 right-0">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 mr-2 shrink-0">
        <div className="w-7 h-7 bg-white rounded flex items-center justify-center">
          <LayoutGrid className="w-4 h-4 text-confluence-blue" />
        </div>
        <span className="text-white font-semibold text-sm tracking-tight hidden sm:block">Confluence</span>
      </Link>

      {/* Nav links */}
      <nav className="hidden md:flex items-center gap-1">
        {[
          { label: "Home", href: "/" },
          { label: "Recent", href: "/" },
          { label: "Spaces", href: "/" },
          { label: "Teams", href: "/" },
          { label: "Apps", href: "/" },
          { label: "Templates", href: "/" },
        ].map(({ label, href }) => (
          <Link
            key={label}
            href={href}
            className="text-white/90 hover:text-white hover:bg-white/10 px-3 py-1.5 rounded text-sm font-medium flex items-center gap-1 transition-colors"
          >
            {label}
            {(label === "Recent" || label === "Spaces" || label === "Apps") && (
              <ChevronDown className="w-3 h-3 opacity-70" />
            )}
          </Link>
        ))}
      </nav>

      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex-1 max-w-xl mx-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
          <input
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            placeholder="Search Confluence..."
            className="w-full bg-white/15 hover:bg-white/20 focus:bg-white text-white focus:text-confluence-text placeholder-white/60 focus:placeholder-confluence-text-subtle rounded pl-9 pr-3 py-1.5 text-sm outline-none transition-colors focus:shadow-md"
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <span className="text-white/40 text-xs hidden lg:flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Ask AI
            </span>
          </div>
        </div>
      </form>

      {/* Right actions */}
      <div className="flex items-center gap-1 ml-auto">
        <Link
          href="/search"
          className="flex items-center gap-1.5 bg-white text-confluence-blue hover:bg-confluence-blue-light text-sm font-medium px-3 py-1.5 rounded transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden sm:block">Ask AI</span>
        </Link>
        <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-white/10 text-white/80 hover:text-white transition-colors">
          <Bell className="w-4 h-4" />
        </button>
        <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-white/10 text-white/80 hover:text-white transition-colors">
          <HelpCircle className="w-4 h-4" />
        </button>
        <button className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs font-semibold ml-1">
          TN
        </button>
      </div>
    </header>
  );
}
