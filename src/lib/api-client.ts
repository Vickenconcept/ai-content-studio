import { getToken } from "@/lib/auth";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

const CLIENT_APP =
  process.env.NEXT_PUBLIC_CLIENT_APP || "content_studio_web";

type ApiError = { error?: string; message?: string };

async function request<T>(
  path: string,
  options: RequestInit = {},
  withAuth = true,
): Promise<T> {
  const token = withAuth ? getToken() : null;
  const headers: HeadersInit = {
    Accept: "application/json",
    "X-Client-App": CLIENT_APP,
    ...(options.headers || {}),
  };

  if (options.body && !(options.body instanceof FormData)) {
    (headers as Record<string, string>)["Content-Type"] = "application/json";
  }

  if (token) {
    (headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const parsed = (data || {}) as ApiError;
    throw new Error(parsed.error || parsed.message || `HTTP ${response.status}`);
  }

  return data as T;
}

export type AuthResponse = {
  user: {
    id: number;
    name: string;
    email: string;
    org_id: string;
    registered_from?: string;
  };
  token: string;
};

export type DocumentItem = {
  id: string;
  title: string;
  doc_type?: string;
  tags?: string[];
  source?: string;
  chunks_count?: number;
  created_at?: string;
  source_scope?: string;
  workspace_name?: string;
};

export type DocumentsResponse = {
  success: boolean;
  data: DocumentItem[];
  pagination?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
  };
};

export type ManualUploadResponse = {
  success: boolean;
  message: string;
  uploaded_files: Array<{
    id: string;
    title: string;
    size: number;
    mime_type: string;
    status: string;
  }>;
  errors: string[];
  total_files: number;
  total_size: number;
  processing_status: string;
};

export type UploadHistoryResponse = {
  uploads: DocumentItem[];
  pagination?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  message?: string;
};

export type DocumentChunksResponse = {
  success: boolean;
  data: Array<{
    id: string;
    document_id: string;
    chunk_index: number;
    text: string;
    char_start?: number;
    char_end?: number;
    token_count?: number;
  }>;
  pagination?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from?: number | null;
    to?: number | null;
  };
};

export type ContentGenerateResponse = {
  success: boolean;
  data: {
    outputs: Array<{
      type: string;
      title: string;
      content: string;
      cta?: string;
      image_url?: string;
      image_prompt?: string;
      source_document_ids?: string[];
    }>;
    sources: Array<{
      document_id: string;
      title: string;
      doc_type?: string;
      url?: string;
    }>;
    generation?: {
      id: string;
      title: string;
      outputs_count: number;
      images_count: number;
      created_at: string;
    };
  };
  meta?: {
    latency_ms?: number;
  };
};

export type ContentRunSummary = {
  id: string;
  title: string;
  query: string;
  format: string;
  tone: string;
  channel: string;
  outputs_count: number;
  images_count: number;
  status: string;
  created_at: string;
};

export type ContentRunsResponse = {
  success: boolean;
  data: {
    data: ContentRunSummary[];
    pagination: {
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
    };
  };
};

export type ContentOverviewResponse = {
  success: boolean;
  data: {
    totals: {
      runs: number;
      outputs: number;
      images: number;
      last_generated_at?: string;
    };
    recent_runs: Array<{
      id: string;
      title: string;
      format: string;
      outputs_count: number;
      images_count: number;
      created_at: string;
    }>;
    top_output_types: Array<{
      type: string;
      count: number;
    }>;
  };
};

export type ContentRunDetailResponse = {
  success: boolean;
  data: {
    run: {
      id: string;
      title: string;
      query: string;
      format: string;
      tone: string;
      channel: string;
      max_outputs: number;
      outputs_count: number;
      images_count: number;
      source_document_ids: string[];
      source_tags: string[];
      created_at: string;
    };
    items: Array<{
      id: string;
      type: string;
      title: string;
      content: string;
      cta?: string;
      image_url?: string;
      image_prompt?: string;
      source_document_ids?: string[];
    }>;
  };
};

export type AdditionSourceItem = {
  document_id: string;
  title: string;
  excerpt?: string;
};

export type CourseCoachResponse = {
  success: boolean;
  data: {
    answer: string;
    checklist?: string[];
    sources: AdditionSourceItem[];
  };
  meta?: {
    latency_ms?: number;
  };
};

export type PdfChatResponse = {
  success: boolean;
  data: {
    answer: string;
    sources: AdditionSourceItem[];
  };
  meta?: {
    latency_ms?: number;
  };
};

export type ChatSourceItem = {
  document_id: string;
  title: string;
  url?: string;
  excerpt?: string;
  type?: string;
  char_start?: number;
  char_end?: number;
  score?: number;
  doc_type?: string;
  tags?: string[];
  workspace_info?: {
    workspace_name?: string;
    workspace_scope?: string;
    workspace_icon?: string;
    workspace_label?: string;
  };
  metadata?: {
    word_count?: number;
    reading_time_minutes?: number;
    emails?: string[];
    phones?: string[];
    years_mentioned?: string[];
    language?: string;
  };
};

export type ChatAskResponse = {
  answer: string;
  sources: ChatSourceItem[];
  all_sources?: ChatSourceItem[];
  query: string;
  result_count?: number;
  all_sources_count?: number;
  conversation_id: string;
};

