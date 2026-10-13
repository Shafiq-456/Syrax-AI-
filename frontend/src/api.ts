/**
 * Centralized API client for Syrax AI.
 * Handles JWT authentication, workspace isolation headers, SSE streaming,
 * and REST calls for ideas, dossiers, and research sources.
 */
const BASE_URL = "http://127.0.0.1:8000/api";

const TOKEN_KEY = "syrax_auth_token";

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

function getAuthHeaders(): HeadersInit {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

export interface UserProfile {
  authenticated: boolean;
  user_id: number | null;
  email: string;
  full_name: string;
  workspace_id: number;
  workspace_name: string;
}

export interface AppStats {
  total_ideas: number;
  total_reports: number;
  total_sources: number;
  avg_novelty_score: number;
  demo_mode: boolean;
  llm_model: string;
  environment: string;
  workspace_id?: number;
  workspace_name?: string;
}

export interface IdeaListItem {
  id: number;
  raw_text: string;
  created_at: string;
  versions_count: number;
  latest_version_id: number | null;
  latest_score: number | null;
  has_report: boolean;
  status?: string;
}

export interface SourceRecord {
  id: number;
  report_version_id: number;
  source_type: "github" | "paper";
  title: string;
  url: string;
  summary: string | null;
  provenance?: "live" | "simulated";
}

// ── Auth Services ────────────────────────────────────────────────────────────

export async function loginApi(email: string, password: string) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Authentication failed");
  }
  const data = await res.json();
  if (data.token) setStoredToken(data.token);
  return data;
}

export async function registerApi(email: string, password: string, fullName?: string, workspaceName?: string) {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, full_name: fullName, workspace_name: workspaceName }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Registration failed");
  }
  const data = await res.json();
  if (data.token) setStoredToken(data.token);
  return data;
}

export async function getMeApi(): Promise<UserProfile> {
  const res = await fetch(`${BASE_URL}/auth/me`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Failed to load user profile");
  return res.json();
}

// ── Platform Data ────────────────────────────────────────────────────────────

export async function getStats(): Promise<AppStats> {
  const res = await fetch(`${BASE_URL}/stats`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch system stats");
  return res.json();
}

export async function getIdeas(): Promise<IdeaListItem[]> {
  const res = await fetch(`${BASE_URL}/ideas`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch ideas list");
  return res.json();
}

export async function deleteIdea(ideaId: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/ideas/${ideaId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Failed to delete idea");
}

export async function cancelPipeline(ideaId: number): Promise<void> {
  await fetch(`${BASE_URL}/ideas/${ideaId}/cancel`, {
    method: "POST",
    headers: getAuthHeaders(),
  });
}

export async function getSources(sourceType?: string, query?: string): Promise<SourceRecord[]> {
  const params = new URLSearchParams();
  if (sourceType) params.append("source_type", sourceType);
  if (query) params.append("query", query);
  const res = await fetch(`${BASE_URL}/sources?${params.toString()}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch sources");
  return res.json();
}

export async function createIdea(rawText: string): Promise<{ idea_id: number; workspace_id?: number }> {
  const res = await fetch(`${BASE_URL}/ideas`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ raw_text: rawText }),
  });
  if (!res.ok) throw new Error("Failed to submit idea");
  return res.json();
}

export async function streamPipeline(
  ideaId: number,
  onEvent: (event: { stage: string; status: string; detail?: any }) => void,
  onDone: () => void
): Promise<void> {
  const response = await fetch(`${BASE_URL}/ideas/${ideaId}/stream`, {
    headers: { Accept: "text/event-stream" },
  });

  if (!response.body) throw new Error("No response body");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n\n");
    buffer = lines.pop() || "";

    for (const block of lines) {
      const match = block.match(/^data:\s*(.*)$/m);
      if (match) {
        try {
          const event = JSON.parse(match[1]);
          onEvent(event);
          if (event.stage === "pipeline" && (event.status === "complete" || event.status === "error")) {
            onDone();
            return;
          }
        } catch {}
      }
    }
  }
  onDone();
}

export async function streamRevise(
  ideaId: number,
  revisedText: string,
  onEvent: (event: { stage: string; status: string; detail?: any }) => void,
  onDone: () => void
): Promise<void> {
  const response = await fetch(`${BASE_URL}/ideas/${ideaId}/revise`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ idea_id: ideaId, revised_text: revisedText }),
  });

  if (!response.body) throw new Error("No response body");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n\n");
    buffer = lines.pop() || "";

    for (const block of lines) {
      const match = block.match(/^data:\s*(.*)$/m);
      if (match) {
        try {
          const event = JSON.parse(match[1]);
          onEvent(event);
          if (event.stage === "pipeline" && (event.status === "complete" || event.status === "error")) {
            onDone();
            return;
          }
        } catch {}
      }
    }
  }
  onDone();
}

export async function getVersions(ideaId: number) {
  const res = await fetch(`${BASE_URL}/ideas/${ideaId}/versions`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Failed to load versions");
  return res.json();
}

export async function getReport(versionId: number) {
  const res = await fetch(`${BASE_URL}/reports/${versionId}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Report not ready");
  return res.json();
}

export function exportReportUrl(versionId: number, format: "markdown" | "pdf") {
  return `${BASE_URL}/reports/${versionId}/export?format=${format}`;
}
