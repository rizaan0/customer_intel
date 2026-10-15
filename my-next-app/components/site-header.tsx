"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function SiteHeader() {
  const pathname = usePathname();
  const marketing = pathname === "/";

  return (
    <header className="border-b border-stone-200 bg-white print:hidden">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
        <Link href="/" className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-stone-500">
            {marketing ? "Complaint intelligence" : "Operations briefing"}
          </p>
          <p className="text-lg font-semibold text-stone-900">Customer Complaint Intelligence</p>
        </Link>
        <nav className="flex flex-wrap gap-1 text-sm">
          {marketing ? (
            <>
              <a className="rounded-full px-3 py-1.5 text-stone-700 hover:bg-stone-100" href="#problem">
                Problem
              </a>
              <a className="rounded-full px-3 py-1.5 text-stone-700 hover:bg-stone-100" href="#how">
                How it works
              </a>
              <a className="rounded-full px-3 py-1.5 text-stone-700 hover:bg-stone-100" href="#sources">
                Sources
              </a>
              <a className="rounded-full px-3 py-1.5 text-stone-700 hover:bg-stone-100" href="#who">
                Who it is for
              </a>
              <Link className="rounded-full bg-stone-900 px-3 py-1.5 text-white" href="/briefing">
                Sample briefing
              </Link>
              <Link className="rounded-full px-3 py-1.5 text-stone-700 hover:bg-stone-100" href="/settings">
                Settings
              </Link>
            </>
          ) : (
            <>
              <Link className="rounded-full px-3 py-1.5 text-stone-700 hover:bg-stone-100" href="/briefing">
                Briefing
              </Link>
              <Link className="rounded-full px-3 py-1.5 text-stone-700 hover:bg-stone-100" href="/upload">
                Upload
              </Link>
              <Link className="rounded-full px-3 py-1.5 text-stone-700 hover:bg-stone-100" href="/settings">
                Settings
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
