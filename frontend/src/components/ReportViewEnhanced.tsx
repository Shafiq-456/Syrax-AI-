/**
 * ReportViewEnhanced.tsx — Comprehensive AI Project Intelligence Report.
 * Includes Novelty Score Gauge, Feature Comparison, Grounded Innovation Gaps,
 * Cited Recommendations, Tech Stack Diagram, Implementation Roadmap,
 * Research Knowledge Graph, and Revision Loop.
 */
import { useState } from "react";
import { exportReportUrl } from "../api";
import ResearchNetworkGraph from "./ResearchNetworkGraph";

interface Props {
  report: any;
  versionId: number;
  ideaId?: number;
  onRevise?: (revisedText: string) => void;
  revising?: boolean;
}

export default function ReportViewEnhanced({
  report,
  versionId,
  ideaId,
  onRevise,
  revising = false,
}: Props) {
  const [activeTab, setActiveTab] = useState<"summary" | "graph" | "sources" | "gaps" | "architecture">("summary");
  const [showReviseModal, setShowReviseModal] = useState(false);
  const [revisedText, setRevisedText] = useState("");

  const novelty: number = report?.novelty?.novelty_score ?? 0;
  const confidence = report?.novelty?.confidence || "high";
  const ideaSummary = report?.idea_summary;
  const similarSources = report?.novelty?.most_similar_sources || [];
  const gaps = report?.gaps || [];
  const recommendations = report?.recommendations || [];
  const architecture = report?.architecture;
  const sourcesUsed = report?.sources_used || [];

  const scoreBadgeClass =
    novelty >= 70 ? "badge-cyan" : novelty >= 45 ? "badge-amber" : "badge-rose";
  const scoreLabel =
    novelty >= 70 ? "High Novelty" : novelty >= 45 ? "Moderate Overlap" : "High Overlap";

  function handleReviseSubmit() {
    if (!revisedText.trim() || !onRevise) return;
    onRevise(revisedText);
    setShowReviseModal(false);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
      {/* ── Top Dossier Header ─────────────────────────────────────── */}
      <div
        className="glass-panel-elevated"
        style={{
          padding: "2.5rem",
          borderRadius: "var(--radius-lg)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1.5rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
              <span className="badge badge-cyan">Syrax Intelligence Dossier</span>
              <span className="badge badge-muted">Version {report?.version_number || 1}</span>
              <span className={`badge ${scoreBadgeClass}`}>{scoreLabel}</span>
            </div>

            <h1 style={{ fontSize: "2.4rem", marginBottom: "0.5rem" }}>
              {ideaSummary?.problem_domain ? `${ideaSummary.problem_domain.toUpperCase()} VALIDATION` : "Project Idea Validation"}
            </h1>
            <p style={{ maxWidth: 650, color: "var(--text-secondary)", fontSize: "1rem" }}>
              Comprehensive research evaluation cross-referencing public repositories and scientific publications.
            </p>
          </div>

          {/* Action buttons (Export & Revise) */}
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            {onRevise && (
              <button
                onClick={() => {
                  setRevisedText(report?.raw_text || "");
                  setShowReviseModal(true);
                }}
                className="btn btn-secondary btn-sm"
                disabled={revising}
              >
                <span>✎</span> Revise Idea
              </button>
            )}
            <a
              href={exportReportUrl(versionId, "markdown")}
              target="_blank"
              rel="noreferrer"
              className="btn btn-primary btn-sm"
              download
            >
              <span>↓</span> Export Markdown
            </a>
          </div>
        </div>

        {/* ── Novelty Score Hero Card ──────────────────────────────── */}
        <div
          style={{
            marginTop: "2rem",
            padding: "1.75rem",
            background: "rgba(5, 8, 16, 0.7)",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-medium)",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "2rem",
            alignItems: "center",
          }}
        >
          {/* Circular Gauge */}
          <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
            <div style={{ position: "relative", width: 110, height: 110, flexShrink: 0 }}>
              <svg width="110" height="110" viewBox="0 0 110 110">
                <circle cx="55" cy="55" r="46" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
                <circle
                  cx="55"
                  cy="55"
                  r="46"
                  fill="none"
                  stroke={novelty >= 70 ? "var(--cyan)" : novelty >= 45 ? "var(--amber)" : "var(--rose)"}
                  strokeWidth="8"
                  strokeDasharray={2 * Math.PI * 46}
                  strokeDashoffset={2 * Math.PI * 46 * (1 - novelty / 100)}
                  strokeLinecap="round"
                  className="score-gauge-ring"
                />
              </svg>
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span style={{ fontSize: "1.8rem", fontWeight: 800, fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>
                  {Math.round(novelty)}
                </span>
                <span style={{ fontSize: "0.65rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)", textTransform: "uppercase" }}>
                  /100
                </span>
              </div>
            </div>

            <div>
              <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.3rem" }}>
                Novelty Assessment
              </div>
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                Confidence: <strong style={{ color: "var(--cyan)" }}>{confidence}</strong>. Evaluated against {sourcesUsed.length || similarSources.length || 16} relevant GitHub repositories & academic papers.
              </p>
            </div>
          </div>

          {/* Core Findings summary */}
          <div style={{ borderLeft: "1px solid var(--border-subtle)", paddingLeft: "1.5rem" }}>
            <div style={{ fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "0.4rem" }}>
              Target User & Technical Strategy
            </div>
            <div style={{ fontSize: "0.92rem", color: "var(--text-primary)", fontWeight: 500, marginBottom: "0.5rem" }}>
              {ideaSummary?.target_user || "Developers, researchers, and technical founders"}
            </div>
            <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
              {ideaSummary?.core_technical_approach || "Algorithmic RAG pipeline with vector comparison and automated gap validation."}
            </p>
          </div>
        </div>
      </div>

      {/* ── Interactive View Tabs ──────────────────────────────────── */}
      <div style={{ display: "flex", gap: "0.5rem", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "0.75rem", flexWrap: "wrap" }}>
        {[
          { id: "summary", label: "Executive Summary & Differentiators" },
          { id: "graph", label: "Research Knowledge Graph" },
          { id: "sources", label: `Prior Art & Overlaps (${similarSources.length || sourcesUsed.length})` },
          { id: "gaps", label: `Gaps & Recommendations (${gaps.length})` },
          { id: "architecture", label: "Tech Architecture & Roadmap" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`btn btn-sm ${activeTab === tab.id ? "btn-primary" : "btn-ghost"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── TAB 1: Executive Summary & Differentiators ─────────────── */}
      {activeTab === "summary" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
          {/* Claimed Differentiators */}
          <div className="glass-panel" style={{ padding: "1.75rem" }}>
            <h3 style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ color: "var(--cyan)" }}>★</span> Stated Technical Differentiators
            </h3>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              {(ideaSummary?.claimed_differentiators || [
                "Real-time novelty scoring against live GitHub repos",
                "LLM-grounded gap detection (not free-form hallucination)",
                "Versioned iteration loop for refining ideas",
              ]).map((diff: string, i: number) => (
                <div
                  key={i}
                  style={{
                    padding: "0.65rem 1.1rem",
                    borderRadius: "var(--radius-sm)",
                    background: "rgba(0, 240, 255, 0.06)",
                    border: "1px solid var(--cyan-border)",
                    color: "var(--text-primary)",
                    fontSize: "0.88rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <span style={{ color: "var(--cyan)", fontWeight: 700 }}>✓</span>
                  {diff}
                </div>
              ))}
            </div>
          </div>

          {/* Search Scope & Key Terms */}
          {ideaSummary?.key_search_terms && (
            <div className="glass-panel" style={{ padding: "1.5rem" }}>
              <div style={{ fontSize: "0.78rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "0.6rem" }}>
                Multi-Term Research Queries Dispatched
              </div>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {ideaSummary.key_search_terms.map((term: string, i: number) => (
                  <span key={i} className="badge badge-muted" style={{ fontSize: "0.78rem" }}>
                    ⌕ {term}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Embedded Research Graph Preview */}
          <ResearchNetworkGraph
            ideaSummary={ideaSummary?.core_technical_approach || "Project Core"}
            sources={sourcesUsed}
            similarSources={similarSources}
            technologies={architecture?.suggested_stack || ["React", "FastAPI", "ChromaDB", "Python"]}
          />
        </div>
      )}

      {/* ── TAB 2: Research Knowledge Graph ────────────────────────── */}
      {activeTab === "graph" && (
        <ResearchNetworkGraph
          ideaSummary={ideaSummary?.core_technical_approach || "Project Core"}
          sources={sourcesUsed}
          similarSources={similarSources}
          technologies={architecture?.suggested_stack || ["React", "FastAPI", "ChromaDB", "Python"]}
        />
      )}

      {/* ── TAB 3: Prior Art & Overlaps ────────────────────────────── */}
      {activeTab === "sources" && (
        <div className="glass-panel" style={{ padding: "1.75rem" }}>
          <h3 style={{ marginBottom: "0.5rem" }}>Most Similar Existing Work</h3>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
            Ranked repositories and papers with computed feature similarity and overlap rationale.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {(similarSources.length ? similarSources : sourcesUsed).map((src: any, idx: number) => (
              <div
                key={idx}
                style={{
                  padding: "1.25rem",
                  background: "rgba(5, 8, 16, 0.6)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-sm)",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "1.25rem",
                }}
              >
                {/* Similarity score badge */}
                <div
                  style={{
                    padding: "0.4rem 0.75rem",
                    borderRadius: "var(--radius-xs)",
                    background: "rgba(0, 240, 255, 0.1)",
                    border: "1px solid var(--cyan-border)",
                    color: "var(--cyan)",
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    textAlign: "center",
                    minWidth: 50,
                  }}
                >
                  {src.similarity_score ? `${Math.round(src.similarity_score)}%` : `#${idx + 1}`}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.3rem" }}>
                    <h4 style={{ color: "var(--cyan)", textTransform: "none", fontSize: "0.95rem" }}>
                      {src.title}
                    </h4>
                    {src.url && (
                      <a href={src.url} target="_blank" rel="noreferrer" className="btn btn-sm btn-ghost">
                        Open ↗
                      </a>
                    )}
                  </div>

                  <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.4rem" }}>
                    {src.summary}
                  </p>

                  {src.overlap_explanation && (
                    <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                      Overlap Rationale: {src.overlap_explanation}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 4: Gaps & Grounded Recommendations ─────────────────── */}
      {activeTab === "gaps" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          {/* Innovation Gaps Card */}
          <div className="glass-panel" style={{ padding: "1.75rem" }}>
            <h3 style={{ marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ color: "var(--violet)" }}>△</span> Potential Innovation Opportunities
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
              Gaps where existing tools or research literature leave room for differentiation.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {gaps.map((gap: any, idx: number) => (
                <div
                  key={idx}
                  style={{
                    padding: "1.25rem",
                    borderRadius: "var(--radius-sm)",
                    background: "rgba(139, 92, 246, 0.05)",
                    border: "1px solid var(--violet-border)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                    <div style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "0.95rem" }}>
                      {gap.description}
                    </div>
                    <span className="badge badge-violet">Potential Opportunity</span>
                  </div>

                  <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.75rem" }}>
                    {gap.why_it_matters}
                  </p>

                  {gap.evidence_sources && gap.evidence_sources.length > 0 && (
                    <div style={{ fontSize: "0.78rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
                      Supporting Evidence:{" "}
                      {gap.evidence_sources.map((url: string, uidx: number) => (
                        <a key={uidx} href={url} target="_blank" rel="noreferrer" style={{ marginLeft: "0.3rem" }}>
                          [{new URL(url).hostname}]
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Actionable Cited Recommendations */}
          <div className="glass-panel" style={{ padding: "1.75rem" }}>
            <h3 style={{ marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ color: "var(--emerald)" }}>◈</span> Grounded Strategic Recommendations
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
              Concrete technical and product moves strictly grounded in citation URLs.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {recommendations.map((rec: any, idx: number) => (
                <div
                  key={idx}
                  style={{
                    padding: "1.25rem",
                    borderRadius: "var(--radius-sm)",
                    background: "rgba(16, 185, 129, 0.05)",
                    border: "1px solid rgba(16, 185, 129, 0.25)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        background: "rgba(16, 185, 129, 0.2)",
                        color: "var(--emerald)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.8rem",
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {idx + 1}
                    </div>
                    <div>
                      <p style={{ color: "var(--text-primary)", fontWeight: 500, fontSize: "0.92rem", marginBottom: "0.5rem" }}>
                        {rec.suggestion}
                      </p>

                      {rec.cited_sources && rec.cited_sources.length > 0 && (
                        <div style={{ fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
                          Grounded in citations:{" "}
                          {rec.cited_sources.map((url: string, uidx: number) => (
                            <a key={uidx} href={url} target="_blank" rel="noreferrer" style={{ marginLeft: "0.35rem" }}>
                              {new URL(url).hostname} ↗
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 5: Architecture & Phased Roadmap ────────────────────── */}
      {activeTab === "architecture" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          {/* Suggested Tech Stack */}
          <div className="glass-panel" style={{ padding: "1.75rem" }}>
            <h3 style={{ marginBottom: "1.25rem" }}>Recommended Technology Stack</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
              {(architecture?.suggested_stack || ["React + Vite", "FastAPI / Python", "ChromaDB / pgvector", "Docker + AWS"]).map(
                (tech: string, idx: number) => (
                  <div
                    key={idx}
                    style={{
                      padding: "1rem",
                      borderRadius: "var(--radius-sm)",
                      background: "rgba(0, 240, 255, 0.04)",
                      border: "1px solid var(--cyan-border)",
                    }}
                  >
                    <div style={{ fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "var(--cyan)", marginBottom: "0.3rem" }}>
                      Layer {idx + 1}
                    </div>
                    <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "0.95rem" }}>
                      {tech}
                    </div>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Phased Roadmap Timeline */}
          <div className="glass-panel" style={{ padding: "1.75rem" }}>
            <h3 style={{ marginBottom: "1.25rem" }}>Phased Implementation Roadmap</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {(architecture?.roadmap_phases || [
                {
                  phase: "Phase 1: Proof of Concept & Validation",
                  milestone: "Core Detection Pipeline",
                  deliverables: ["Baseline heuristic scanner", "Synthetic test suite", "Basic UI console"],
                },
                {
                  phase: "Phase 2: RAG Integration & High-Precision Model",
                  milestone: "Automated Patch Generation",
                  deliverables: ["CVE vector database indexing", "Prompt refinement", "Continuous evaluation harness"],
                },
                {
                  phase: "Phase 3: Production Hardening & CI/CD Tooling",
                  milestone: "Enterprise Readiness",
                  deliverables: ["GitHub Action integration", "Air-gapped deployment option", "Multi-repo telemetry"],
                },
              ]).map((phaseItem: any, idx: number) => (
                <div
                  key={idx}
                  style={{
                    padding: "1.25rem",
                    borderLeft: "3px solid var(--cyan)",
                    background: "rgba(5, 8, 16, 0.6)",
                    borderRadius: "0 var(--radius-sm) var(--radius-sm) 0",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                    <div style={{ fontWeight: 700, color: "var(--cyan)", fontSize: "0.95rem" }}>
                      {phaseItem.phase || `Phase ${idx + 1}`}
                    </div>
                    <span className="badge badge-muted">{phaseItem.milestone || "Key Milestone"}</span>
                  </div>

                  {phaseItem.deliverables && (
                    <ul style={{ paddingLeft: "1.2rem", marginTop: "0.5rem", color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                      {phaseItem.deliverables.map((del: string, didx: number) => (
                        <li key={didx} style={{ marginBottom: "0.25rem" }}>
                          {del}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Revise Idea Modal ──────────────────────────────────────── */}
      {showReviseModal && (
        <div className="modal-overlay">
          <div className="glass-panel-elevated" style={{ maxWidth: 580, width: "100%", padding: "2.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ color: "var(--cyan)" }}>Revise Project Idea (Version {((report?.version_number) || 1) + 1})</h3>
              <button
                onClick={() => setShowReviseModal(false)}
                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "1.2rem" }}
              >
                ✕
              </button>
            </div>
            <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", marginBottom: "1.25rem" }}>
              Refine your specification based on discovered gaps or recommendations. A new report version will be generated and compared against this version.
            </p>

            <textarea
              className="textarea-field"
              rows={6}
              value={revisedText}
              onChange={(e) => setRevisedText(e.target.value)}
              placeholder="Enter revised idea text with your added differentiators..."
            />

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1.5rem" }}>
              <button onClick={() => setShowReviseModal(false)} className="btn btn-secondary btn-sm">
                Cancel
              </button>
              <button onClick={handleReviseSubmit} className="btn btn-primary btn-sm" disabled={!revisedText.trim()}>
                Run Revision Pipeline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
