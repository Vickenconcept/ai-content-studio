"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api, ContentRunDetailResponse } from "@/lib/api-client";

export default function OutputRunDetailPage() {
  const params = useParams<{ id: string }>();
  const runId = params?.id;
  const [data, setData] = useState<ContentRunDetailResponse["data"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeItem, setActiveItem] = useState<ContentRunDetailResponse["data"]["items"][number] | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!runId) return;

    async function loadRun() {
      setLoading(true);
      setError(null);
      try {
        const response = await api.getContentRun(runId);
        setData(response.data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load run details");
      } finally {
        setLoading(false);
      }
    }

    loadRun();
  }, [runId]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setActiveItem(null);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function getUsageTargets(type: string): string[] {
    switch (type) {
      case "email":
        return ["Email newsletter", "Autoresponder", "Broadcast campaign"];
      case "social_post":
        return ["LinkedIn", "Facebook", "X/Twitter"];
      case "blog_outline":
        return ["Blog/CMS", "Medium", "SEO article brief"];
      case "ad_hook":
        return ["Meta Ads", "Google Ads", "Creative testing"];
      case "caption":
        return ["Instagram", "YouTube", "TikTok"];
      default:
        return ["Content library", "Campaign workflow"];
    }
  }

  async function copyToClipboard(text: string, successLabel: string) {
    try {
      await navigator.clipboard.writeText(text);
      setActionMessage(`${successLabel} copied.`);
      setTimeout(() => setActionMessage(null), 1800);
    } catch {
      setActionMessage("Copy failed. Please try again.");
      setTimeout(() => setActionMessage(null), 1800);
    }
  }

  function downloadTextFile(fileName: string, content: string, mimeType = "text/plain") {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  async function regenerateVariant() {
    if (!data?.run) return;

    setBusyAction("regenerate");
    setActionMessage(null);
    try {
      const response = await api.generateContent({
        query: data.run.query,
        document_ids: data.run.source_document_ids || [],
        format: data.run.format,
        tone: data.run.tone,
        channel: data.run.channel,
        max_outputs: data.run.max_outputs,
        search_scope: "both",
      });

      const newRunId = response.data.generation?.id;
      if (newRunId) {
        window.location.href = `/dashboard/outputs/${newRunId}`;
        return;
      }

      setActionMessage("Variant generated. Open Library to view latest run.");
    } catch (e) {
      setActionMessage(e instanceof Error ? e.message : "Variant generation failed");
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <div className="space-y-6">
      <Link href="/dashboard/outputs" className="text-sm text-cyan-200 underline">
        Back to library
      </Link>

      {actionMessage ? (
        <p className="rounded-lg border border-cyan-300/40 bg-cyan-300/10 px-3 py-2 text-sm text-cyan-100">{actionMessage}</p>
      ) : null}

      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
      {loading ? <p className="text-sm text-white/70">Loading run...</p> : null}

      {data ? (
        <>
          <header className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h1 className="text-2xl font-semibold">{data.run.title}</h1>
            <p className="mt-2 text-sm text-white/75">{data.run.query}</p>
            <p className="mt-2 text-xs text-white/60">
              {data.run.format} | {data.run.tone} | {data.run.channel} | outputs: {data.run.outputs_count} | images: {data.run.images_count}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  const payload = JSON.stringify(data, null, 2);
                  downloadTextFile(`content-run-${data.run.id}.json`, payload, "application/json");
                }}
                className="rounded-lg border border-white/20 px-3 py-1 text-xs text-white/80 hover:bg-white/10"
              >
                Export JSON
              </button>

              <button
                type="button"
                onClick={() => {
                  const md = [
                    `# ${data.run.title}`,
                    "",
                    `Query: ${data.run.query}`,
                    `Format: ${data.run.format}`,
                    `Tone: ${data.run.tone}`,
                    `Channel: ${data.run.channel}`,
                    "",
                    ...data.items.map((item, idx) => (
                      `## ${idx + 1}. ${item.title} (${item.type})\n\n${item.content}${item.cta ? `\n\nCTA: ${item.cta}` : ""}\n`
                    )),
                  ].join("\n");
                  downloadTextFile(`content-run-${data.run.id}.md`, md, "text/markdown");
                }}
                className="rounded-lg border border-white/20 px-3 py-1 text-xs text-white/80 hover:bg-white/10"
              >
                Export Markdown
              </button>

              <button
                type="button"
                onClick={regenerateVariant}
                disabled={busyAction === "regenerate"}
                className="rounded-lg border border-cyan-300/40 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-100 hover:bg-cyan-300/20 disabled:opacity-60"
              >
                {busyAction === "regenerate" ? "Generating variant..." : "Regenerate Variant"}
              </button>
            </div>
          </header>

          <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.items.map((item, index) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveItem(item)}
                className="rounded-2xl border border-white/10 bg-black/25 p-4 text-left transition hover:border-cyan-300/40 hover:bg-black/40"
              >
                <p className="text-xs uppercase tracking-[0.16em] text-cyan-200">{item.type} #{index + 1}</p>
                <h2 className="mt-1 line-clamp-2 text-base font-semibold">{item.title}</h2>
                <p className="mt-2 line-clamp-5 whitespace-pre-wrap text-sm text-white/80">{item.content}</p>
                <div className="mt-3 flex flex-wrap gap-1">
                  {getUsageTargets(item.type).map((target) => (
                    <span key={`${item.id}-${target}`} className="rounded-full border border-white/20 bg-white/5 px-2 py-1 text-[10px] text-white/75">
                      {target}
                    </span>
                  ))}
                </div>
                {item.cta ? <p className="mt-3 line-clamp-2 text-xs text-emerald-300">CTA: {item.cta}</p> : null}
                {item.image_url ? (
                  <Image
                    src={item.image_url}
                    alt={item.title}
                    width={1200}
                    height={768}
                    unoptimized
                    className="mt-3 h-40 w-full rounded-xl object-cover"
                  />
                ) : null}

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      void copyToClipboard(item.content, "Content");
                    }}
                    className="rounded-lg border border-white/20 px-2 py-1 text-[11px] text-white/80 hover:bg-white/10"
                  >
                    Copy Content
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const text = `${item.title}\n\n${item.content}${item.cta ? `\n\nCTA: ${item.cta}` : ""}`;
                      downloadTextFile(`${item.type}-${item.id}.txt`, text);
                    }}
                    className="rounded-lg border border-white/20 px-2 py-1 text-[11px] text-white/80 hover:bg-white/10"
                  >
                    Export TXT
                  </button>
                </div>
              </button>
            ))}
          </section>

          {activeItem ? (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
              onClick={() => setActiveItem(null)}
            >
              <div
                className="max-h-[90vh] w-full max-w-4xl overflow-auto rounded-2xl border border-white/15 bg-[#0b1420] p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-cyan-200">{activeItem.type}</p>
                    <h2 className="mt-1 text-xl font-semibold">{activeItem.title}</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveItem(null)}
                    className="rounded-lg border border-white/20 px-3 py-1 text-sm text-white/80 hover:bg-white/10"
                  >
                    Close
                  </button>
                </div>

                <p className="mt-4 whitespace-pre-wrap text-sm text-white/90">{activeItem.content}</p>
                {activeItem.cta ? <p className="mt-4 text-sm text-emerald-300">CTA: {activeItem.cta}</p> : null}

                {activeItem.image_url ? (
                  <Image
                    src={activeItem.image_url}
                    alt={activeItem.title}
                    width={1600}
                    height={1024}
                    unoptimized
                    className="mt-5 max-h-[520px] w-full rounded-xl object-cover"
                  />
                ) : null}
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
