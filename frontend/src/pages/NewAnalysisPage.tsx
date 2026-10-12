/**
 * NewAnalysisPage.tsx — Premium 3D Hero & Research Intake Page.
 * Combines the interactive Three.js intelligence core, dynamic status pill,
 * brand wordmark, product promise, and the research-intake interface with example chips.
 */
import Hero3DVisualizer from "../components/Hero3DVisualizer";
import IdeaIntake from "../components/IdeaIntake";

interface Props {
  onSubmit: (ideaText: string) => void;
  submitting?: boolean;
  demoMode?: boolean;
}

export default function NewAnalysisPage({ onSubmit, submitting = false, demoMode = true }: Props) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "3.5rem", position: "relative" }}>
      {/* ── Immersive Hero Section ───────────────────────────────────── */}
      <div
        className="glass-panel-elevated"
        style={{
          borderRadius: "var(--radius-xl)",
          padding: "3.5rem 3rem",
          position: "relative",
          overflow: "hidden",
          border: "1px solid rgba(0, 240, 255, 0.15)",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.08)",
        }}
      >
        {/* Ambient radial glows */}
        <div
          style={{
            position: "absolute",
            top: "-20%",
            right: "-10%",
            width: "600px",
            height: "600px",
            background: "radial-gradient(circle, rgba(0, 240, 255, 0.12) 0%, rgba(139, 92, 246, 0.05) 50%, transparent 70%)",
            filter: "blur(60px)",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.2fr 1fr",
            gap: "3rem",
            alignItems: "center",
          }}
          className="responsive-hero-grid"
        >
          {/* Left Column: Typography & Value Proposition */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", zIndex: 2 }}>
            {/* Status indicator */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.35rem 0.85rem",
                  borderRadius: "100px",
                  background: "rgba(0, 240, 255, 0.08)",
                  border: "1px solid rgba(0, 240, 255, 0.25)",
                  fontSize: "0.75rem",
                  fontFamily: "var(--font-mono)",
                  color: "var(--accent-cyan)",
                  letterSpacing: "0.04em",
                }}
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: "var(--accent-cyan)",
                    animation: "pulse-glow 2s ease-in-out infinite",
                  }}
                />
                AI RESEARCH & VALIDATION ENGINE · {demoMode ? "DEMO MODE" : "LIVE PROVIDER"}
              </div>
            </div>

            {/* Wordmark & Headings */}
            <div>
              <h1
                style={{
                  fontSize: "3.2rem",
                  lineHeight: 1.1,
                  letterSpacing: "-0.03em",
                  marginBottom: "1rem",
                  background: "linear-gradient(135deg, #ffffff 40%, var(--accent-cyan) 85%, var(--accent-violet) 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Syrax AI
              </h1>
              <div
                style={{
                  fontSize: "1.25rem",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  marginBottom: "0.5rem",
                  letterSpacing: "-0.01em",
                }}
              >
                &ldquo;Discover what already exists. Understand what is missing. Build what matters.&rdquo;
              </div>
              <p
                style={{
                  fontSize: "0.95rem",
                  color: "var(--text-secondary)",
                  lineHeight: 1.7,
                  maxWidth: "540px",
                }}
              >
                From raw ideas to research-backed innovation. Syrax cross-references your concept against public
                GitHub repositories, peer-reviewed arXiv academic papers, and existing developer tools to identify
                prior art, measure real novelty, and synthesize evidence-backed roadmaps.
              </p>
            </div>

            {/* Feature Pills */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
              {[
                "8-Stage RAG Pipeline",
                "ChromaDB Vectorization",
                "Grounded Innovation Gaps",
                "Interactive Graph",
              ].map((feat) => (
                <div
                  key={feat}
                  style={{
                    fontSize: "0.75rem",
                    fontFamily: "var(--font-mono)",
                    padding: "0.3rem 0.7rem",
                    borderRadius: "6px",
                    background: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid var(--border)",
                    color: "var(--text-muted)",
                  }}
                >
                  ✓ {feat}
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: 3D Intelligence Object */}
          <div
            style={{
              position: "relative",
              width: "100%",
              height: "380px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1,
            }}
          >
            <Hero3DVisualizer activeStage={-1} />
            <div
              style={{
                position: "absolute",
                bottom: "10px",
                padding: "0.3rem 0.8rem",
                borderRadius: "100px",
                background: "rgba(6, 8, 13, 0.75)",
                border: "1px solid var(--border)",
                fontSize: "0.68rem",
                fontFamily: "var(--font-mono)",
                color: "var(--text-muted)",
                backdropFilter: "blur(8px)",
                pointerEvents: "none",
              }}
            >
              Interactive Three.js Neural Geometry · Mouse Parallax Enabled
            </div>
          </div>
        </div>
      </div>

      {/* ── Research Intake Interface ────────────────────────────────── */}
      <div>
        <div style={{ marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem" }}>
            <span className="badge badge-cyan">Phase 01</span>
            <span style={{ fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
              RESEARCH INTAKE SPECIFICATION
            </span>
          </div>
          <h2 style={{ fontSize: "1.75rem" }}>Formulate Your Project Premise</h2>
          <p style={{ color: "var(--text-secondary)", maxWidth: "680px", fontSize: "0.95rem" }}>
            Submit an overview of your concept or select an example below. Syrax will normalize your description,
            extract query vectors, and launch discovery across global repositories and academic literature.
          </p>
        </div>

        <IdeaIntake onSubmit={onSubmit} submitting={submitting} />
      </div>
    </div>
  );
}
