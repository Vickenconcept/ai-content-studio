"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clearToken, getToken } from "@/lib/auth";

const navItems = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/generate", label: "Generate" },
  { href: "/dashboard/document-summarizer", label: "Document Summarizer" },
  { href: "/dashboard/strategy-builder", label: "Strategy Builder" },
  { href: "/dashboard/course-companion", label: "Course Companion" },
  { href: "/dashboard/pdf-chat", label: "PDF Chat" },
  { href: "/dashboard/sources", label: "Sources" },
  { href: "/dashboard/outputs", label: "Library" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
    }
  }, [router]);

  function renderNav(isCollapsed: boolean, closeOnNavigate = false) {
    return (
      <nav className="mt-8 space-y-2">
        {navItems.map((item) => {
          const active = item.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(item.href);

          const badgeText = item.label.slice(0, 2).toUpperCase();

          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => {
                if (closeOnNavigate) {
                  setIsMobileOpen(false);
                }
              }}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                active ? "bg-cyan-300/20 text-cyan-100" : "text-white/75 hover:bg-white/10"
              }`}
              title={item.label}
            >
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-white/20 text-[10px] font-semibold">
                {badgeText}
              </span>
              {!isCollapsed ? <span>{item.label}</span> : null}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <div className="min-h-screen bg-[#081421] text-white">
      <div className="flex min-h-screen">
        <aside
          className={`fixed inset-y-0 left-0 z-40 hidden border-r border-white/10 bg-[linear-gradient(180deg,#10263a_0%,#0b1b2d_100%)] transition-all duration-300 lg:flex lg:flex-col ${
            isDesktopCollapsed ? "w-20 p-3" : "w-72 p-6"
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className={isDesktopCollapsed ? "hidden" : "block"}>
              <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">Content Studio</p>
              <h2 className="mt-3 text-xl font-semibold">Document-to-Market Engine</h2>
              <p className="mt-2 text-sm text-white/70">Turn static documents into sellable marketing assets.</p>
            </div>

            <button
              type="button"
              onClick={() => setIsDesktopCollapsed((v) => !v)}
              className="rounded-lg border border-white/20 px-2 py-1 text-xs text-white/80 hover:bg-white/10"
              title={isDesktopCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isDesktopCollapsed ? ">" : "<"}
            </button>
          </div>

          {renderNav(isDesktopCollapsed, false)}

          <button
            type="button"
            onClick={() => {
              clearToken();
              router.push("/login");
            }}
            className={`mt-auto rounded-lg border border-white/20 px-3 py-2 text-sm text-white/80 hover:bg-white/10 ${isDesktopCollapsed ? "px-2 text-xs" : ""}`}
            title="Sign out"
          >
            {isDesktopCollapsed ? "Out" : "Sign out"}
          </button>
        </aside>

        <div
          className={`fixed inset-0 z-40 bg-black/60 transition-opacity duration-300 lg:hidden ${
            isMobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
          onClick={() => setIsMobileOpen(false)}
        />

        <aside
          className={`fixed inset-y-0 left-0 z-50 w-72 border-r border-white/10 bg-[linear-gradient(180deg,#10263a_0%,#0b1b2d_100%)] p-6 transition-transform duration-300 lg:hidden ${
            isMobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">Content Studio</p>
              <h2 className="mt-3 text-xl font-semibold">Document-to-Market Engine</h2>
            </div>
            <button
              type="button"
              onClick={() => setIsMobileOpen(false)}
              className="rounded-lg border border-white/20 px-2 py-1 text-xs text-white/80 hover:bg-white/10"
            >
              X
            </button>
          </div>

          {renderNav(false, true)}

          <button
            type="button"
            onClick={() => {
              clearToken();
              router.push("/login");
            }}
            className="mt-10 rounded-lg border border-white/20 px-3 py-2 text-sm text-white/80 hover:bg-white/10"
          >
            Sign out
          </button>
        </aside>

        <div className={`flex min-h-screen flex-1 flex-col transition-[margin] duration-300 ${isDesktopCollapsed ? "lg:ml-20" : "lg:ml-72"}`}>
          <header className="sticky top-0 z-30 border-b border-white/10 bg-[#081421]/95 px-4 py-3 backdrop-blur lg:px-6">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsMobileOpen(true)}
                className="rounded-lg border border-white/20 px-3 py-2 text-xs text-white/80 hover:bg-white/10 lg:hidden"
              >
                Menu
              </button>
              <p className="text-xs uppercase tracking-[0.18em] text-white/60">Content Studio Workspace</p>
            </div>
          </header>

          <section className="p-6 lg:p-10">{children}</section>
        </div>
      </div>
    </div>
  );
}
