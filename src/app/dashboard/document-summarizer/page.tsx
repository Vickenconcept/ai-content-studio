"use client";

import { useEffect, useState, FormEvent } from "react";
import { api, DocumentItem } from "@/lib/api-client";

const summaryTypes = [
  { value: "quick", label: "Quick Summary" },
  { value: "detailed", label: "Detailed Summary" },
  { value: "keypoints", label: "Key Points" },
  { value: "actions", label: "Actionable Insights" },
];

export default function DocumentSummarizerPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedDocId, setSelectedDocId] = useState("");
  const [summaryType, setSummaryType] = useState("quick");
  const [output, setOutput] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDocs() {
      try {
        const res = await api.getDocuments({ limit: 50 });
        setDocuments(res.data || []);
      } catch (e) {
        setError("Failed to load documents");
      }
    }
    fetchDocs();
  }, []);

  async function onGenerate(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setOutput(null);
    try {
      const res = await api.summarizeDocument({
        document_id: selectedDocId,
        summary_type: summaryType,
      });
      setOutput(res.data);
    } catch (e) {
      setError("Failed to generate summary");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="space-y-8">
      <header className="rounded-2xl border border-white/10 bg-gradient-to-r from-cyan-700 to-blue-900 p-6 shadow-lg">
        <h1 className="text-3xl font-semibold">AI Document Summarizer</h1>
        <p className="mt-2 text-sm text-white/85">Turn long documents into quick insights.</p>
      </header>
      <form className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-6" onSubmit={onGenerate}>
        <div>
          <label className="block mb-2 font-medium">Select Document</label>
          <select
            className="w-full rounded-lg border border-white/20 bg-[#0b1320] px-3 py-2 text-sm"
            value={selectedDocId}
            onChange={e => setSelectedDocId(e.target.value)}
          >
            <option value="">-- Select --</option>
            {documents.map(doc => (
              <option key={doc.id} value={doc.id}>{doc.title}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block mb-2 font-medium">Summary Type</label>
          <div className="flex flex-wrap gap-3">
            {summaryTypes.map(type => (
              <label key={type.value} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="summaryType"
                  value={type.value}
                  checked={summaryType === type.value}
                  onChange={() => setSummaryType(type.value)}
                />
                {type.label}
              </label>
            ))}
          </div>
        </div>
        <button type="submit" className="w-full rounded-lg bg-cyan-600 py-2 text-white font-semibold hover:bg-cyan-700 transition">
          {loading ? "Generating..." : "Generate Summary"}
        </button>
        {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
      </form>
      <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-xl font-semibold mb-4">Output</h2>
        {!output && <p className="text-white/70">No summary yet.</p>}
        {output && (
          <div>
            {output.quick && (
              <div className="mb-4">
                <h3 className="font-bold mb-1">Quick Summary</h3>
                <p>{output.quick}</p>
              </div>
            )}
            {output.keypoints && (
              <div className="mb-4">
                <h3 className="font-bold mb-1">Key Points</h3>
                <ul className="list-disc ml-6">
                  {output.keypoints.map((point: string, idx: number) => (
                    <li key={idx}>{point}</li>
                  ))}
                </ul>
              </div>
            )}
            {output.actions && (
              <div className="mb-4">
                <h3 className="font-bold mb-1">Actionable Insights</h3>
                <ol className="list-decimal ml-6">
                  {output.actions.map((step: string, idx: number) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ol>
              </div>
            )}
            {output.detailed && (
              <div className="mb-4">
                <h3 className="font-bold mb-1">Detailed Summary</h3>
                <p>{output.detailed}</p>
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
