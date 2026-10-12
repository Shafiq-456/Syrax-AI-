/**
 * PipelineWorkspace.tsx — Live 8-Stage Research Intelligence Workspace.
 * Tracks actual SSE pipeline states from the backend, displays stage status
 * (Pending, Running with pulse, Done with checkmark, or Error), and live details logs.
 */
import { useEffect, useState } from "react";

type StageEvent = { stage: string; status: string; detail?: any };

interface Props {
  events: StageEvent[];
  ideaText: string;
}

const STAGES = [
  {
    id: "idea_analysis",
    label: "Idea Interpretation & Parameter Extraction",
    desc: "Extracting problem domain, target audience, core technical approach, and search terms.",
    icon: "✦",
  },
  {
    id: "search",
    label: "GitHub & Semantic Scholar Discovery",
    desc: "Executing multi-query discovery across public repositories and peer-reviewed arXiv papers.",
    icon: "⌕",
  },
  {
    id: "rag",
    label: "Source Ingestion & ChromaDB RAG Vectorization",
    desc: "Chunking abstracts and READMEs, generating embeddings with all-MiniLM-L6-v2.",
    icon: "⌬",
  },
  {
    id: "similarity",
    label: "Novelty & Feature Overlap Scoring",
    desc: "Calculating composite similarity against retrieved corpus and evaluating originality.",
    icon: "≈",
  },
  {
    id: "gaps",
    label: "Evidence-Backed Innovation Gap Detection",
    desc: "Identifying unaddressed capabilities, technical limits, and differentiation opportunities.",
    icon: "△",
  },
  {
    id: "recommendations",
    label: "Actionable Grounded Recommendations",
    desc: "Synthesizing concrete suggestions strictly tied to evidence source URLs.",
    icon: "◈",
  },
  {
    id: "architecture",
    label: "Tech Stack & Implementation Roadmap",
    desc: "Generating suggested tech stack, components, and phased development milestones.",
    icon: "⬡",
  },
  {
    id: "report",
    label: "Intelligence Report Assembly & Validation",
    desc: "Compiling versioned intelligence dossier with clickable source citations.",
    icon: "▣",
  },
];

