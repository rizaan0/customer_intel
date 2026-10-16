"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function SiteHeader() {
  const pathname = usePathname();
  const isMarketing = pathname === "/";

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200 bg-white print:hidden">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <Link href="/" className="group flex min-w-0 items-center gap-3 hover:opacity-90">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-stone-900 text-white shadow-sm ring-1 ring-stone-950/10">
            <svg
              aria-hidden="true"
              className="size-4 text-emerald-400"
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
          <div className="flex min-w-0 flex-col">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-semibold text-stone-950">Customer Complaint Intelligence</span>
            </div>
          </div>
        </Link>

        <nav aria-label="Site" className="flex items-center gap-1 overflow-x-auto text-sm">
          {isMarketing ? (
            <>
              <Link
                href="/briefing"
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-stone-900 px-3.5 py-2 text-xs font-medium text-white shadow-sm hover:bg-stone-800"
              >
                <span>Open briefing</span>
                <span aria-hidden="true" className="text-stone-400">→</span>
              </Link>
              <Link
                href="/settings"
                className="shrink-0 rounded-lg px-3 py-2 text-xs font-medium text-stone-600 hover:bg-stone-100 hover:text-stone-950"
              >
                Settings
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/briefing"
                aria-current={pathname.startsWith("/briefing") ? "page" : undefined}
                className={`shrink-0 rounded-lg px-3 py-2 text-xs font-medium ${
                  pathname.startsWith("/briefing")
                    ? "bg-stone-900 text-white shadow-sm"
                    : "text-stone-600 hover:bg-stone-100 hover:text-stone-950"
                }`}
              >
                Briefing
              </Link>
              <Link
                href="/upload"
                aria-current={pathname === "/upload" ? "page" : undefined}
                className={`shrink-0 rounded-lg px-3 py-2 text-xs font-medium ${
                  pathname === "/upload"
                    ? "bg-stone-900 text-white shadow-sm"
                    : "text-stone-600 hover:bg-stone-100 hover:text-stone-950"
                }`}
              >
                Upload
              </Link>
              <Link
                href="/settings"
                aria-current={pathname === "/settings" ? "page" : undefined}
                className={`shrink-0 rounded-lg px-3 py-2 text-xs font-medium ${
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
