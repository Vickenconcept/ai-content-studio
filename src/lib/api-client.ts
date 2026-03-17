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
  chunks_count?: number;
  created_at?: string;
};

export type ContentGenerateResponse = {
  success: boolean;
  data: {
    outputs: Array<{
      type: string;
      title: string;
      content: string;
      cta?: string;
    }>;
    sources: Array<{
      document_id: string;
      title: string;
      doc_type?: string;
      url?: string;
    }>;
  };
  meta?: {
    latency_ms?: number;
  };
};

export const api = {
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

  getDocuments() {
    return request<{ success: boolean; data: DocumentItem[] }>("/documents");
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
};
