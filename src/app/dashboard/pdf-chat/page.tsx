"use client";

import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { api, ChatSourceItem, ConversationSummary } from "@/lib/api-client";

type UiMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: ChatSourceItem[];
  allSources?: ChatSourceItem[];
  totalSourcesCount?: number;
  createdAt: string;
};

const COLLAPSED_SOURCE_COUNT = 3;

function normalizeTags(input: unknown): string[] {
  if (Array.isArray(input)) {
    return input.filter((v) => typeof v === "string").map((v) => v.trim()).filter(Boolean);
  }
  if (typeof input === "string") {
    return input
      .split(/[,;|]/g)
      .map((v) => v.trim())
      .filter(Boolean);
  }
  return [];
}

function truncateText(input: string | undefined, maxLength: number): string {
  if (!input) {
    return "";
  }
  if (input.length <= maxLength) {
    return input;
  }
  return `${input.slice(0, maxLength).trimEnd()}...`;
}

function normalizeAnswer(raw: unknown): string {
  if (typeof raw !== "string") {
    return "";
  }

  const trimmed = raw.trim();
  if (trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed) as { answer?: string };
      if (parsed.answer) {
        return String(parsed.answer).replace(/\\n/g, "\n");
      }
    } catch {
      return raw.replace(/\\n/g, "\n");
    }
  }

  return raw.replace(/\\n/g, "\n");
}