export default function PipelineWorkspace({ events, ideaText }: Props) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setElapsed((prev) => prev + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  function getStageStatus(stageId: string) {
    const evs = events.filter((e) => e.stage === stageId);
    if (!evs.length) return "pending";
    return evs[evs.length - 1].status;
  }

  function getStageDetail(stageId: string) {
    const evs = events.filter((e) => e.stage === stageId && e.detail);
    return evs.length ? evs[evs.length - 1].detail : null;
  }

  const completedCount = STAGES.filter((s) => getStageStatus(s.id) === "done").length;
  const isComplete = events.some((e) => e.stage === "pipeline" && e.status === "complete");
  const percent = Math.round((completedCount / STAGES.length) * 100);

  return (
    <div style={{ maxWidth: 880, margin: "0 auto", display: "flex", flexDirection: "column", gap: "2rem" }}>
      {/* Workspace Header */}
      <div className="glass-panel-elevated" style={{ padding: "2rem", borderRadius: "var(--radius-lg)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
              <span className="badge badge-cyan">
                <span className="status-dot status-dot-pulse" style={{ background: "var(--cyan)" }} />
                {isComplete ? "Analysis Complete" : "Pipeline Executing"}
              </span>
              <span className="badge badge-muted">{elapsed}s Elapsed</span>
            </div>
            <h2 style={{ fontSize: "1.8rem", marginBottom: "0.5rem" }}>
              Research Intelligence Engine
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.92rem", maxWidth: 600 }}>
              Investigating "{ideaText.length > 85 ? ideaText.slice(0, 85) + "..." : ideaText}"
            </p>
          </div>

          {/* Circular Progress Gauge */}
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "2rem", fontWeight: 800, fontFamily: "var(--font-mono)", color: "var(--cyan)" }}>
              {percent}%
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
              {completedCount} of {STAGES.length} Stages
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ width: "100%", height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3, marginTop: "1.5rem", overflow: "hidden" }}>
          <div
            style={{
              width: `${percent}%`,
              height: "100%",
              background: "linear-gradient(90deg, #00f0ff, #8b5cf6)",
              transition: "width 0.4s ease",
            }}
          />
        </div>
      </div>

      {/* Stage Stepper List */}
      <div className="glass-panel" style={{ padding: "1.5rem" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {STAGES.map((stage, idx) => {
            const status = getStageStatus(stage.id);
            const detail = getStageDetail(stage.id);

            let statusColor = "var(--text-muted)";
            let statusBadge = "Pending";
            let borderColor = "var(--border-subtle)";
            let bg = "rgba(255, 255, 255, 0.01)";

            if (status === "running") {
              statusColor = "var(--cyan)";
              statusBadge = "Processing…";
              borderColor = "var(--cyan-border)";
              bg = "rgba(0, 240, 255, 0.04)";
            } else if (status === "done") {
              statusColor = "var(--emerald)";
              statusBadge = "Verified";
              borderColor = "rgba(16, 185, 129, 0.25)";
              bg = "rgba(16, 185, 129, 0.02)";
            } else if (status === "error") {
              statusColor = "var(--rose)";
              statusBadge = "Failed";
              borderColor = "var(--rose)";
              bg = "rgba(244, 63, 94, 0.05)";
            }

            return (
              <div
                key={stage.id}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "1.25rem",
                  padding: "1.1rem 1.25rem",
                  borderRadius: "var(--radius-sm)",
                  border: `1px solid ${borderColor}`,
                  background: bg,
                  transition: "all 0.25s ease",
                }}
              >
                {/* Stage number & icon */}
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: status === "done" ? "rgba(16, 185, 129, 0.15)" : status === "running" ? "rgba(0, 240, 255, 0.15)" : "rgba(255, 255, 255, 0.04)",
                    color: statusColor,
                    fontWeight: 700,
                    fontSize: "0.95rem",
                    flexShrink: 0,
                    border: `1px solid ${borderColor}`,
                  }}
                >
                  {status === "done" ? "✓" : status === "running" ? <span className="status-dot status-dot-pulse" style={{ background: "var(--cyan)" }} /> : stage.icon}
                </div>

                {/* Stage details */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
                    <div style={{ fontWeight: 600, fontSize: "0.95rem", color: status === "pending" ? "var(--text-muted)" : "var(--text-primary)" }}>
                      {stage.label}
                    </div>
                    <span
                      style={{
                        fontSize: "0.72rem",
                        fontFamily: "var(--font-mono)",
                        color: statusColor,
                        textTransform: "uppercase",
                      }}
                    >
                      {statusBadge}
                    </span>
                  </div>

                  <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: detail ? "0.5rem" : 0 }}>
                    {stage.desc}
                  </p>

                  {/* Stage result details badge */}
                  {detail && (
                    <div
                      style={{
                        marginTop: "0.5rem",
                        padding: "0.4rem 0.75rem",
                        background: "rgba(0, 0, 0, 0.4)",
                        borderRadius: "var(--radius-xs)",
                        fontSize: "0.78rem",
                        fontFamily: "var(--font-mono)",
                        color: "var(--cyan)",
                        display: "inline-block",
                      }}
                    >
                      {stage.id === "search" && `Discovered ${detail.count} matching repositories & papers`}
                      {stage.id === "similarity" && `Calculated Novelty Score: ${detail.novelty_score}/100`}
                      {stage.id === "gaps" && `Identified ${detail.count} innovation opportunities`}
                      {stage.id === "recommendations" && `Formulated ${detail.count} cited recommendations`}
                      {stage.id === "idea_analysis" && `Extracted Domain: ${detail.problem_domain || "Software"}`}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
