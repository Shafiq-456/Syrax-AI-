/**
 * ResearchExplorerPage.tsx — Dedicated Research Material & Source Explorer.
 * Allows filtering, live searching, and inspecting all discovered GitHub repos
 * and academic research papers across analyses.
 */
import { useEffect, useState } from "react";
import { getSources, SourceRecord } from "../api";

export default function ResearchExplorerPage() {
  const [sources, setSources] = useState<SourceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<"" | "github" | "paper">("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadSources();
  }, [typeFilter]);

  async function loadSources() {
    setLoading(true);
    setError(null);
    try {
      const data = await getSources(typeFilter || undefined, searchQuery || undefined);
      setSources(data);
    } catch (err: any) {
      setError(err.message || "Failed to load sources");
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    loadSources();
  }

  const githubCount = sources.filter((s) => s.source_type === "github").length;
  const paperCount = sources.filter((s) => s.source_type === "paper").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {/* Page Header */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
          <span className="badge badge-cyan">Intelligence Database</span>
          <span className="badge badge-muted">{sources.length} Indexed Records</span>
        </div>
        <h1 style={{ fontSize: "2.2rem" }}>Research Discovery Explorer</h1>
        <p style={{ maxWidth: 650, color: "var(--text-secondary)" }}>
          Browse and filter indexed GitHub repositories, open-source projects, and peer-reviewed arXiv academic papers discovered during project idea validations.
        </p>
      </div>

      {/* Filter and Search Controls */}
      <div className="glass-panel" style={{ padding: "1.25rem 1.5rem" }}>
        <form onSubmit={handleSearch} style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
          {/* Search bar */}
          <div style={{ flex: 1, minWidth: 260, position: "relative" }}>
            <input
              type="text"
              className="input-field"
              placeholder="Search by keywords, algorithms, domain..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Type filters */}
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              type="button"
              className={`btn btn-sm ${typeFilter === "" ? "btn-secondary" : "btn-ghost"}`}
              style={{ borderColor: typeFilter === "" ? "var(--cyan)" : undefined }}
              onClick={() => setTypeFilter("")}
            >
              All Types ({sources.length})
            </button>
            <button
              type="button"
              className={`btn btn-sm ${typeFilter === "github" ? "btn-secondary" : "btn-ghost"}`}
              style={{ borderColor: typeFilter === "github" ? "var(--cyan)" : undefined }}
              onClick={() => setTypeFilter("github")}
            >
              GitHub ({githubCount})
            </button>
            <button
              type="button"
              className={`btn btn-sm ${typeFilter === "paper" ? "btn-secondary" : "btn-ghost"}`}
              style={{ borderColor: typeFilter === "paper" ? "var(--violet)" : undefined }}
              onClick={() => setTypeFilter("paper")}
            >
              Papers ({paperCount})
            </button>
          </div>

          <button type="submit" className="btn btn-primary btn-sm">
            Search Sources
          </button>
        </form>
      </div>

      {/* Results grid */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "4rem 0" }}>
          <span className="status-dot status-dot-pulse" style={{ background: "var(--cyan)", width: 12, height: 12 }} />
          <p style={{ marginTop: "1rem", color: "var(--text-secondary)" }}>Querying verified sources...</p>
        </div>
      ) : error ? (
        <div className="glass-panel" style={{ padding: "2rem", textAlign: "center", borderColor: "var(--rose)" }}>
          <p style={{ color: "var(--rose)" }}>{error}</p>
          <button onClick={loadSources} className="btn btn-secondary btn-sm" style={{ marginTop: "1rem" }}>
            Retry
          </button>
        </div>
      ) : sources.length === 0 ? (
        <div className="glass-panel" style={{ padding: "3rem", textAlign: "center" }}>
          <p style={{ color: "var(--text-muted)", fontSize: "1.1rem" }}>No indexed research sources found matching criteria.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: "1.25rem" }}>
          {sources.map((src) => {
            const isPaper = src.source_type === "paper";
            return (
              <div
                key={src.id}
                className="glass-panel"
                style={{
                  padding: "1.5rem",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  borderColor: isPaper ? "rgba(139, 92, 246, 0.2)" : "rgba(0, 240, 255, 0.2)",
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                    <span className={`badge ${isPaper ? "badge-violet" : "badge-cyan"}`}>
                      {isPaper ? "Academic Paper" : "GitHub Repository"}
                    </span>
                    <span style={{ fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
                      Report #{src.report_version_id}
                    </span>
                  </div>

                  <h3 style={{ fontSize: "1.05rem", marginBottom: "0.6rem", lineHeight: 1.4, color: "var(--text-primary)" }}>
                    {src.title}
                  </h3>

                  <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "1rem", lineHeight: 1.6 }}>
                    {src.summary || "No abstract or description provided."}
                  </p>
                </div>

                <div style={{ paddingTop: "0.75rem", borderTop: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 220, whiteSpace: "nowrap" }}>
                    {new URL(src.url).hostname}
                  </span>
                  <a
                    href={src.url}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-sm btn-secondary"
                  >
                    View Source ↗
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