export default function PdfChatPage() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | undefined>(undefined);
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [query, setQuery] = useState("");
  const [maxSources, setMaxSources] = useState(5);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSources, setExpandedSources] = useState<Record<string, boolean>>({});
  const endRef = useRef<HTMLDivElement | null>(null);

  async function loadConversations(showLoader = true) {
    if (showLoader) {
      setIsLoadingConversations(true);
    }
    try {
      const response = await api.getConversations();
      setConversations(response.data || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load conversations");
    } finally {
      if (showLoader) {
        setIsLoadingConversations(false);
      }
    }
  }

  async function loadConversation(id: string) {
    setIsLoadingMessages(true);
    setError(null);
    try {
      const response = await api.getConversation(id);
      const converted: UiMessage[] = (response.messages || []).map((item) => ({
        id: item.id,
        role: item.role,
        content: normalizeAnswer(item.content),
        sources: item.sources || [],
        createdAt: item.created_at,
      }));
      setMessages(converted);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load chat messages");
    } finally {
      setIsLoadingMessages(false);
    }
  }

  useEffect(() => {
    loadConversations(true);
  }, []);

  useEffect(() => {
    if (currentConversationId) {
      loadConversation(currentConversationId);
      return;
    }

    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: "Start a chat and ask questions about your uploaded sources. I will return grounded answers with source excerpts.",
        createdAt: new Date().toISOString(),
        sources: [],
      },
    ]);
  }, [currentConversationId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  const currentConversationTitle = useMemo(() => {
    if (!currentConversationId) {
      return "New Chat";
    }
    const found = conversations.find((c) => c.id === currentConversationId);
    return found?.title || "Conversation";
  }, [conversations, currentConversationId]);

  function startNewChat() {
    setCurrentConversationId(undefined);
    setError(null);
  }

  async function onDeleteConversation(id: string) {
    try {
      await api.deleteConversation(id);
      if (currentConversationId === id) {
        setCurrentConversationId(undefined);
      }
      await loadConversations(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete conversation");
    }
  }

  async function onSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed || isSending) {
      return;
    }

    setError(null);

    const tempUser: UiMessage = {
      id: `temp-user-${Date.now()}`,
      role: "user",
      content: trimmed,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUser]);
    setQuery("");
    setIsSending(true);

    try {
      const response = await api.chat({
        query: trimmed,
        conversation_id: currentConversationId,
        top_k: 8,
        search_scope: "both",
        max_sources: Math.min(20, Math.max(1, maxSources)),
      });

      const assistant: UiMessage = {
        id: `temp-assistant-${Date.now()}`,
        role: "assistant",
        content: normalizeAnswer(response.answer),
        sources: response.sources || [],
        allSources: response.all_sources || [],
        totalSourcesCount: response.all_sources_count,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistant]);

      if (!currentConversationId && response.conversation_id) {
        setCurrentConversationId(response.conversation_id);
      }

      await loadConversations(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send message");
    } finally {
      setIsSending(false);
    }
  }

  function onComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      const form = event.currentTarget.form;
      if (form) {
        form.requestSubmit();
      }
    }
  }

  return (
    <div className="space-y-4">
      <header className="rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_20%_20%,#6f4a1c_0%,#30414f_52%,#121a29_100%)] p-4 shadow-lg">
        <p className="text-xs uppercase tracking-[0.2em] text-amber-200">Feature 03</p>
        <h1 className="mt-1 text-2xl font-semibold">AI Document Chat</h1>
        <p className="mt-1 max-w-3xl text-xs text-white/80">
          Full conversation interface with multiple chats and source-grounded answers from your uploaded documents.
        </p>
      </header>

      {error ? <p className="text-sm text-rose-300">{error}</p> : null}

      <section className="grid gap-5 xl:h-[calc(100vh-235px)] xl:min-h-130 xl:grid-cols-[300px_1fr]">
        <aside className="flex flex-col rounded-2xl border border-white/10 bg-white/5 p-4 xl:min-h-0 xl:h-full">
          <button
            type="button"
            onClick={startNewChat}
            className="w-full rounded-lg bg-cyan-300 px-3 py-2 text-sm font-semibold text-black hover:bg-cyan-200"
          >
            + New Chat
          </button>

          <p className="mt-4 text-xs uppercase tracking-[0.16em] text-white/60">Conversations</p>

          {isLoadingConversations ? <p className="mt-3 text-sm text-white/65">Loading chats...</p> : null}

          <div className="mt-3 max-h-[36vh] space-y-2 overflow-auto pr-1 xl:max-h-none xl:min-h-0 xl:flex-1">
            {conversations.map((conversation) => {
              const active = conversation.id === currentConversationId;
              return (
                <article
                  key={conversation.id}
                  className={`rounded-lg border p-3 ${
                    active
                      ? "border-cyan-300/40 bg-cyan-300/10"
                      : "border-white/15 bg-black/25"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setCurrentConversationId(conversation.id)}
                    className="w-full text-left"
                  >
                    <p className="line-clamp-1 text-sm font-semibold text-white/90">{conversation.title}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-white/60">{conversation.last_message || "No messages yet"}</p>
                  </button>

                  <div className="mt-2 flex items-center justify-between gap-2">
                    <p className="text-[11px] text-white/45">
                      {new Date(conversation.last_message_at || conversation.created_at).toLocaleString()}
                    </p>
                    <button
                      type="button"
                      onClick={() => onDeleteConversation(conversation.id)}
                      className="rounded border border-rose-300/30 px-2 py-1 text-[11px] text-rose-200 hover:bg-rose-300/10"
                    >
                      Delete
                    </button>
                  </div>
                </article>
              );
            })}

            {!isLoadingConversations && conversations.length === 0 ? (
              <p className="text-sm text-white/70">No saved chats yet.</p>
            ) : null}
          </div>
        </aside>

        <main className="flex min-h-[62vh] flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/5 xl:h-full xl:min-h-0">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-white/70">{currentConversationTitle}</h2>
            <label className="text-xs text-white/70">
              Max Sources
              <input
                type="number"
                min={1}
                max={20}
                value={maxSources}
                onChange={(e) => setMaxSources(Number(e.target.value || 1))}
                className="ml-2 w-16 rounded border border-white/20 bg-[#0a1420] px-2 py-1 text-white"
              />
            </label>
          </div>

          <div className="flex-1 min-h-0 space-y-4 overflow-auto p-4">
            {isLoadingMessages ? <p className="text-sm text-white/70">Loading messages...</p> : null}

            {messages.map((message) => (
              <article key={message.id} className="space-y-2">
                <div className={`max-w-3xl rounded-xl border px-4 py-3 ${
                  message.role === "user"
                    ? "ml-auto border-cyan-300/30 bg-cyan-300/10"
                    : "border-white/15 bg-black/25"
                }`}>
                  <p className="text-xs uppercase tracking-[0.14em] text-white/60">
                    {message.role === "user" ? "You" : "Assistant"}
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-white/90">{message.content}</p>
                </div>

                {message.role === "assistant" && message.sources?.length ? (
                  <div className="max-w-3xl space-y-2 pl-1">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-white/55">Citations</p>

                    {(() => {
                      const baseSources = (message.allSources && message.allSources.length > 0)
                        ? message.allSources
                        : (message.sources || []);
                      const isExpanded = Boolean(expandedSources[message.id]);
                      const visibleSources = isExpanded
                        ? baseSources
                        : baseSources.slice(0, COLLAPSED_SOURCE_COUNT);
                      const totalCount = message.totalSourcesCount || baseSources.length;
                      const hasMore = totalCount > COLLAPSED_SOURCE_COUNT;

                      return (
                        <>
                          <div className="space-y-2">
                            {visibleSources.map((source, index) => (
                              <article
                                key={`${message.id}-${source.document_id}-${index}`}
                                className="rounded-lg border border-white/15 bg-white/5 p-3"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0 flex-1">
                                    {source.url ? (
                                      <a
                                        href={source.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="line-clamp-1 text-xs font-semibold text-cyan-200 hover:underline"
                                        title={source.title}
                                      >
                                        {source.title}
                                      </a>
                                    ) : (
                                      <p className="line-clamp-1 text-xs font-semibold text-white/90" title={source.title}>
                                        {source.title}
                                      </p>
                                    )}
                                  </div>

                                  {source.url ? (
                                    <a
                                      href={source.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="rounded border border-white/20 px-2 py-1 text-[10px] text-white/75 hover:bg-white/10"
                                      title="Open source in new tab"
                                    >
                                      Open
                                    </a>
                                  ) : null}
                                </div>

                                {source.excerpt ? (
                                  <p className="mt-1 text-xs leading-relaxed text-white/70" title={source.excerpt}>
                                    {truncateText(source.excerpt, 220)}
                                  </p>
                                ) : null}

                                <div className="mt-2 flex flex-wrap gap-1.5">
                                  {source.type ? (
                                    <span className="rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-[10px] text-white/75">
                                      {source.type}
                                    </span>
                                  ) : null}

                                  {source.doc_type ? (
                                    <span className="rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-[10px] capitalize text-white/75">
                                      {source.doc_type.replace(/_/g, " ")}
                                    </span>
                                  ) : null}

                                  {source.metadata?.word_count ? (
                                    <span className="rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-[10px] text-white/75">
                                      {source.metadata.word_count.toLocaleString()} words
                                    </span>
                                  ) : null}

                                  {source.metadata?.reading_time_minutes ? (
                                    <span className="rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-[10px] text-white/75">
                                      {source.metadata.reading_time_minutes} min read
                                    </span>
                                  ) : null}

                                  {normalizeTags(source.tags).slice(0, 4).map((tag) => (
                                    <span
                                      key={`${message.id}-${source.document_id}-${tag}`}
                                      className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-2 py-0.5 text-[10px] text-cyan-100"
                                    >
                                      {tag}
                                    </span>
                                  ))}

                                  {normalizeTags(source.tags).length > 4 ? (
                                    <span className="rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-[10px] text-white/65">
                                      +{normalizeTags(source.tags).length - 4} tags
                                    </span>
                                  ) : null}
                                </div>
                              </article>
                            ))}
                          </div>

                          {hasMore ? (
                            <button
                              type="button"
                              onClick={() => setExpandedSources((prev) => ({
                                ...prev,
                                [message.id]: !prev[message.id],
                              }))}
                              className="text-xs text-cyan-200 underline-offset-2 hover:underline"
                            >
                              {isExpanded
                                ? "Show fewer sources"
                                : `Show more sources (${totalCount - COLLAPSED_SOURCE_COUNT} more)`}
                            </button>
                          ) : null}
                        </>
                      );
                    })()}
                  </div>
                ) : null}
              </article>
            ))}

            {isSending ? (
              <div className="rounded-xl border border-white/15 bg-black/25 px-4 py-3 text-sm text-white/75">
                Assistant is thinking...
              </div>
            ) : null}

            <div ref={endRef} />
          </div>

          <form onSubmit={onSend} className="border-t border-white/10 p-4">
            <label className="block text-xs uppercase tracking-[0.14em] text-white/65">Message</label>
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onComposerKeyDown}
              rows={3}
              placeholder="Ask anything from your uploaded documents..."
              className="mt-2 w-full rounded-lg border border-white/20 bg-[#08111a] px-3 py-2 text-sm outline-none focus:border-cyan-300"
            />
            <div className="mt-3 flex justify-end">
              <button
                type="submit"
                disabled={isSending || !query.trim()}
                className="rounded-lg bg-amber-300 px-5 py-2 text-sm font-semibold text-black hover:bg-amber-200 disabled:opacity-60"
              >
                {isSending ? "Sending..." : "Send"}
              </button>
            </div>
          </form>
        </main>
      </section>
    </div>
  );
}
