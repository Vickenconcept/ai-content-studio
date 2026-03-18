"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, ContentRunSummary } from "@/lib/api-client";

export default function OutputsPage() {
  const [runs, setRuns] = useState<ContentRunSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadRuns() {
      setLoading(true);
      setError(null);

      try {
        const response = await api.getContentRuns(30);
        setRuns(response.data.data || []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load generation library");
      } finally {
        setLoading(false);
      }
    }

    loadRuns();
  }, []);

  return (
    <div className="space-y-8">
      <header className="rounded-2xl border border-white/10 bg-[linear-gradient(120deg,#3e2e1a_0%,#1d3f44_100%)] p-6 shadow-lg">
        <p className="text-xs uppercase tracking-[0.2em] text-amber-200">Library</p>
        <h1 className="mt-2 text-3xl font-semibold">Saved Generation Runs</h1>
        <p className="mt-2 max-w-3xl text-sm text-white/85">
          Every generation is stored in groups. Open any run to revisit all assets, including generated images.
        </p>
      </header>

      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
      {loading ? <p className="text-sm text-white/70">Loading library...</p> : null}

      {!loading && runs.length === 0 ? (
        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <p className="text-sm text-white/75">No saved runs yet.</p>
          <p className="mt-2 text-sm text-white/70">
            Go to <Link href="/dashboard/generate" className="underline">Generate</Link>, select source documents, and run generation.
          </p>
        </section>
      ) : (
        <section className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-5">
          {runs.map((run) => (
            <article key={run.id} className="rounded-lg border border-white/15 bg-black/30 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{run.title}</p>
                  <p className="mt-1 text-xs text-white/60">
                    {run.format} | {run.outputs_count} outputs | {run.images_count} images
                  </p>
                </div>
                <Link href={`/dashboard/outputs/${run.id}`} className="rounded-lg border border-cyan-300/30 px-3 py-1 text-xs text-cyan-100 hover:bg-cyan-300/10">
                  Open run
                </Link>
              </div>
              <p className="mt-3 line-clamp-2 text-sm text-white/75">{run.query}</p>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
