"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { api, ContentGenerateResponse, DocumentItem } from "@/lib/api-client";

const DEFAULT_QUERY = "Create a campaign pack from the selected docs with social posts, emails, and one long-form content asset.";
const INITIAL_DOC_LIMIT = 6;

export default function GeneratePage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);
  const [selectedDocTitles, setSelectedDocTitles] = useState<Record<string, string>>({});
  const [query, setQuery] = useState(DEFAULT_QUERY);
  const [format, setFormat] = useState("campaign_pack");
  const [tone, setTone] = useState("friendly");
  const [channel, setChannel] = useState("mixed");
  const [maxOutputs, setMaxOutputs] = useState(8);
  const [searchText, setSearchText] = useState("");
  const [activeTag, setActiveTag] = useState<string>("all");
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [loadingGenerate, setLoadingGenerate] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ContentGenerateResponse | null>(null);

  async function loadRecentDocuments() {
    setLoadingDocs(true);
    setError(null);
    try {
      const response = await api.getDocuments({ limit: INITIAL_DOC_LIMIT });
      setDocuments(response.data || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load source documents");
    } finally {
      setLoadingDocs(false);
    }
  }

  useEffect(() => {
    loadRecentDocuments();
  }, []);

  useEffect(() => {
    const q = searchText.trim();
    const timeout = setTimeout(async () => {
      if (q.length < 2) {
        if (q.length === 0) {
          await loadRecentDocuments();
        }
        return;
      }

      setLoadingDocs(true);
      setError(null);
      try {
        const response = await api.getDocuments({ q, limit: 30 });
        setDocuments(response.data || []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Search failed");
      } finally {
        setLoadingDocs(false);
      }
    }, 350);

    return () => clearTimeout(timeout);
  }, [searchText]);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    documents.forEach((doc) => {
      if (doc.doc_type) tagSet.add(doc.doc_type);
      doc.tags?.forEach((tag) => tagSet.add(tag));
    });
    return ["all", ...Array.from(tagSet).slice(0, 16)];
  }, [documents]);

  const filteredDocuments = useMemo(() => {
    const needle = searchText.trim().toLowerCase();

    const matches = documents.filter((doc) => {
      const tagMatch = activeTag === "all"
        || doc.doc_type === activeTag
        || (doc.tags || []).includes(activeTag);

      if (!tagMatch) return false;
      if (!needle) return true;

      const inTitle = doc.title.toLowerCase().includes(needle);
      const inType = (doc.doc_type || "").toLowerCase().includes(needle);
      const inTags = (doc.tags || []).join(" ").toLowerCase().includes(needle);
      return inTitle || inType || inTags;
    });

    return matches;
  }, [documents, searchText, activeTag]);

  const selectedDocuments = useMemo(
    () => selectedDocumentIds.map((id) => ({ id, title: selectedDocTitles[id] || id })),
    [selectedDocumentIds, selectedDocTitles],
  );

  function toggleDocument(documentId: string) {
    const doc = documents.find((d) => d.id === documentId);
    setSelectedDocumentIds((current) =>
      current.includes(documentId)
        ? current.filter((id) => id !== documentId)
        : [...current, documentId],
    );
    if (doc) {
      setSelectedDocTitles((current) => ({
        ...current,
        [documentId]: doc.title,
      }));
    }
  }

  async function onGenerate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setResult(null);

    if (selectedDocumentIds.length === 0) {
      setError("Select at least one source document before generating.");
      return;
    }

    setLoadingGenerate(true);
    try {
      const response = await api.generateContent({
        query,
        document_ids: selectedDocumentIds,
        format,
        tone,
        channel,
        max_outputs: maxOutputs,
        search_scope: "both",
      });
      setResult(response);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setLoadingGenerate(false);
    }
  }

  return (
    <div className="space-y-8">
      <header className="rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_80%_10%,#4f2a68_0%,#192f49_52%,#121924_100%)] p-6 shadow-lg">
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">Generate</p>
        <h1 className="mt-2 text-3xl font-semibold">Campaign Builder Workspace</h1>
        <p className="mt-2 max-w-3xl text-sm text-white/85">
          Build output groups from selected source docs. Each generation run is saved to your library so you can reopen it any time.
        </p>
      </header>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_1fr]">
        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-xl font-semibold">1) Select Sources</h2>
          <p className="mt-1 text-sm text-white/70">Search by name, filter by type/tag, then select the documents you want.</p>
          <p className="mt-1 text-xs text-white/55">Showing only {INITIAL_DOC_LIMIT} recent docs by default. Search to fetch more, or manage full library in <Link href="/dashboard/sources" className="underline">Sources</Link>.</p>

          <div className="mt-4 space-y-3">
            <input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search documents..."
              className="w-full rounded-lg border border-white/20 bg-[#0b1320] px-3 py-2 text-sm outline-none focus:border-cyan-300"
            />

            <div className="flex flex-wrap gap-2">
              {allTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setActiveTag(tag)}
                  className={`rounded-full border px-3 py-1 text-xs ${
                    activeTag === tag
                      ? "border-cyan-300 bg-cyan-300/20 text-cyan-100"
                      : "border-white/20 bg-white/5 text-white/80"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {loadingDocs ? <p className="mt-4 text-sm text-white/70">Loading source documents...</p> : null}

          <ul className="mt-4 max-h-[430px] space-y-2 overflow-auto pr-1">
            {filteredDocuments.map((doc) => {
              const active = selectedDocumentIds.includes(doc.id);
              return (
                <li key={doc.id}>
                  <button
                    type="button"
                    onClick={() => toggleDocument(doc.id)}
                    className={`w-full rounded-lg border px-3 py-3 text-left transition ${
                      active
                        ? "border-cyan-300 bg-cyan-300/15"
                        : "border-white/15 bg-white/5 hover:bg-white/10"
                    }`}
                  >
                    <p className="truncate text-sm font-medium">{doc.title}</p>
                    <p className="mt-1 text-xs text-white/60">
                      {(doc.doc_type || "general")} | chunks: {doc.chunks_count ?? 0}
                    </p>
                  </button>
                </li>
              );
            })}
          </ul>

          {!loadingDocs && documents.length === 0 ? (
            <div className="mt-4 rounded-lg border border-amber-200/30 bg-amber-200/10 p-3 text-sm text-amber-100">
              No documents available. Upload your first source in <Link href="/dashboard/sources" className="underline">Sources</Link>.
            </div>
          ) : null}

          {selectedDocuments.length > 0 ? (
            <div className="mt-4 rounded-lg border border-white/20 bg-black/20 p-3">
              <p className="text-xs uppercase tracking-[0.16em] text-white/60">Selected ({selectedDocuments.length})</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedDocuments.map((doc) => (
                  <span key={doc.id} className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-xs">
                    {doc.title}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-xl font-semibold">2) Configure and Generate</h2>

          <form className="mt-4 space-y-4" onSubmit={onGenerate}>
            <label className="block text-sm">
              Generation brief
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                rows={4}
                className="mt-2 w-full rounded-lg border border-white/20 bg-[#08111a] px-3 py-2 outline-none focus:border-cyan-300"
              />
            </label>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="text-sm">
                Format
                <select value={format} onChange={(e) => setFormat(e.target.value)} className="mt-2 w-full rounded-lg border border-white/20 bg-[#08111a] px-3 py-2">
                  <option value="campaign_pack">campaign_pack</option>
                  <option value="social">social</option>
                  <option value="email">email</option>
                  <option value="blog">blog</option>
                </select>
              </label>

              <label className="text-sm">
                Tone
                <select value={tone} onChange={(e) => setTone(e.target.value)} className="mt-2 w-full rounded-lg border border-white/20 bg-[#08111a] px-3 py-2">
                  <option value="direct">direct</option>
                  <option value="friendly">friendly</option>
                  <option value="authority">authority</option>
                  <option value="story">story</option>
                </select>
              </label>

              <label className="text-sm">
                Channel
                <select value={channel} onChange={(e) => setChannel(e.target.value)} className="mt-2 w-full rounded-lg border border-white/20 bg-[#08111a] px-3 py-2">
                  <option value="mixed">mixed</option>
                  <option value="email">email</option>
                  <option value="blog">blog</option>
                  <option value="linkedin">linkedin</option>
                  <option value="facebook">facebook</option>
                  <option value="x">x</option>
                </select>
              </label>

              <label className="text-sm">
                Max outputs
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={maxOutputs}
                  onChange={(e) => setMaxOutputs(Number(e.target.value || 1))}
                  className="mt-2 w-full rounded-lg border border-white/20 bg-[#08111a] px-3 py-2"
                />
              </label>
            </div>

            {error ? <p className="text-sm text-rose-300">{error}</p> : null}

            <button
              type="submit"
              disabled={loadingGenerate}
              className="rounded-lg bg-cyan-300 px-5 py-2 font-semibold text-black transition hover:bg-cyan-200 disabled:opacity-60"
            >
              {loadingGenerate ? "Generating..." : "Generate and Save Run"}
            </button>
          </form>

          {result ? (
            <div className="mt-6 space-y-4">
              <div className="rounded-lg border border-white/15 bg-black/30 p-3 text-sm text-white/75">
                Latency: {result.meta?.latency_ms ?? "n/a"} ms
              </div>

              {result.data.generation?.id ? (
                <Link
                  href={`/dashboard/outputs/${result.data.generation.id}`}
                  className="inline-block rounded-lg border border-cyan-300/40 bg-cyan-300/10 px-4 py-2 text-sm text-cyan-100"
                >
                  Open saved run
                </Link>
              ) : null}

              <div className="space-y-3">
                {result.data.outputs.slice(0, 3).map((output, index) => (
                  <article key={`${output.type}-${index}`} className="rounded-lg border border-white/15 bg-black/30 p-4">
                    <p className="text-xs uppercase tracking-wider text-cyan-200">{output.type}</p>
                    <h3 className="mt-1 font-semibold">{output.title}</h3>
                    <p className="mt-2 line-clamp-5 whitespace-pre-wrap text-sm text-white/80">{output.content}</p>
                  </article>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
