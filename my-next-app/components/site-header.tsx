"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function SiteHeader() {
  const pathname = usePathname();
  const isMarketing = pathname === "/";

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200/80 bg-white/85 backdrop-blur-md transition-colors print:hidden">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-3.5">
        <Link href="/" className="group flex items-center gap-3 transition-opacity hover:opacity-90">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-stone-900 text-white shadow-sm ring-1 ring-stone-950/10">
            <svg
              className="h-4 w-4 text-emerald-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 3v18h18" />
              <path d="m19 9-5 5-4-4-3 3" />
            </svg>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold tracking-tight text-stone-950">Customer Complaint Intelligence</span>
              <span className="inline-flex items-center rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-800 ring-1 ring-inset ring-emerald-600/20">
                Live
              </span>
            </div>
            <span className="text-[11px] font-medium text-stone-500">
              {isMarketing ? "Operations Pattern Discovery Platform" : "Root Cause Investigation Workspace"}
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-1.5 text-sm">
          {isMarketing ? (
            <>
              <a
                href="#workflow"
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-950"
              >
                Workflow
              </a>
              <a
                href="#preview"
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-950"
              >
                Live Preview
              </a>
              <div className="mx-1 h-4 w-px bg-stone-200" />
              <Link
                href="/briefing"
                className="inline-flex items-center gap-1.5 rounded-lg bg-stone-900 px-3.5 py-1.5 text-xs font-medium text-white shadow-sm transition-all hover:bg-stone-800"
              >
                <span>Enter Workspace</span>
                <span className="text-stone-400">→</span>
              </Link>
              <Link
                href="/settings"
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-950"
              >
                Settings
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/briefing"
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  pathname.startsWith("/briefing")
                    ? "bg-stone-900 text-white shadow-sm"
                    : "text-stone-600 hover:bg-stone-100 hover:text-stone-950"
                }`}
              >
                Briefing
              </Link>
              <Link
                href="/upload"
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  pathname === "/upload"
                    ? "bg-stone-900 text-white shadow-sm"
                    : "text-stone-600 hover:bg-stone-100 hover:text-stone-950"
                }`}
              >
                Upload
              </Link>
              <Link
                href="/settings"
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  pathname === "/settings"
                    ? "bg-stone-900 text-white shadow-sm"
                    : "text-stone-600 hover:bg-stone-100 hover:text-stone-950"
                }`}
              >
                Settings
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
