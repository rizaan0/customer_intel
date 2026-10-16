"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { weekLabel } from "@/lib/weeks";

type NavItem = {
  href: string;
  label: string;
  icon: (active: boolean) => ReactNode;
};

const MAIN_LINKS: NavItem[] = [
  {
    href: "/briefing",
    label: "Overview",
    icon: (active) => (
      <svg className={`h-4 w-4 ${active ? "text-white" : "text-stone-500"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="7" height="9" x="3" y="3" rx="1" />
        <rect width="7" height="5" x="14" y="3" rx="1" />
        <rect width="7" height="9" x="14" y="12" rx="1" />
        <rect width="7" height="5" x="3" y="16" rx="1" />
      </svg>
    ),
  },
  {
    href: "/briefing/complaints",
    label: "Complaints Explorer",
    icon: (active) => (
      <svg className={`h-4 w-4 ${active ? "text-white" : "text-stone-500"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m21 21-4.3-4.3" />
        <circle cx="11" cy="11" r="8" />
      </svg>
    ),
  },
];

const ANALYTICS_LINKS: NavItem[] = [
  {
    href: "/briefing/trend",
    label: "Issue Trends",
    icon: (active) => (
      <svg className={`h-4 w-4 ${active ? "text-white" : "text-stone-500"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v18h18" />
        <path d="m19 9-5 5-4-4-3 3" />
      </svg>
    ),
  },
  {
    href: "/briefing/share",
    label: "Complaint Share",
    icon: (active) => (
      <svg className={`h-4 w-4 ${active ? "text-white" : "text-stone-500"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" x2="18" y1="20" y2="10" />
        <line x1="12" x2="12" y1="20" y2="4" />
        <line x1="6" x2="6" y1="20" y2="14" />
      </svg>
    ),
  },
  {
    href: "/briefing/lift",
    label: "Lift Analysis",
    icon: (active) => (
      <svg className={`h-4 w-4 ${active ? "text-white" : "text-stone-500"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
        <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
        <path d="M7 21h10" />
        <path d="M12 3v18" />
        <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" />
      </svg>
    ),
  },
  {
    href: "/briefing/concentration",
    label: "Concentration",
    icon: (active) => (
      <svg className={`h-4 w-4 ${active ? "text-white" : "text-stone-500"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="18" height="18" x="3" y="3" rx="2" />
        <path d="M3 9h18" />
        <path d="M3 15h18" />
        <path d="M9 3v18" />
        <path d="M15 3v18" />
      </svg>
    ),
  },
  {
    href: "/briefing/sentiment",
    label: "Sentiment & Severity",
    icon: (active) => (
      <svg className={`h-4 w-4 ${active ? "text-white" : "text-stone-500"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M8 14s1.5 2 4 2 4-2 4-2" />
        <line x1="9" x2="9.01" y1="9" y2="9" />
        <line x1="15" x2="15.01" y1="9" y2="9" />
      </svg>
    ),
  },
];

export function BriefingNav({
  evidence,
  datasetStats,
}: {
  evidence: { slug: string; issue: string; current: number }[];
  datasetStats?: { complaints: number; orders: number; latestWeek: string };
}) {
  const pathname = usePathname();

  return (
    <aside className="w-full shrink-0 md:w-64">
      <nav className="sticky top-20 flex flex-col gap-6">
        {/* Workspace section */}
        <div>
          <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-stone-400">Workspace</p>
          <div className="mt-2 flex flex-col gap-1">
            {MAIN_LINKS.map((link) => (
              <NavLink key={link.href} href={link.href} active={isActive(pathname, link.href)} icon={link.icon(isActive(pathname, link.href))}>
                {link.label}
              </NavLink>
            ))}
          </div>
        </div>

        {/* Analytics Section */}
        <div>
          <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-stone-400">Deep Analytics</p>
          <div className="mt-2 flex flex-col gap-1">
            {ANALYTICS_LINKS.map((link) => (
              <NavLink key={link.href} href={link.href} active={isActive(pathname, link.href)} icon={link.icon(isActive(pathname, link.href))}>
                {link.label}
              </NavLink>
            ))}
          </div>
        </div>

        {/* Active Investigations Section */}
        {evidence.length > 0 ? (
          <div>
            <div className="flex items-center justify-between px-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">Investigations</p>
              <span className="inline-flex h-4 items-center justify-center rounded-full bg-rose-50 px-1.5 text-[10px] font-bold text-rose-700 ring-1 ring-inset ring-rose-600/20">
                {evidence.length}
              </span>
            </div>
            <div className="mt-2 flex flex-col gap-1">
              {evidence.map((item) => {
                const target = `/briefing/evidence/${item.slug}`;
                const active = pathname === target;
                return (
                  <Link
                    key={item.slug}
                    href={target}
                    className={`group flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-all ${
                      active
                        ? "bg-stone-900 text-white shadow-sm"
                        : "text-stone-700 hover:bg-stone-100 hover:text-stone-950"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-rose-400" : "bg-rose-500"}`} />
                      <span className="capitalize truncate">{item.issue}</span>
                    </div>
                    <span className={`text-[11px] ${active ? "text-stone-300" : "text-stone-400 font-mono"}`}>
                      {item.current}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        ) : null}

        {/* Dataset telemetry pill */}
        {datasetStats ? (
          <div className="rounded-xl border border-stone-200/80 bg-white p-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-stone-500">Active Scope</span>
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Verified
              </span>
            </div>
            <p className="mt-1 text-xs font-semibold text-stone-900">
              {datasetStats.latestWeek ? weekLabel(datasetStats.latestWeek) : "All time"}
            </p>
            <div className="mt-2.5 flex items-center justify-between border-t border-stone-100 pt-2 text-[11px] text-stone-600">
              <span>{datasetStats.complaints} complaints</span>
              <span className="text-stone-300">•</span>
              <span>{datasetStats.orders} orders</span>
            </div>
          </div>
        ) : null}
      </nav>
    </aside>
  );
}

function NavLink({
  href,
  active,
  icon,
  children,
}: {
  href: string;
  active: boolean;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`group flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium transition-all ${
        active
          ? "bg-stone-900 text-white shadow-sm"
          : "text-stone-700 hover:bg-stone-100 hover:text-stone-950"
      }`}
    >
      {icon}
      <span className="truncate">{children}</span>
    </Link>
  );
}

function isActive(pathname: string, href: string): boolean {
  if (href === "/briefing") return pathname === "/briefing";
  return pathname === href;
}
