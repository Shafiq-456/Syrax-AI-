/**
 * Thin fetch wrappers for the Syrax backend.
 * All API interactions are centralized here.
 */
const BASE_URL = "http://127.0.0.1:8000/api";

export interface AppStats {
  total_ideas: number;
  total_reports: number;
  total_sources: number;
  avg_novelty_score: number;
  demo_mode: boolean;
  llm_model: string;
  environment: string;
}

export interface IdeaListItem {
  id: number;
  raw_text: string;
  created_at: string;
  versions_count: number;
  latest_version_id: number | null;
  latest_score: number | null;
  has_report: boolean;
}

export interface SourceRecord {
  id: number;
  report_version_id: number;
  source_type: "github" | "paper";
  title: string;
  url: string;
  summary: string | null;
}

export async function getStats(): Promise<AppStats> {
  const res = await fetch(`${BASE_URL}/stats`);
  if (!res.ok) throw new Error("Failed to fetch system stats");
  return res.json();
}

export async function getIdeas(): Promise<IdeaListItem[]> {
  const res = await fetch(`${BASE_URL}/ideas`);
  if (!res.ok) throw new Error("Failed to fetch ideas list");
  return res.json();
}

export async function deleteIdea(ideaId: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/ideas/${ideaId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete idea");
}

export async function getSources(sourceType?: string, query?: string): Promise<SourceRecord[]> {
  const params = new URLSearchParams();
  if (sourceType) params.append("source_type", sourceType);
  if (query) params.append("query", query);
  const res = await fetch(`${BASE_URL}/sources?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch sources");
  return res.json();
}

export async function createIdea(rawText: string): Promise<{ idea_id: number }> {
  const res = await fetch(`${BASE_URL}/ideas`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ raw_text: rawText }),
  });
  if (!res.ok) throw new Error("Failed to create idea");
  return res.json();
}

/** Opens an SSE connection and calls onEvent for every pipeline stage update. */
export function streamPipeline(
  ideaId: number,
  onEvent: (event: { stage: string; status: string; detail?: any }) => void,
  onDone: () => void
): EventSource {
  const source = new EventSource(`${BASE_URL}/ideas/${ideaId}/stream`);
  source.onmessage = (e) => {
    const data = JSON.parse(e.data);
    onEvent(data);
    if (data.stage === "pipeline" && (data.status === "complete" || data.status === "error")) {
      source.close();
      onDone();
    }
  };
  source.onerror = () => {
    source.close();
    onDone();
  };
  return source;
}

/** Triggers revision and streams SSE events for new version */
export async function streamRevise(
  ideaId: number,
  revisedText: string,
  onEvent: (event: { stage: string; status: string; detail?: any }) => void,
  onDone: () => void
): Promise<void> {
  const response = await fetch(`${BASE_URL}/ideas/${ideaId}/revise`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ revised_text: revisedText }),
  });
  if (!response.ok || !response.body) throw new Error("Failed to start revision stream");

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
  const res = await fetch(`${BASE_URL}/ideas/${ideaId}/versions`);
  if (!res.ok) throw new Error("Failed to load versions");
  return res.json();
}

export async function getReport(versionId: number) {
  const res = await fetch(`${BASE_URL}/reports/${versionId}`);
  if (!res.ok) throw new Error("Report not ready");
  return res.json();
}

export function exportReportUrl(versionId: number, format: "markdown" | "pdf") {
  return `${BASE_URL}/reports/${versionId}/export?format=${format}`;
}
