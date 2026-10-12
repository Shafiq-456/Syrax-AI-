/**
 * DashboardPage.tsx — Production Dashboard for Syrax AI.
 * Displays real analytics from the SQLite database, recent project idea runs,
 * novelty scores, iteration history, and fast navigation to new or existing reports.
 */
import { useEffect, useState } from "react";
import { getStats, getIdeas, deleteIdea, AppStats, IdeaListItem } from "../api";

interface Props {
  onNewAnalysis: () => void;
  onOpenReport: (ideaId: number, versionId?: number) => void;
}

export default function DashboardPage({ onNewAnalysis, onOpenReport }: Props) {
  const [stats, setStats] = useState<AppStats | null>(null);
  const [ideas, setIdeas] = useState<IdeaListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<IdeaListItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [s, i] = await Promise.all([getStats(), getIdeas()]);
      setStats(s);
      setIdeas(i);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteIdea(deleteTarget.id);
      setIdeas((prev) => prev.filter((item) => item.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (e) {
      console.error(e);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
      {/* Welcome Banner */}
      <div
        className="glass-panel-elevated"
        style={{
          padding: "2.5rem",
          borderRadius: "var(--radius-lg)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: "450px",
            height: "100%",
            background: "radial-gradient(circle at 80% 20%, rgba(0, 240, 255, 0.12), transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.75rem" }}>
          <span className="badge badge-cyan">
            <span className="status-dot status-dot-pulse" style={{ background: "var(--cyan)" }} />
            {stats?.demo_mode ? "AI Research Engine · Demo Mode" : "AI Research Engine · Live"}
          </span>
          <span className="badge badge-muted">v0.9.4 Preview</span>
        </div>

        <h1 style={{ fontSize: "2.6rem", marginBottom: "0.6rem" }}>
          Syrax AI Project Intelligence
        </h1>
        <p style={{ maxWidth: 640, fontSize: "1.05rem", color: "var(--text-secondary)", marginBottom: "1.75rem" }}>
          From raw ideas to research-backed innovation. Discover what already exists on GitHub and arXiv, pinpoint unaddressed market gaps, and build what matters.
        </p>

        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <button onClick={onNewAnalysis} className="btn btn-primary btn-lg">
            <span>+</span> Validate New Idea
          </button>
        </div>
      </div>

      {/* Real Statistics Metrics Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "1.25rem",
        }}
      >
        <div className="glass-panel" style={{ padding: "1.5rem" }}>
          <div style={{ fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)", textTransform: "uppercase" }}>
            Total Validations
          </div>
          <div style={{ fontSize: "2.2rem", fontWeight: 800, color: "var(--text-primary)", marginTop: "0.4rem" }}>
            {loading ? "..." : stats?.total_ideas ?? 0}
          </div>
          <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginTop: "0.2rem" }}>
            Project ideas processed
          </div>
        </div>

        <div className="glass-panel" style={{ padding: "1.5rem" }}>
          <div style={{ fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)", textTransform: "uppercase" }}>
            Intelligence Reports
          </div>
          <div style={{ fontSize: "2.2rem", fontWeight: 800, color: "var(--cyan)", marginTop: "0.4rem" }}>
            {loading ? "..." : stats?.total_reports ?? 0}
          </div>
          <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginTop: "0.2rem" }}>
            Multi-version generated reports
          </div>
        </div>

        <div className="glass-panel" style={{ padding: "1.5rem" }}>
          <div style={{ fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)", textTransform: "uppercase" }}>
            Indexed Citations
          </div>
          <div style={{ fontSize: "2.2rem", fontWeight: 800, color: "var(--violet)", marginTop: "0.4rem" }}>
            {loading ? "..." : stats?.total_sources ?? 0}
          </div>
          <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginTop: "0.2rem" }}>
            GitHub repos & arXiv papers
          </div>
        </div>

        <div className="glass-panel" style={{ padding: "1.5rem" }}>
          <div style={{ fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)", textTransform: "uppercase" }}>
            Avg Novelty Rating
          </div>
          <div style={{ fontSize: "2.2rem", fontWeight: 800, color: "var(--emerald)", marginTop: "0.4rem" }}>
            {loading ? "..." : `${stats?.avg_novelty_score ?? 0}%`}
          </div>
          <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginTop: "0.2rem" }}>
            Uniqueness across portfolio
          </div>
        </div>
      </div>

      {/* Recent Projects Table & Activity */}
      <div className="glass-panel" style={{ padding: "1.75rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <div>
            <h3>Recent Project Idea Analyses</h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
              All projects validated through the multi-stage research and RAG pipeline
            </p>
          </div>
          <button onClick={loadData} className="btn btn-ghost btn-sm">
            ↻ Refresh
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem" }}>
            <span className="status-dot status-dot-pulse" style={{ background: "var(--cyan)" }} />
            <p style={{ marginTop: "0.5rem" }}>Loading database records...</p>
          </div>
        ) : ideas.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem 1rem", border: "1px dashed var(--border-medium)", borderRadius: "var(--radius-md)" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>💡</div>
            <h4>No project ideas validated yet</h4>
            <p style={{ maxWidth: 420, margin: "0.5rem auto 1.5rem", fontSize: "0.9rem" }}>
              Start by typing any project concept to search GitHub repositories and academic literature.
            </p>
            <button onClick={onNewAnalysis} className="btn btn-primary btn-sm">
              Validate First Idea
            </button>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-subtle)", color: "var(--text-muted)", fontSize: "0.75rem", fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>
                  <th style={{ padding: "0.75rem 1rem" }}>Project Idea</th>
                  <th style={{ padding: "0.75rem 1rem" }}>Novelty</th>
                  <th style={{ padding: "0.75rem 1rem" }}>Versions</th>
                  <th style={{ padding: "0.75rem 1rem" }}>Analyzed Date</th>
                  <th style={{ padding: "0.75rem 1rem", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {ideas.map((item) => {
                  const score = item.latest_score;
                  const scoreBadgeClass =
                    score === null
                      ? "badge-muted"
                      : score >= 70
                      ? "badge-cyan"
                      : score >= 45
                      ? "badge-amber"
                      : "badge-rose";

                  const formattedDate = new Date(item.created_at).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  });

                  return (
                    <tr
                      key={item.id}
                      style={{
                        borderBottom: "1px solid var(--border-subtle)",
                        transition: "background 0.15s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <td style={{ padding: "1rem", maxWidth: 360 }}>
                        <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "0.92rem", lineHeight: 1.4 }}>
                          {item.raw_text.length > 90 ? item.raw_text.slice(0, 90) + "..." : item.raw_text}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.2rem", fontFamily: "var(--font-mono)" }}>
                          Idea #{item.id}
                        </div>
                      </td>

                      <td style={{ padding: "1rem" }}>
                        <span className={`badge ${scoreBadgeClass}`}>
                          {score !== null ? `${Math.round(score)} / 100` : "Pending"}
                        </span>
                      </td>

                      <td style={{ padding: "1rem" }}>
                        <span style={{ fontSize: "0.85rem", fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>
                          v{item.versions_count}
                        </span>
                      </td>

                      <td style={{ padding: "1rem", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                        {formattedDate}
                      </td>

                      <td style={{ padding: "1rem", textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "0.5rem" }}>
                          {item.latest_version_id && (
                            <button
                              onClick={() => onOpenReport(item.id, item.latest_version_id!)}
                              className="btn btn-sm btn-secondary"
                            >
                              Report ↗
                            </button>
                          )}
                          <button
                            onClick={() => setDeleteTarget(item)}
                            className="btn btn-sm btn-ghost"
                            title="Delete idea"
                            style={{ color: "var(--text-dim)" }}
                          >
                            ✕
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteTarget && (
        <div className="modal-overlay">
          <div className="glass-panel-elevated" style={{ maxWidth: 460, width: "100%", padding: "2rem" }}>
            <h3 style={{ marginBottom: "0.75rem", color: "var(--rose)" }}>Delete Project Idea?</h3>
            <p style={{ fontSize: "0.92rem", color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
              Are you sure you want to delete Idea #{deleteTarget.id}? This will permanently remove its associated research reports and citations from the database.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
              <button
                disabled={deleting}
                onClick={() => setDeleteTarget(null)}
                className="btn btn-secondary btn-sm"
              >
                Cancel
              </button>
              <button
                disabled={deleting}
                onClick={confirmDelete}
                className="btn btn-danger btn-sm"
              >
                {deleting ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
