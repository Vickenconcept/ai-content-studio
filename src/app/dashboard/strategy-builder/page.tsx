"use client";

import { useEffect, useState, FormEvent } from "react";
import { api, DocumentItem } from "@/lib/api-client";

const strategyTypes = [
  { value: "business", label: "Business Strategy" },
  { value: "marketing", label: "Marketing Plan" },
  { value: "growth", label: "Growth Plan" },
  { value: "30day", label: "30 Day Action Plan" },
];

export default function StrategyBuilderPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedDocId, setSelectedDocId] = useState("");
  const [strategyType, setStrategyType] = useState("business");
  const [strategyGoal, setStrategyGoal] = useState("");
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
      const res = await api.buildStrategy({
        document_id: selectedDocId,
        strategy_type: strategyType,
        goal: strategyGoal,
      });
      setOutput(res.data);
    } catch (e) {
      setError("Failed to generate strategy");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="space-y-8">
      <header className="rounded-2xl border border-white/10 bg-gradient-to-r from-emerald-700 to-blue-900 p-6 shadow-lg">
        <h1 className="text-3xl font-semibold">AI Strategy Builder</h1>
        <p className="mt-2 text-sm text-white/85">Turn documents into implementation plans.</p>
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
          <label className="block mb-2 font-medium">Strategy Type</label>
          <div className="flex flex-wrap gap-3">
            {strategyTypes.map(type => (
              <label key={type.value} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="strategyType"
                  value={type.value}
                  checked={strategyType === type.value}
                  onChange={() => setStrategyType(type.value)}
                />
                {type.label}
              </label>
            ))}
          </div>
        </div>
        <div>
          <label className="block mb-2 font-medium">Strategy Goal</label>
          <input
            type="text"
            value={strategyGoal}
            onChange={e => setStrategyGoal(e.target.value)}
            placeholder="e.g. Grow affiliate sales"
            className="w-full rounded-lg border border-white/20 bg-[#0b1320] px-3 py-2 text-sm"
          />
        </div>
        <button type="submit" className="w-full rounded-lg bg-emerald-600 py-2 text-white font-semibold hover:bg-emerald-700 transition">
          {loading ? "Generating..." : "Generate Strategy"}
        </button>
        {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
      </form>
      <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-xl font-semibold mb-4">Output</h2>
        {!output && <p className="text-white/70">No strategy yet.</p>}
        {output && (
          <div>
            {output.overview && (
              <div className="mb-4">
                <h3 className="font-bold mb-1">Strategy Overview</h3>
                <p>{output.overview}</p>
              </div>
            )}
            {output.steps && (
              <div className="mb-4">
                <h3 className="font-bold mb-1">Step-by-Step Plan</h3>
                <ul className="list-disc ml-6">
                  {output.steps.map((step: string, idx: number) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ul>
              </div>
            )}
            {output.plan && (
              <div className="mb-4">
                <h3 className="font-bold mb-1">30 Day Plan</h3>
                <ol className="list-decimal ml-6">
                  {output.plan.map((week: string, idx: number) => (
                    <li key={idx}>{week}</li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
