"use client";

import { ChangeEvent, useCallback, useEffect, useMemo, useState } from "react";
import { api, DocumentItem } from "@/lib/api-client";

type UploadScope = "organization" | "personal";

export default function SourcesPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [scope, setScope] = useState<UploadScope>("organization");
  const [workspaceName, setWorkspaceName] = useState("Content Studio Workspace");
  const [history, setHistory] = useState<DocumentItem[]>([]);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0, per_page: 20 });
  const [activePage, setActivePage] = useState(1);
  const [searchText, setSearchText] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);
  const [previewChunks, setPreviewChunks] = useState<Array<{ id: string; chunk_index: number; text: string; token_count?: number }>>([]);
  const [previewPage, setPreviewPage] = useState(1);
  const [previewPagination, setPreviewPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const totalSelectedSizeMb = useMemo(
    () => (files.reduce((sum, file) => sum + file.size, 0) / (1024 * 1024)).toFixed(2),
    [files],
  );

  const loadHistory = useCallback(async (page = 1) => {
    setLoadingHistory(true);
    setError(null);
    try {
      const response = await api.getManualUploadHistory(page);
      setHistory(response.uploads || []);
      setPagination({
        current_page: response.pagination?.current_page ?? page,
        last_page: response.pagination?.last_page ?? 1,
        total: response.pagination?.total ?? (response.uploads?.length ?? 0),
        per_page: response.pagination?.per_page ?? 20,
      });
      setActivePage(response.pagination?.current_page ?? page);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load source history");
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    loadHistory(activePage);
  }, [activePage, loadHistory]);

  const availableTypes = useMemo(() => {
    const set = new Set<string>();
    history.forEach((item) => {
      if (item.doc_type) set.add(item.doc_type);
    });
    return ["all", ...Array.from(set).slice(0, 10)];
  }, [history]);

  const filteredHistory = useMemo(() => {
    const needle = searchText.trim().toLowerCase();
    return history.filter((item) => {
      if (typeFilter !== "all" && item.doc_type !== typeFilter) {
        return false;
      }
      if (!needle) {
        return true;
      }
      return item.title.toLowerCase().includes(needle)
        || (item.doc_type || "").toLowerCase().includes(needle)
        || (item.workspace_name || "").toLowerCase().includes(needle);
    });
  }, [history, searchText, typeFilter]);

  function onChooseFiles(event: ChangeEvent<HTMLInputElement>) {
    const list = event.target.files;
    if (!list || list.length === 0) {
      setFiles([]);
      return;
    }
    setFiles(Array.from(list));
  }

  async function onUpload() {
    if (files.length === 0) {
      setError("Pick at least one file to upload.");
      return;
    }

    setError(null);
    setSuccess(null);
    setUploading(true);

    try {
      const response = await api.uploadManualSources(files, {
        connection_scope: scope,
        workspace_name: workspaceName.trim() || undefined,
      });

      const uploaded = response.uploaded_files?.length || 0;
      const failed = response.errors?.length || 0;
      setSuccess(`Uploaded ${uploaded} file(s). ${failed > 0 ? `${failed} failed.` : ""}`.trim());
      setFiles([]);
      setShowUploadModal(false);
      setActivePage(1);
      await loadHistory(1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function onDelete(documentId: string) {
    setError(null);
    setSuccess(null);

    try {
      await api.deleteManualUpload(documentId);
      setSuccess("Source deleted.");
      await loadHistory(activePage);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    }
  }

  async function openPreview(item: DocumentItem, page = 1) {
    setPreviewDoc(item);
    setLoadingPreview(true);
    try {
      const response = await api.getDocumentChunks(item.id, page);
      setPreviewChunks((response.data || []).map((chunk) => ({
        id: chunk.id,
        chunk_index: chunk.chunk_index,
        text: chunk.text,
        token_count: chunk.token_count,
      })));
      setPreviewPagination({
        current_page: response.pagination?.current_page ?? page,
        last_page: response.pagination?.last_page ?? 1,
        total: response.pagination?.total ?? (response.data?.length ?? 0),
      });
      setPreviewPage(response.pagination?.current_page ?? page);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load chunks preview");
    } finally {
      setLoadingPreview(false);
    }
  }

  return (
    <div className="space-y-8">
      <header className="rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_25%_15%,#165f67_0%,#18314d_56%,#0e1724_100%)] p-6 shadow-lg">
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">Sources</p>
        <h1 className="mt-2 text-3xl font-semibold">Source Library</h1>
        <p className="mt-2 max-w-3xl text-sm text-white/85">
          Search, filter, and manage your source documents. Upload is now a quick modal action so the page stays focused on the library.
        </p>

        <button
          type="button"
          onClick={() => setShowUploadModal(true)}
          className="mt-5 rounded-lg bg-cyan-300 px-4 py-2 text-sm font-semibold text-black transition hover:bg-cyan-200"
        >
          Upload New Sources
        </button>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-cyan-100">Total Sources</p>
          <p className="mt-2 text-3xl font-semibold">{pagination.total}</p>
        </article>
        <article className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-emerald-100">Showing</p>
          <p className="mt-2 text-3xl font-semibold">{filteredHistory.length}</p>
        </article>
        <article className="rounded-2xl border border-fuchsia-300/20 bg-fuchsia-300/10 p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-fuchsia-100">Page</p>
          <p className="mt-2 text-3xl font-semibold">{pagination.current_page}/{pagination.last_page}</p>
        </article>
        <article className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-amber-100">Per Page</p>
          <p className="mt-2 text-3xl font-semibold">{pagination.per_page}</p>
        </article>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">Documents</h2>
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search source title/type/workspace"
            className="w-full max-w-md rounded-lg border border-white/20 bg-[#0b1320] px-3 py-2 text-sm outline-none focus:border-cyan-300"
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {availableTypes.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setTypeFilter(type)}
              className={`rounded-full border px-3 py-1 text-xs ${
                typeFilter === type
                  ? "border-cyan-300 bg-cyan-300/20 text-cyan-100"
                  : "border-white/20 bg-white/5 text-white/80"
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {loadingHistory ? <p className="mt-4 text-sm text-white/70">Loading upload history...</p> : null}
        {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
        {success ? <p className="mt-3 text-sm text-emerald-300">{success}</p> : null}

        {!loadingHistory && filteredHistory.length === 0 ? (
          <p className="mt-4 text-sm text-white/70">No uploaded sources yet.</p>
        ) : null}

        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredHistory.map((item) => (
            <article key={item.id} className="rounded-xl border border-white/15 bg-black/25 p-4">
              <p className="line-clamp-2 text-sm font-semibold">{item.title}</p>
              <p className="mt-2 text-xs text-white/65">Type: {item.doc_type || "unknown"}</p>
              <p className="mt-1 text-xs text-white/65">Chunks: {item.chunks_count ?? 0}</p>
              <p className="mt-1 text-xs text-white/65">Scope: {item.source_scope || "unknown"}</p>
              {item.workspace_name ? (
                <p className="mt-1 text-xs text-white/65">Workspace: {item.workspace_name}</p>
              ) : null}

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => openPreview(item, 1)}
                  className="rounded-lg border border-cyan-300/30 px-3 py-1 text-xs text-cyan-100 hover:bg-cyan-300/10"
                >
                  Preview Chunks
                </button>

                <button
                  type="button"
                  onClick={() => onDelete(item.id)}
                  className="rounded-lg border border-rose-200/30 px-3 py-1 text-xs text-rose-200 hover:bg-rose-300/10"
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setActivePage((p) => Math.max(1, p - 1))}
            disabled={activePage <= 1}
            className="rounded-lg border border-white/20 px-3 py-1 text-sm text-white/80 disabled:opacity-40"
          >
            Previous
          </button>

          <p className="text-xs text-white/65">Page {pagination.current_page} of {pagination.last_page}</p>

          <button
            type="button"
            onClick={() => setActivePage((p) => Math.min(pagination.last_page, p + 1))}
            disabled={activePage >= pagination.last_page}
            className="rounded-lg border border-white/20 px-3 py-1 text-sm text-white/80 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </section>

      {showUploadModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setShowUploadModal(false)}>
          <div className="w-full max-w-2xl rounded-2xl border border-white/15 bg-[#0b1420] p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Upload New Source Files</h2>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="rounded-lg border border-white/20 px-3 py-1 text-sm text-white/80 hover:bg-white/10"
              >
                Close
              </button>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="text-sm">
                Scope
                <select
                  value={scope}
                  onChange={(e) => setScope(e.target.value as UploadScope)}
                  className="mt-2 w-full rounded-lg border border-white/20 bg-[#08111a] px-3 py-2"
                >
                  <option value="organization">organization</option>
                  <option value="personal">personal</option>
                </select>
              </label>

              <label className="text-sm">
                Workspace Name (optional)
                <input
                  type="text"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-white/20 bg-[#08111a] px-3 py-2"
                />
              </label>
            </div>

            <label className="mt-4 block text-sm">
              Files
              <input
                type="file"
                multiple
                onChange={onChooseFiles}
                className="mt-2 block w-full rounded-lg border border-white/20 bg-[#08111a] px-3 py-2 text-sm"
              />
            </label>

            <p className="mt-3 text-xs text-white/65">Selected: {files.length} file(s), {totalSelectedSizeMb} MB total</p>

            <button
              type="button"
              onClick={onUpload}
              disabled={uploading || files.length === 0}
              className="mt-4 rounded-lg bg-cyan-300 px-5 py-2 font-semibold text-black transition hover:bg-cyan-200 disabled:opacity-60"
            >
              {uploading ? "Uploading..." : "Upload Sources"}
            </button>
          </div>
        </div>
      ) : null}

      {previewDoc ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setPreviewDoc(null)}>
          <div className="max-h-[90vh] w-full max-w-4xl overflow-auto rounded-2xl border border-white/15 bg-[#0b1420] p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-cyan-200">Chunk Preview</p>
                <h3 className="mt-1 text-lg font-semibold">{previewDoc.title}</h3>
                <p className="mt-1 text-xs text-white/60">Total chunks: {previewDoc.chunks_count ?? 0}</p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="rounded-lg border border-white/20 px-3 py-1 text-sm text-white/80 hover:bg-white/10"
              >
                Close
              </button>
            </div>

            {loadingPreview ? <p className="mt-4 text-sm text-white/70">Loading chunks...</p> : null}

            <div className="mt-4 space-y-3">
              {previewChunks.map((chunk) => (
                <article key={chunk.id} className="rounded-lg border border-white/10 bg-black/25 p-4">
                  <p className="text-xs uppercase tracking-[0.12em] text-cyan-200">Chunk #{chunk.chunk_index}</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-white/85">{chunk.text}</p>
                  {chunk.token_count ? <p className="mt-2 text-xs text-white/60">Tokens: {chunk.token_count}</p> : null}
                </article>
              ))}
              {!loadingPreview && previewChunks.length === 0 ? (
                <p className="text-sm text-white/70">No chunks available yet. Ingestion may still be processing.</p>
              ) : null}
            </div>

            <div className="mt-5 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  const next = Math.max(1, previewPage - 1);
                  if (previewDoc) void openPreview(previewDoc, next);
                }}
                disabled={previewPage <= 1 || loadingPreview}
                className="rounded-lg border border-white/20 px-3 py-1 text-sm text-white/80 disabled:opacity-40"
              >
                Previous
              </button>

              <p className="text-xs text-white/65">Page {previewPagination.current_page} of {previewPagination.last_page} ({previewPagination.total} chunks)</p>

              <button
                type="button"
                onClick={() => {
                  const next = Math.min(previewPagination.last_page, previewPage + 1);
                  if (previewDoc) void openPreview(previewDoc, next);
                }}
                disabled={previewPage >= previewPagination.last_page || loadingPreview}
                className="rounded-lg border border-white/20 px-3 py-1 text-sm text-white/80 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
