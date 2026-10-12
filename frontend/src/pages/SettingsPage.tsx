/**
 * SettingsPage.tsx — System Status, Intelligence Pipeline Diagnostics & Architecture.
 * Displays real backend configuration, live health check with ping latency,
 * model settings, storage telemetry, and architecture diagram.
 */
import { useEffect, useState } from "react";
import { getStats, AppStats } from "../api";

export default function SettingsPage() {
  const [stats, setStats] = useState<AppStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [pingMs, setPingMs] = useState<number | null>(null);
  const [pingStatus, setPingStatus] = useState<"checking" | "online" | "offline">("checking");

  useEffect(() => {
    checkHealth();
  }, []);

  async function checkHealth() {
    setLoading(true);
    setPingStatus("checking");
    const start = performance.now();
    try {
      const data = await getStats();
      const elapsed = Math.round(performance.now() - start);
      setStats(data);
      setPingMs(elapsed);
      setPingStatus("online");
    } catch (e) {
      setPingStatus("offline");
      setPingMs(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
      {/* Header */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
          <span className="badge badge-cyan">System & Diagnostics</span>
          <span className={`badge ${pingStatus === "online" ? "badge-emerald" : pingStatus === "offline" ? "badge-rose" : "badge-amber"}`}>
            ● {pingStatus === "online" ? `Engine Connected (${pingMs}ms)` : pingStatus === "offline" ? "Engine Offline" : "Checking..."}
          </span>
        </div>
        <h1 style={{ fontSize: "2.2rem" }}>Platform Telemetry & Architecture</h1>
        <p style={{ maxWidth: 650, color: "var(--text-secondary)" }}>
          Monitor live backend pipeline health, LLM provider routing, database storage metrics, and system configuration.
        </p>
      </div>

      {/* Grid of System Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "1.5rem",
        }}
      >
        {/* Core Engine Card */}
        <div className="glass-panel" style={{ padding: "1.75rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "0.78rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)", textTransform: "uppercase" }}>
              Inference & Analysis Model
            </span>
            <span className="badge badge-cyan">Production</span>
          </div>
          <div style={{ fontSize: "1.35rem", fontWeight: 700, color: "#fff" }}>
            {stats?.llm_model || "grok-3-mini"}
          </div>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
            Configured for rigorous project decomposition, academic research synthesis, and grounded gap identification.
          </p>
          <div style={{ marginTop: "auto", paddingTop: "1rem", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", fontSize: "0.78rem", fontFamily: "var(--font-mono)" }}>
            <span style={{ color: "var(--text-muted)" }}>Execution Mode:</span>
            <span style={{ color: stats?.demo_mode ? "var(--accent-amber)" : "var(--accent-emerald)", fontWeight: 600 }}>
              {stats?.demo_mode ? "Self-Contained Demo Mode" : "Live API Provider"}
            </span>
          </div>
        </div>

        {/* Database & Storage Card */}
        <div className="glass-panel" style={{ padding: "1.75rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "0.78rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)", textTransform: "uppercase" }}>
              Relational & Vector Storage
            </span>
            <span className="badge badge-violet">Persistent</span>
          </div>
          <div style={{ fontSize: "1.35rem", fontWeight: 700, color: "#fff" }}>
            SQLite + ChromaDB
          </div>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
            SQLite stores ideas, versioned dossiers, and raw citations. ChromaDB vectors index GitHub READMEs and arXiv abstracts.
          </p>
          <div style={{ marginTop: "auto", paddingTop: "1rem", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", fontSize: "0.78rem", fontFamily: "var(--font-mono)" }}>
            <span style={{ color: "var(--text-muted)" }}>Database File:</span>
            <span style={{ color: "var(--text-primary)" }}>syrax.db (Local)</span>
          </div>
        </div>

        {/* Real-time Health Diagnostics */}
        <div className="glass-panel" style={{ padding: "1.75rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "0.78rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)", textTransform: "uppercase" }}>
              Backend API Ping
            </span>
            <button
              onClick={checkHealth}
              disabled={loading}
              className="btn btn-secondary"
              style={{ padding: "0.25rem 0.6rem", fontSize: "0.72rem" }}
            >
              {loading ? "Testing..." : "↻ Test Ping"}
            </button>
          </div>
          <div style={{ fontSize: "1.35rem", fontWeight: 700, color: pingStatus === "online" ? "var(--accent-emerald)" : "var(--accent-rose)" }}>
            {pingStatus === "online" ? `${pingMs} ms Response Time` : "Offline / Unreachable"}
          </div>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
            Communicating with FastAPI server at <code style={{ color: "var(--accent-cyan)" }}>http://127.0.0.1:8000</code> via native CORS.
          </p>
          <div style={{ marginTop: "auto", paddingTop: "1rem", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", fontSize: "0.78rem", fontFamily: "var(--font-mono)" }}>
            <span style={{ color: "var(--text-muted)" }}>Transport:</span>
            <span style={{ color: "var(--text-primary)" }}>HTTP/1.1 SSE (Streaming)</span>
          </div>
        </div>
      </div>

      {/* Pipeline Architecture Visualizer */}
      <div className="glass-panel" style={{ padding: "2rem" }}>
        <div style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.25rem", marginBottom: "0.35rem" }}>Multi-Stage Analysis Pipeline Architecture</h2>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
            The 8 deterministic pipeline stages that validate and substantiate each project idea.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
          {[
            { num: "01", name: "Idea Interpretation", desc: "Decomposes premise into domain, audience, approach, and semantic queries." },
            { num: "02", name: "Multi-Source Search", desc: "Cross-queries GitHub public repositories and Semantic Scholar papers." },
            { num: "03", name: "ChromaDB Embedding", desc: "Ingests raw text and generates dense vectors with all-MiniLM-L6-v2." },
            { num: "04", name: "Similarity & Novelty", desc: "Calculates mathematical cosine similarity and composite novelty score." },
            { num: "05", name: "Innovation Gap Audit", desc: "Extracts technical boundaries and unmet user requirements." },
            { num: "06", name: "Grounded Solutions", desc: "Formulates evidence-backed recommendations linked to source URLs." },
            { num: "07", name: "Architecture & Roadmap", desc: "Proposes frontend, backend, database stack and phased milestones." },
            { num: "08", name: "Report Synthesis", desc: "Assembles immutable versioned JSON and Markdown dossier." },
          ].map((st) => (
            <div
              key={st.num}
              style={{
                padding: "1.2rem",
                borderRadius: "var(--radius-md)",
                background: "rgba(255, 255, 255, 0.02)",
                border: "1px solid var(--border)",
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "0.72rem", fontFamily: "var(--font-mono)", color: "var(--accent-cyan)", fontWeight: 700 }}>
                  STAGE {st.num}
                </span>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent-cyan)", opacity: 0.7 }} />
              </div>
              <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--text-primary)" }}>{st.name}</div>
              <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", lineHeight: 1.5 }}>{st.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Brand & Manifesto */}
      <div
        className="glass-panel"
        style={{
          padding: "2rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1.5rem",
        }}
      >
        <div>
          <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#fff", marginBottom: "0.25rem" }}>
            Syrax AI · Research & Innovation Platform
          </div>
          <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
            &ldquo;Discover what already exists. Understand what is missing. Build what matters.&rdquo;
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <a
            href="http://127.0.0.1:8000/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
            style={{ fontSize: "0.8rem", textDecoration: "none" }}
          >
            FastAPI Swagger Docs ↗
          </a>
        </div>
      </div>
    </div>
  );
}
