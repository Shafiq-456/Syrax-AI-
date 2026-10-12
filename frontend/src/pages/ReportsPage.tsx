/**
 * ReportsPage.tsx — Intelligence Reports Library.
 * Browse, search, filter, and access all generated intelligence reports
 * and historical dossiers.
 */
import { useEffect, useState } from "react";
import { getIdeas, deleteIdea, IdeaListItem } from "../api";

interface Props {
  onOpenReport: (ideaId: number, versionId?: number) => void;
  onNewAnalysis: () => void;
}

export default function ReportsPage({ onOpenReport, onNewAnalysis }: Props) {
  const [reports, setReports] = useState<IdeaListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    loadReports();
  }, []);

  async function loadReports() {
    setLoading(true);
    try {
      const data = await getIdeas();
      // Filter to only ideas that have generated reports
      setReports(data.filter((item) => item.has_report));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number, e: React.MouseEvent) {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this research dossier?")) return;
    setDeletingId(id);
    try {
      await deleteIdea(id);
      setReports((prev) => prev.filter((r) => r.id !== id));
    } catch (e) {
      console.error(e);
    } finally {
      setDeletingId(null);
    }
  }

  const filtered = reports.filter((r) =>
    r.raw_text.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
            <span className="badge badge-cyan">Reports Archive</span>
            <span className="badge badge-muted">{reports.length} Validated Dossiers</span>
          </div>
          <h1 style={{ fontSize: "2.2rem" }}>Intelligence Reports</h1>
          <p style={{ maxWidth: 650, color: "var(--text-secondary)" }}>
            Access complete validation reports, novelty assessments, competitive research matrices, and implementation roadmaps.
          </p>
        </div>

        <button onClick={onNewAnalysis} className="btn btn-primary">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5v14M5 12h14" />
          </svg>
          New Analysis
        </button>
      </div>

      {/* Search Input */}
      <div className="glass-panel" style={{ padding: "1rem 1.25rem" }}>
        <input
          type="text"
          className="syrax-input"
          placeholder="Filter saved reports by project idea keywords..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* List */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "4rem 0", color: "var(--text-muted)" }}>
          <span className="spinner-dots"><span /><span /><span /></span>
          <p style={{ marginTop: "1rem", fontFamily: "var(--font-mono)", fontSize: "0.85rem" }}>Loading dossiers from SQLite...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-panel" style={{ padding: "4rem 2rem", textAlign: "center" }}>
          <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>📑</div>
          <h3 style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>No intelligence reports found</h3>
          <p style={{ color: "var(--text-secondary)", maxWidth: 450, margin: "0 auto 1.5rem" }}>
            {search ? "No reports match your search query." : "You haven't run any project idea validations yet."}
          </p>
          <button onClick={onNewAnalysis} className="btn btn-primary">
            Run First Analysis
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: "1.5rem" }}>
          {filtered.map((item) => {
            const score = item.latest_score ?? 0;
            const badgeClass = score >= 70 ? "badge-cyan" : score >= 45 ? "badge-amber" : "badge-rose";
            const dateStr = new Date(item.created_at).toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
            });

            return (
              <div
                key={item.id}
                className="glass-panel-interactive"
                style={{
                  padding: "1.75rem",
                  borderRadius: "var(--radius-lg)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "1.25rem",
                  cursor: "pointer",
                }}
                onClick={() => onOpenReport(item.id, item.latest_version_id || undefined)}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.75rem" }}>
                  <span className={`badge ${badgeClass}`}>
                    Score: {score}/100
                  </span>
                  <span style={{ fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
                    {dateStr}
                  </span>
                </div>

                <div
                  style={{
                    fontSize: "0.95rem",
                    fontWeight: 500,
                    color: "var(--text-primary)",
                    lineHeight: 1.6,
                    display: "-webkit-box",
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {item.raw_text}
                </div>

                <div
                  style={{
                    marginTop: "auto",
                    paddingTop: "1rem",
                    borderTop: "1px solid var(--border)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span style={{ fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
                    {item.versions_count} {item.versions_count === 1 ? "Version" : "Versions"}
                  </span>

                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                    <button
                      onClick={(e) => handleDelete(item.id, e)}
                      disabled={deletingId === item.id}
                      className="btn-icon"
                      title="Delete report"
                      style={{ padding: "0.3rem", color: "var(--text-muted)" }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                      </svg>
                    </button>

                    <span style={{ fontSize: "0.8rem", color: "var(--accent-cyan)", fontWeight: 600 }}>
                      View Report →
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
