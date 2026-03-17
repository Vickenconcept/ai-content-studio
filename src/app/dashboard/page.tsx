"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { api, ContentGenerateResponse, DocumentItem } from "@/lib/api-client";

const DEFAULT_QUERY = "Create 10 social posts and a 3-email campaign from selected documents.";

export default function DashboardPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);
  const [query, setQuery] = useState(DEFAULT_QUERY);
  const [format, setFormat] = useState("campaign_pack");
  const [tone, setTone] = useState("direct");
  const [channel, setChannel] = useState("mixed");
  const [maxOutputs, setMaxOutputs] = useState(12);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [loadingGenerate, setLoadingGenerate] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ContentGenerateResponse | null>(null);

  const selectedCount = selectedDocumentIds.length;

  const selectedDocuments = useMemo(
    () => documents.filter((doc) => selectedDocumentIds.includes(doc.id)),
    [documents, selectedDocumentIds],
  );

  useEffect(() => {
    async function loadDocuments() {
      setLoadingDocs(true);
      setError(null);

      try {
        const response = await api.getDocuments();
        setDocuments(response.data || []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load documents");
      } finally {
        setLoadingDocs(false);
      }
    }

    loadDocuments();
  }, []);

  function toggleDocument(documentId: string) {
    setSelectedDocumentIds((current) =>
      current.includes(documentId)
        ? current.filter((id) => id !== documentId)
        : [...current, documentId],
    );
  }

  async function onGenerate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setResult(null);

    if (selectedDocumentIds.length === 0) {
      setError("Pick at least one source document.");
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
      <header className="rounded-2xl border border-white/10 bg-[linear-gradient(120deg,#1b3650_0%,#3c2259_100%)] p-6 shadow-lg">
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">Product value</p>
        <h1 className="mt-2 text-3xl font-semibold">AI Content Generator From Documents</h1>
        <p className="mt-2 max-w-3xl text-sm text-white/85">
          Solves the blank-page problem for marketers and course buyers: one source document becomes campaign-ready content packs.
        </p>
      </header>

      <div className="grid gap-8 xl:grid-cols-[1fr_1.2fr]">
        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-xl font-semibold">1) Select Source Documents</h2>
          <p className="mt-1 text-sm text-white/70">Choose documents from your core knowledge backend.</p>

          {loadingDocs ? <p className="mt-4 text-sm text-white/70">Loading documents...</p> : null}

          <ul className="mt-4 max-h-[420px] space-y-2 overflow-auto pr-1">
            {documents.map((doc) => {
              const active = selectedDocumentIds.includes(doc.id);
              return (
                <li key={doc.id}>
                  <button
                    type="button"
                    onClick={() => toggleDocument(doc.id)}
                    className={`w-full rounded-lg border px-3 py-2 text-left transition ${
                      active
                        ? "border-cyan-300 bg-cyan-400/15"
                        : "border-white/15 bg-white/5 hover:bg-white/10"
                    }`}
                  >
                    <p className="truncate text-sm font-medium">{doc.title}</p>
                    <p className="text-xs text-white/60">Chunks: {doc.chunks_count ?? 0}</p>
                  </button>
                </li>
              );
            })}
          </ul>

          <p className="mt-4 text-xs text-cyan-200">Selected: {selectedCount}</p>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-xl font-semibold">2) Generate Campaign Assets</h2>
          <p className="mt-1 text-sm text-white/70">Uses `POST /api/addition/v1/content/generate`.</p>

          <form className="mt-4 space-y-4" onSubmit={onGenerate}>
            <label className="block text-sm">
              Prompt
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
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-white/20 bg-[#08111a] px-3 py-2"
                >
                  <option value="campaign_pack">campaign_pack</option>
                  <option value="social">social</option>
                  <option value="email">email</option>
                  <option value="blog">blog</option>
                </select>
              </label>

              <label className="text-sm">
                Tone
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-white/20 bg-[#08111a] px-3 py-2"
                >
                  <option value="direct">direct</option>
                  <option value="friendly">friendly</option>
                  <option value="authority">authority</option>
                  <option value="story">story</option>
                </select>
              </label>

              <label className="text-sm">
                Channel
                <select
                  value={channel}
                  onChange={(e) => setChannel(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-white/20 bg-[#08111a] px-3 py-2"
                >
                  <option value="mixed">mixed</option>
                  <option value="email">email</option>
                  <option value="blog">blog</option>
                  <option value="linkedin">linkedin</option>
                  <option value="facebook">facebook</option>
                  <option value="x">x</option>
                </select>
              </label>

              <label className="text-sm">
                Max Outputs
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
              {loadingGenerate ? "Generating..." : "Generate Content Pack"}
            </button>
          </form>

          {result ? (
            <div className="mt-6 space-y-4">
              <div className="rounded-lg border border-white/15 bg-black/30 p-3 text-sm text-white/75">
                Latency: {result.meta?.latency_ms ?? "n/a"} ms
              </div>

              <h3 className="text-lg font-semibold">Outputs</h3>
              <div className="space-y-3">
                {result.data.outputs.map((output, index) => (
                  <article key={`${output.type}-${index}`} className="rounded-lg border border-white/15 bg-black/30 p-4">
                    <p className="text-xs uppercase tracking-wider text-cyan-200">{output.type}</p>
                    <h4 className="mt-1 font-semibold">{output.title}</h4>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-white/80">{output.content}</p>
                    {output.cta ? <p className="mt-2 text-sm text-emerald-300">CTA: {output.cta}</p> : null}
                  </article>
                ))}
              </div>

              <h3 className="text-lg font-semibold">Sources</h3>
              <ul className="space-y-2">
                {result.data.sources.map((source) => (
                  <li key={source.document_id} className="rounded-lg border border-white/15 bg-black/30 p-3 text-sm">
                    {source.title}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {selectedDocuments.length > 0 ? (
            <div className="mt-6 rounded-lg border border-white/15 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-white/60">Selected source docs</p>
              <ul className="mt-2 space-y-1 text-sm text-white/80">
                {selectedDocuments.map((doc) => (
                  <li key={doc.id}>{doc.title}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
