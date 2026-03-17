"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { clearToken, getToken } from "@/lib/auth";

const navItems = [
  { href: "/dashboard", label: "Generator" },
  { href: "/dashboard", label: "Sources" },
  { href: "/dashboard", label: "Outputs" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-[#081421] text-white">
      <div className="mx-auto grid min-h-screen max-w-[1500px] grid-cols-1 lg:grid-cols-[280px_1fr]">
        <aside className="border-r border-white/10 bg-[linear-gradient(180deg,#10263a_0%,#0b1b2d_100%)] p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-sky-300">Content Studio</p>
          <h2 className="mt-3 text-2xl font-semibold">Document-to-Market Engine</h2>
          <p className="mt-2 text-sm text-white/70">Problem solved: turn static documents into sellable marketing assets in minutes.</p>

          <nav className="mt-8 space-y-2">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`block rounded-lg px-3 py-2 text-sm transition ${
                    active ? "bg-sky-400/20 text-sky-200" : "text-white/75 hover:bg-white/10"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

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

        <section className="p-6 lg:p-10">{children}</section>
      </div>
    </div>
  );
}
