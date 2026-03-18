"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { api, DocumentItem } from "@/lib/api-client";

type CoachEntry = {
  id: number;
  question: string;
  result: any;
  latencyMs?: number;
};

export default function CourseCompanionPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);
  const [searchText, setSearchText] = useState("");
  const [tool, setTool] = useState<string>("summary");
  const [courseQuestion, setCourseQuestion] = useState("");
  const [history, setHistory] = useState<CoachEntry[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [loadingAsk, setLoadingAsk] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadRecentDocuments() {
    setLoadingDocs(true);
    setError(null);
    try {
      const response = await api.getDocuments({ limit: 20 });
      setDocuments(response.data || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load documents");
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
      try {
        const response = await api.getDocuments({ q, limit: 30 });
        setDocuments(response.data || []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Search failed");
      }
    }, 280);
    return () => clearTimeout(timeout);
  }, [searchText]);

  const selectedCount = selectedDocumentIds.length;
  const selectedTitles = useMemo(() => {
    const map = new Map(documents.map((doc) => [doc.id, doc.title]));
    return selectedDocumentIds.map((id) => map.get(id) || id);
  }, [documents, selectedDocumentIds]);

  function toggleDocument(id: string) {
    setSelectedDocumentIds((prev) => (
      prev.includes(id)
        ? prev.filter((entry) => entry !== id)
        : [...prev, id]
    ));
  }

  async function onGenerate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoadingAsk(true);
    setError(null);
    try {
      let response;
      let questionText = "";
      if (tool === "summary") questionText = "Summarize this course.";
      if (tool === "lessons") questionText = "List the key lessons from this course.";
      if (tool === "roadmap") questionText = "Give a 30-day learning roadmap for this course.";
      if (tool === "question") questionText = courseQuestion.trim();
      if (!questionText) {
        setError("Enter a question or select a tool.");
        setLoadingAsk(false);
        return;
      }
      response = await api.courseCoach({
        question: questionText,
        document_ids: selectedDocumentIds.length ? selectedDocumentIds : undefined,
        mode: "coach",
        response_style: "structured",
        include_checklist: true,
      });
      setHistory((prev) => [
        {
          id: Date.now(),
          question: questionText,
          result: response.data,
          latencyMs: response.meta?.latency_ms,
        },
        ...prev,
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Course companion request failed");
    } finally {
      setLoadingAsk(false);
    }
  }

  return (
    <main className="space-y-8">
      <header className="rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_20%_20%,#22515d_0%,#1a334d_52%,#101a2a_100%)] p-6 shadow-lg">
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">Feature 02</p>
        <h1 className="mt-2 text-3xl font-semibold">AI Course Companion</h1>
        <p className="mt-2 max-w-3xl text-sm text-white/85">
          Turn course materials into summaries, key lessons, learning roadmaps, or ask questions directly.
        </p>
      </header>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_1.2fr]">
        <article className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xl font-semibold">Select Course Materials</h2>
            <span className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-100">
              {selectedCount} selected
            </span>
          </div>
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search uploaded docs"
            className="mt-4 w-full rounded-lg border border-white/20 bg-[#0b1320] px-3 py-2 text-sm outline-none focus:border-cyan-300"
          />
          {loadingDocs ? <p className="mt-4 text-sm text-white/70">Loading documents...</p> : null}
          <div className="mt-4 max-h-95 space-y-2 overflow-auto pr-1">
            {documents.map((doc) => {
              const selected = selectedDocumentIds.includes(doc.id);
              return (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => toggleDocument(doc.id)}
                  className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition ${
                    selected
                      ? "border-cyan-300/50 bg-cyan-300/10 text-cyan-100"
                      : "border-white/15 bg-black/25 text-white/85 hover:border-white/25"
                  }`}
                >
                  <p className="line-clamp-1 font-medium">{doc.title}</p>
                  <p className="mt-1 text-xs text-white/65">{doc.doc_type || "unknown"}</p>
                </button>
              );
            })}
            {!loadingDocs && documents.length === 0 ? (
              <p className="text-sm text-white/70">No documents found. Upload from Sources first.</p>
            ) : null}
          </div>
          {selectedTitles.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {selectedTitles.slice(0, 6).map((title: string) => (
                <span key={title} className="rounded-full border border-white/20 bg-white/10 px-2 py-1 text-[11px] text-white/75">
                  {title}
                </span>
              ))}
            </div>
          ) : null}
        </article>

        <form className="rounded-2xl border border-white/10 bg-white/5 p-5" onSubmit={onGenerate}>
          <h2 className="text-xl font-semibold mb-4">Choose Tool</h2>
          <div className="flex flex-wrap gap-3 mb-6">
            <label className="flex items-center gap-2">
              <input type="radio" name="tool" value="summary" checked={tool === "summary"} onChange={() => setTool("summary")} />
              Course Summary
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="tool" value="lessons" checked={tool === "lessons"} onChange={() => setTool("lessons")} />
              Key Lessons
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="tool" value="roadmap" checked={tool === "roadmap"} onChange={() => setTool("roadmap")} />
              Learning Roadmap
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="tool" value="question" checked={tool === "question"} onChange={() => setTool("question")} />
              Ask Course Question
            </label>
          </div>
          {tool === "question" ? (
            <div className="mb-4">
              <input
                type="text"
                value={courseQuestion}
                onChange={(e) => setCourseQuestion(e.target.value)}
                placeholder="Ask a question about this course"
                className="w-full rounded-lg border border-white/20 bg-[#0b1320] px-3 py-2 text-sm outline-none focus:border-cyan-300"
              />
            </div>
          ) : null}
          <button type="submit" className="mt-2 w-full rounded-lg bg-cyan-600 py-2 text-white font-semibold hover:bg-cyan-700 transition">
            {loadingAsk ? "Generating..." : "Generate"}
          </button>
          {error ? <p className="mt-2 text-sm text-red-400">{error}</p> : null}
        </form>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-xl font-semibold mb-4">Output</h2>
        {history.length === 0 ? <p className="text-white/70">No output yet.</p> : null}
        {history.map((entry) => (
          <div key={entry.id} className="mb-6">
            {typeof entry.result === "object" && entry.result.answer ? (
              <div>
                <h4 className="font-semibold mb-1">Answer</h4>
                <p className="mb-2 text-white/90">{entry.result.answer}</p>
              </div>
            ) : null}
            {typeof entry.result === "object" && entry.result.checklist ? (
              <div>
                <h4 className="font-semibold mb-1">Checklist</h4>
                <ul className="list-disc ml-6 mb-2">
                  {entry.result.checklist.map((item: string, idx: number) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {typeof entry.result === "object" && entry.result.sources ? (
              <div>
                <h4 className="font-semibold mb-1">Sources</h4>
                <ul className="list-disc ml-6 mb-2">
                  {entry.result.sources.map((src: any, idx: number) => (
                    <li key={idx}>{src.title || src.url || "Source"}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ))}
      </section>
    </main>
  );
}
