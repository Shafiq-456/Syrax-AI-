/**
 * IdeaIntake.tsx — Professional Research Intake & Project Idea Interface.
 * Features character counter, quick example chips, expandable structured research
 * parameters (Domain, Target Audience, Problem, Technical Constraints), and
 * keyboard shortcuts.
 */
import { useState, useRef } from "react";

interface Props {
  onSubmit: (ideaText: string) => void;
  submitting?: boolean;
}

const EXAMPLE_IDEAS = [
  {
    tag: "Cybersecurity",
    text: "An AI-powered real-time security vulnerability scanner that monitors code commits, detects zero-day exploits, and suggests verified automated patches.",
  },
  {
    tag: "AgTech & Remote Sensing",
    text: "A crop yield prediction tool for smallholder farmers in drought-prone regions using satellite soil-moisture data and hyperlocal weather forecasts.",
  },
  {
    tag: "Music & Generative Audio",
    text: "A co-composition tool for musicians using generative audio models trained on microtonal and non-Western tuning systems with real-time MIDI export.",
  },
  {
    tag: "Supply Chain & Web3",
    text: "A supply-chain traceability platform for specialty coffee roasters using cryptographic verification at each harvest, washing, and roasting stage.",
  },
];

export default function IdeaIntake({ onSubmit, submitting = false }: Props) {
  const [text, setText] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Optional structured parameters
  const [domain, setDomain] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [constraints, setConstraints] = useState("");

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleSubmit() {
    if (!text.trim() || submitting) return;

    // Append structured fields cleanly if user supplied any
    let fullText = text.trim();
    const additions: string[] = [];
    if (domain.trim()) additions.push(`Domain: ${domain.trim()}`);
    if (targetAudience.trim()) additions.push(`Target Users: ${targetAudience.trim()}`);
    if (constraints.trim()) additions.push(`Technical Constraints: ${constraints.trim()}`);

    if (additions.length > 0) {
      fullText += `\n\n[Specification Details]\n${additions.join(" | ")}`;
    }

    onSubmit(fullText);
  }

  function handleSelectExample(exampleText: string) {
    setText(exampleText);
    textareaRef.current?.focus();
  }

  return (
    <div className="glass-panel-elevated" style={{ padding: "2.25rem", borderRadius: "var(--radius-lg)" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
        <div>
          <label
            style={{
              display: "block",
              fontSize: "0.82rem",
              fontFamily: "var(--font-mono)",
              color: "var(--cyan)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: "0.35rem",
              fontWeight: 600,
            }}
          >
            Research Intake & Idea Specification
          </label>
          <p style={{ fontSize: "0.95rem", color: "var(--text-secondary)" }}>
            Describe your project idea in detail. Syrax searches GitHub, arXiv, and open tools to identify overlap and opportunities.
          </p>
        </div>
        <span className="badge badge-cyan">8-Stage AI Pipeline</span>
      </div>

      {/* Main Textarea */}
      <div style={{ position: "relative" }}>
        <textarea
          ref={textareaRef}
          className="textarea-field"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          placeholder="e.g. An AI coding assistant that detects security vulnerabilities in real-time using RAG to cross-reference known CVEs..."
          disabled={submitting}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          style={{
            fontSize: "1rem",
            lineHeight: 1.65,
            padding: "1rem 1.25rem",
            background: "rgba(8, 12, 22, 0.9)",
          }}
        />
      </div>

      {/* Quick Example Chips */}
      <div style={{ marginTop: "1rem" }}>
        <div style={{ fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
          Suggested Example Ideas:
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {EXAMPLE_IDEAS.map((ex) => (
            <button
              key={ex.tag}
              type="button"
              className="idea-chip"
              onClick={() => handleSelectExample(ex.text)}
              disabled={submitting}
            >
              <span style={{ color: "var(--cyan)", marginRight: "0.35rem" }}>+</span>
              {ex.tag}
            </button>
          ))}
        </div>
      </div>

      {/* Expandable Advanced Research Parameters */}
      <div style={{ marginTop: "1.25rem" }}>
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="btn btn-ghost btn-sm"
          style={{ paddingLeft: 0, color: "var(--cyan)", fontSize: "0.82rem" }}
        >
          <span>{showAdvanced ? "▾" : "▸"}</span> Optional Research Parameters (Audience, Domain, Constraints)
        </button>

        {showAdvanced && (
          <div
            style={{
              marginTop: "0.85rem",
              padding: "1.25rem",
              background: "rgba(5, 8, 16, 0.6)",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border-subtle)",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "1rem",
            }}
          >
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)", marginBottom: "0.4rem" }}>
                Target Domain
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. Cybersecurity, AgTech"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                disabled={submitting}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)", marginBottom: "0.4rem" }}>
                Target Audience
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. Dev teams, Researchers"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                disabled={submitting}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)", marginBottom: "0.4rem" }}>
                Technical Constraints
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. Offline, Low-latency"
                value={constraints}
                onChange={(e) => setConstraints(e.target.value)}
                disabled={submitting}
              />
            </div>
          </div>
        )}
      </div>

      {/* Footer bar with character count & CTA button */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: "1.5rem",
          paddingTop: "1.25rem",
          borderTop: "1px solid var(--border-subtle)",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <span style={{ fontSize: "0.78rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
          {text.length > 0 ? `${text.length} characters · ⌘+Enter to submit` : "⌘+Enter or click to submit"}
        </span>

        <button
          id="analyze-btn"
          className="btn btn-primary btn-lg"
          disabled={!text.trim() || submitting}
          onClick={handleSubmit}
        >
          {submitting ? (
            <>
              <span className="status-dot status-dot-pulse" style={{ background: "#000" }} />
              Launching Intelligence Pipeline…
            </>
          ) : (
            <>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
              Analyze Project Idea
            </>
          )}
        </button>
      </div>
    </div>
  );
}
