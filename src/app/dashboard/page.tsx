"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, ContentOverviewResponse } from "@/lib/api-client";

export default function DashboardPage() {
  const [overview, setOverview] = useState<ContentOverviewResponse["data"] | null>(null);
  const [sourceCount, setSourceCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadOverview() {
      setError(null);
      try {
        const [overviewRes, docsRes] = await Promise.all([
          api.getContentOverview(),
          api.getDocuments(),
        ]);
        setOverview(overviewRes.data);
        setSourceCount(docsRes.pagination?.total ?? docsRes.data.length);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load dashboard analytics");
      }
    }

    loadOverview();
  }, []);

  const totals = overview?.totals;

  return (
    <div className="space-y-8">
      <header className="rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_20%_20%,#2f6e71_0%,#1b2d4c_50%,#111a2d_100%)] p-6 shadow-lg">
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">Overview</p>
        <h1 className="mt-2 text-3xl font-semibold">Content Studio Analytics</h1>
        <p className="mt-2 max-w-3xl text-sm text-white/85">
          Monitor what is happening across generation runs, output volume, and image production. Use this page as your command center.
        </p>
      </header>

      {error ? <p className="text-sm text-rose-300">{error}</p> : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-cyan-100">Total Runs</p>
          <p className="mt-2 text-3xl font-semibold">{totals?.runs ?? 0}</p>
        </article>
        <article className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-emerald-100">Outputs Generated</p>
          <p className="mt-2 text-3xl font-semibold">{totals?.outputs ?? 0}</p>
        </article>
        <article className="rounded-2xl border border-fuchsia-300/20 bg-fuchsia-300/10 p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-fuchsia-100">AI Images</p>
          <p className="mt-2 text-3xl font-semibold">{totals?.images ?? 0}</p>
        </article>
        <article className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-amber-100">Source Documents</p>
          <p className="mt-2 text-3xl font-semibold">{sourceCount}</p>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <article className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Recent Runs</h2>
            <Link href="/dashboard/outputs" className="text-sm text-cyan-200 underline">
              Open library
            </Link>
          </div>

          {overview?.recent_runs.length ? (
            <ul className="mt-4 space-y-3">
              {overview.recent_runs.map((run) => (
                <li key={run.id} className="rounded-xl border border-white/10 bg-black/25 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="max-w-[65%] truncate text-sm font-medium">{run.title}</p>
                    <Link href={`/dashboard/outputs/${run.id}`} className="text-xs text-cyan-200 underline">
                      Open
                    </Link>
                  </div>
                  <p className="mt-2 text-xs text-white/65">
                    {run.format} | {run.outputs_count} outputs | {run.images_count} images
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-white/70">No runs yet. Generate your first campaign pack.</p>
          )}
        </article>

        <article className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-xl font-semibold">Top Output Types</h2>
          {overview?.top_output_types.length ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {overview.top_output_types.map((entry) => (
                <span key={entry.type} className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs">
                  {entry.type}: {entry.count}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-white/70">Run generation to populate this distribution.</p>
          )}

          <Link
            href="/dashboard/generate"
            className="mt-6 inline-block rounded-lg bg-cyan-300 px-4 py-2 text-sm font-semibold text-black hover:bg-cyan-200"
          >
            New Generation
          </Link>
        </article>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-xl font-semibold">How Users Use Generated Content</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-xl border border-white/10 bg-black/20 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-cyan-200">Step 1</p>
            <p className="mt-2 text-sm font-semibold">Upload Sources</p>
            <p className="mt-2 text-xs text-white/70">Upload ebooks, product notes, SOPs, and guides into Sources.</p>
          </article>

          <article className="rounded-xl border border-white/10 bg-black/20 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-cyan-200">Step 2</p>
            <p className="mt-2 text-sm font-semibold">Generate Campaign Pack</p>
            <p className="mt-2 text-xs text-white/70">Pick docs, choose tone/channel, and generate multi-format assets.</p>
          </article>

          <article className="rounded-xl border border-white/10 bg-black/20 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-cyan-200">Step 3</p>
            <p className="mt-2 text-sm font-semibold">Open Saved Run</p>
            <p className="mt-2 text-xs text-white/70">Use Library to revisit grouped outputs and images any time.</p>
          </article>

          <article className="rounded-xl border border-white/10 bg-black/20 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-cyan-200">Step 4</p>
            <p className="mt-2 text-sm font-semibold">Copy, Export, Publish</p>
            <p className="mt-2 text-xs text-white/70">Copy content or export JSON/Markdown/TXT into your publishing tools.</p>
          </article>
        </div>
      </section>
    </div>
  );
}