export type ConversationSummary = {
  id: string;
  title: string;
  last_message: string | null;
  last_message_at: string;
  created_at: string;
  response_style?: string;
};

export type ConversationMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: ChatSourceItem[];
  created_at: string;
};

export type ConversationDetail = {
  id: string;
  title: string;
  response_style?: string;
  messages: ConversationMessage[];
};

export const api = {
    summarizeDocument(payload: { document_id: string; summary_type: string }) {
      return request<any>("/addition/v1/document/summary", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },

    buildStrategy(payload: { document_id: string; strategy_type: string; goal: string }) {
      return request<any>("/addition/v1/document/strategy", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
  login(email: string, password: string) {
    return request<AuthResponse>(
      "/auth/login",
      {
        method: "POST",
        body: JSON.stringify({ email, password }),
      },
      false,
    );
  },

  register(name: string, email: string, password: string, passwordConfirmation: string) {
    return request<AuthResponse>(
      "/auth/register",
      {
        method: "POST",
        body: JSON.stringify({
          name,
          email,
          password,
          password_confirmation: passwordConfirmation,
          registered_from: CLIENT_APP,
        }),
      },
      false,
    );
  },

  getDocuments(options?: { q?: string; limit?: number }) {
    const params = new URLSearchParams();
    if (options?.q) {
      params.set("q", options.q);
    }
    if (options?.limit) {
      params.set("limit", String(options.limit));
    }

    const query = params.toString();
    return request<DocumentsResponse>(`/documents${query ? `?${query}` : ""}`);
  },

  uploadManualSources(files: File[], options?: { connection_scope?: "personal" | "organization"; workspace_name?: string }) {
    const body = new FormData();
    files.forEach((file) => body.append("files[]", file));

    if (options?.connection_scope) {
      body.append("connection_scope", options.connection_scope);
    }
    if (options?.workspace_name) {
      body.append("workspace_name", options.workspace_name);
    }

    return request<ManualUploadResponse>("/connectors/manual-upload/upload", {
      method: "POST",
      body,
    });
  },

  getManualUploadHistory(page = 1) {
    return request<UploadHistoryResponse>(`/connectors/manual-upload/history?page=${page}`);
  },

  deleteManualUpload(documentId: string) {
    return request<{ message: string }>(`/connectors/manual-upload/${documentId}`, {
      method: "DELETE",
    });
  },

  getDocumentChunks(documentId: string, page = 1) {
    return request<DocumentChunksResponse>(`/documents/${documentId}/chunks?page=${page}`);
  },

  generateContent(payload: {
    query: string;
    document_ids: string[];
    format: string;
    tone: string;
    channel: string;
    max_outputs: number;
    search_scope: string;
  }) {
    return request<ContentGenerateResponse>("/addition/v1/content/generate", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  getContentOverview() {
    return request<ContentOverviewResponse>("/addition/v1/content/overview");
  },

  getContentRuns(perPage = 20) {
    return request<ContentRunsResponse>(`/addition/v1/content/runs?per_page=${perPage}`);
  },

  getContentRun(runId: string) {
    return request<ContentRunDetailResponse>(`/addition/v1/content/runs/${runId}`);
  },

  courseCoach(payload: {
    question: string;
    document_ids?: string[];
    mode?: "coach" | "explain" | "quiz" | "recap";
    response_style?: "concise" | "structured" | "deep";
    include_checklist?: boolean;
  }) {
    return request<CourseCoachResponse>("/addition/v1/course/coach", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  pdfChat(payload: {
    document_id: string;
    query: string;
    top_k?: number;
    response_style?: "concise" | "structured" | "deep" | "bullet_brief";
  }) {
    return request<PdfChatResponse>("/addition/v1/pdf/chat", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async chat(payload: {
    query: string;
    conversation_id?: string;
    top_k?: number;
    search_scope?: "both" | "organization" | "personal";
    max_sources?: number;
  }) {
    const response = await request<ChatAskResponse | { success?: boolean; data?: ChatAskResponse }>("/chat", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const maybeWrapped = response as { data?: ChatAskResponse };
    return maybeWrapped.data && typeof maybeWrapped.data === "object"
      ? maybeWrapped.data
      : (response as ChatAskResponse);
  },

  async getConversations() {
    const response = await request<{ success: boolean; data: ConversationSummary[] | { data?: ConversationSummary[] } }>("/conversations");
    const rawData = response.data;
    const normalized = Array.isArray(rawData)
      ? rawData
      : (rawData?.data || []);

    return {
      ...response,
      data: normalized,
    } as { success: boolean; data: ConversationSummary[] };
  },

  async getConversation(id: string) {
    const response = await request<ConversationDetail | { success?: boolean; data?: ConversationDetail }>(`/conversations/${id}`);
    const maybeWrapped = response as { data?: ConversationDetail };
    return maybeWrapped.data && typeof maybeWrapped.data === "object"
      ? maybeWrapped.data
      : (response as ConversationDetail);
  },

  deleteConversation(id: string) {
    return request<{ message: string }>(`/conversations/${id}`, {
      method: "DELETE",
    });
  },
};
