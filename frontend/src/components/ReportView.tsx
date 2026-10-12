/**
 * ReportView.tsx — Full intelligence report with:
 * - Novelty score animated count-up (anime.js, 1.2s)
 * - Section scroll-reveal via IntersectionObserver
 * - Staggered list item entrance for gaps/recommendations/sources
 * - Export button hover lift
 * All data rendering is UNCHANGED — only visual presentation added.
 */
import { useEffect, useRef } from "react";
import { animate, stagger } from "animejs";
import { exportReportUrl } from "../api";

const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

interface Props {
  report: any;
  versionId: number;
}

export default function ReportView({ report, versionId }: Props) {
  const scoreNumRef  = useRef<HTMLSpanElement>(null);
  const scoreRingRef = useRef<SVGCircleElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const novelty: number = report?.novelty?.novelty_score ?? 0;
  const RADIUS    = 54;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const scoreClass =
    novelty >= 70 ? "score-high" :
    novelty >= 40 ? "score-medium" :
    "score-low";

  // ── Novelty count-up & ring fill ─────────────────────────
  useEffect(() => {
    if (!scoreNumRef.current || !scoreRingRef.current) return;
    if (REDUCED) {
      scoreNumRef.current.textContent = String(novelty);
      scoreRingRef.current.style.strokeDashoffset =
        String(CIRCUMFERENCE * (1 - novelty / 100));
      return;
    }

    // Number count-up
    const obj = { value: 0 };
    const anim = animate(obj, {
      value: novelty,
      duration: 1200,
      ease: "outExpo",
      onUpdate: () => {
        if (scoreNumRef.current)
          scoreNumRef.current.textContent = String(Math.round((obj as any).value));
      },
      onComplete: () => {
        // Scale pulse on landing
        animate(scoreNumRef.current?.parentElement as HTMLElement, {
          scale: [1, 1.12, 1],
          duration: 380,
          ease: "spring(1, 100, 20, 0)",
        });
      },
    });

    scoreRingRef.current.style.strokeDasharray  = String(CIRCUMFERENCE);
    scoreRingRef.current.style.strokeDashoffset = String(CIRCUMFERENCE);
    animate(scoreRingRef.current, {
      strokeDashoffset: [CIRCUMFERENCE, CIRCUMFERENCE * (1 - novelty / 100)],
      duration: 1300,
      ease: "outExpo",
      delay: 150,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [novelty]);

  // ── Scroll-reveal for sections ───────────────────────────
  useEffect(() => {
    const container = containerRef.current;
    if (!container || REDUCED) {
      // Just make everything visible instantly
      container?.querySelectorAll(".report-section").forEach(el => {
        (el as HTMLElement).style.opacity = "1";
        (el as HTMLElement).style.transform = "none";
      });
      return;
    }

    const sections = container.querySelectorAll(".report-section");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).classList.add("revealed");
            observer.unobserve(entry.target);

            // Stagger child list items after section reveals
            setTimeout(() => {
              const items = entry.target.querySelectorAll(".animated-list-item");
              if (items.length) {
                animate(Array.from(items) as HTMLElement[], {
                  opacity: [0, 1],
                  translateY: [12, 0],
                  delay: stagger(60, { start: 80 }),
                  duration: 450,
                  ease: "outExpo",
                });
              }
            }, 80);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
    );

    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} style={{ maxWidth: 720, margin: "0 auto" }}>

      {/* Report header */}
      <div className="report-section card" style={{ marginBottom: "1.25rem",
        display: "flex", alignItems: "center", gap: "1.5rem", flexWrap: "wrap" }}>

        {/* Novelty ring */}
        <div className="novelty-ring">
          <svg width="140" height="140" viewBox="0 0 140 140">
            <circle className="ring-bg"  cx="70" cy="70" r={RADIUS} />
            <circle
              ref={scoreRingRef}
              className={`ring-fill ${scoreClass}`}
              cx="70" cy="70" r={RADIUS}
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={CIRCUMFERENCE}
              style={{
                stroke: novelty >= 70 ? "var(--done-color)"
                      : novelty >= 40 ? "#f59e0b"
                      : "var(--error-color)"
              }}
            />
          </svg>
          <div className="ring-number">
            <span ref={scoreNumRef} className={scoreClass}>0</span>
            <span style={{ fontSize: "0.9rem", color: "var(--text-muted)", fontWeight: 400 }}>/100</span>
            <span className="ring-label">Novelty</span>
          </div>
        </div>

        {/* Report metadata */}
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.7rem",
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: 8,
          }}>
            Syrax Intelligence Report · v{report.version_number}
          </div>
          <h2 style={{ fontSize: "1.25rem", marginBottom: 8 }}>
            {report.idea_summary.problem_domain}
          </h2>
          <p style={{ fontSize: "0.88rem", margin: 0 }}>
            Confidence: <span style={{
              color: report.novelty.confidence === "high" ? "var(--done-color)"
                   : report.novelty.confidence === "medium" ? "#f59e0b"
                   : "var(--text-muted)"
            }}>{report.novelty.confidence}</span>
            {" — "}{report.novelty.confidence_reason}
          </p>
        </div>
      </div>

      {/* Idea Summary */}
      <section className="report-section card" style={{ marginBottom: "1.25rem" }}>
        <h3 style={{ marginBottom: "1rem", color: "var(--accent)" }}>Idea Summary</h3>
        <div style={{ display: "grid", gap: "0.75rem" }}>
          {[
            ["Problem domain",  report.idea_summary.problem_domain],
            ["Target user",     report.idea_summary.target_user],
            ["Approach",        report.idea_summary.core_technical_approach],
          ].map(([label, val]) => (
            <div key={label} style={{
              background: "var(--bg-card2)",
              borderRadius: "var(--radius-sm)",
              padding: "0.75rem 1rem",
            }}>
              <div style={{ fontSize: "0.7rem", fontFamily: "var(--font-mono)",
                color: "var(--text-muted)", textTransform: "uppercase",
                letterSpacing: "0.08em", marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: "0.9rem", color: "var(--text-primary)" }}>{val}</div>
            </div>
          ))}
        </div>
        {report.idea_summary.claimed_differentiators?.length > 0 && (
          <div style={{ marginTop: "1rem" }}>
            <div style={{ fontSize: "0.7rem", fontFamily: "var(--font-mono)",
              color: "var(--text-muted)", textTransform: "uppercase",
              letterSpacing: "0.08em", marginBottom: 8 }}>Claimed differentiators</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
              {report.idea_summary.claimed_differentiators.map((d: string, i: number) => (
                <span key={i} style={{
                  background: "var(--accent-dim)",
                  border: "1px solid rgba(0,212,255,0.2)",
                  borderRadius: 100,
                  padding: "0.25rem 0.75rem",
                  fontSize: "0.78rem",
                  color: "var(--accent)",
                  fontFamily: "var(--font-mono)",
                }}>{d}</span>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Overlapping sources */}
      {report.novelty.top_overlapping_sources.length > 0 && (
        <section className="report-section card" style={{ marginBottom: "1.25rem" }}>
          <h3 style={{ marginBottom: "1rem", color: "var(--accent)" }}>
            Most Similar Existing Work
          </h3>
          <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {report.novelty.top_overlapping_sources.map((s: any, i: number) => (
              <li key={i} className="animated-list-item" style={{
                background: "var(--bg-card2)",
                borderRadius: "var(--radius-sm)",
                padding: "0.75rem 1rem",
                display: "flex",
                gap: "0.75rem",
                alignItems: "flex-start",
              }}>
                <div style={{
                  flexShrink: 0,
                  width: 36, height: 36,
                  borderRadius: "var(--radius-sm)",
                  background: "var(--accent-dim)",
                  border: "1px solid rgba(0,212,255,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.75rem",
                  color: "var(--accent)",
                  fontWeight: 700,
                }}>
                  {Math.round(s.combined_score * 100)}
                </div>
                <div style={{ flex: 1 }}>
                  <a href={s.source.url} target="_blank" rel="noreferrer"
                    style={{ fontWeight: 500, fontSize: "0.9rem" }}>
                    {s.source.title}
                  </a>
                  <p style={{ fontSize: "0.82rem", margin: "4px 0 0", lineHeight: 1.5 }}>
                    {s.reasoning}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Innovation Gaps */}
      <section className="report-section card" style={{ marginBottom: "1.25rem" }}>
        <h3 style={{ marginBottom: "1rem", color: "var(--accent)" }}>Innovation Gaps</h3>
        {report.gaps.length === 0 ? (
          <p>No significant gaps identified from the sources found.</p>
        ) : (
          <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {report.gaps.map((g: any, i: number) => (
              <li key={i} className="animated-list-item" style={{
                borderLeft: "3px solid rgba(0,212,255,0.4)",
                paddingLeft: "1rem",
              }}>
                <div style={{ fontWeight: 600, fontSize: "0.92rem",
                  marginBottom: 4, color: "var(--text-primary)" }}>
                  {g.description}
                </div>
                <p style={{ fontSize: "0.85rem", margin: "0 0 6px" }}>{g.why_it_matters}</p>
                <small>Evidence: {g.evidence_sources.join(", ")}</small>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Recommendations */}
      <section className="report-section card" style={{ marginBottom: "1.25rem" }}>
        <h3 style={{ marginBottom: "1rem", color: "var(--accent)" }}>Recommendations</h3>
        {report.recommendations.length === 0 ? (
          <p>No recommendations generated.</p>
        ) : (
          <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {report.recommendations.map((r: any, i: number) => (
              <li key={i} className="animated-list-item" style={{
                background: "var(--bg-card2)",
                borderRadius: "var(--radius-sm)",
                padding: "0.85rem 1rem",
              }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: 8,
                  marginBottom: 6,
                }}>
                  <span style={{
                    width: 22, height: 22, borderRadius: 4,
                    background: "var(--accent-dim)",
                    border: "1px solid rgba(0,212,255,0.25)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "0.65rem", fontFamily: "var(--font-mono)",
                    color: "var(--accent)", fontWeight: 700,
                  }}>{i + 1}</span>
                  <span style={{ fontSize: "0.9rem", fontWeight: 500, color: "var(--text-primary)" }}>
                    {r.suggestion}
                  </span>
                </div>
                <small>Sources: {r.cited_sources.join(", ")}</small>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Architecture */}
      <section className="report-section card" style={{ marginBottom: "1.25rem" }}>
        <h3 style={{ marginBottom: "1rem", color: "var(--accent)" }}>Suggested Architecture</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem",
          marginBottom: "1rem" }} className="arch-grid">
          <div>
            <div style={{ fontSize: "0.7rem", fontFamily: "var(--font-mono)",
              color: "var(--text-muted)", textTransform: "uppercase",
              letterSpacing: "0.08em", marginBottom: 8 }}>Stack</div>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
              {report.architecture.stack.map((s: string, i: number) => (
                <li key={i} className="animated-list-item" style={{
                  fontSize: "0.82rem",
                  color: "var(--text-secondary)",
                  paddingLeft: "0.75rem",
                  borderLeft: "2px solid var(--border)",
                }}>
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div style={{ fontSize: "0.7rem", fontFamily: "var(--font-mono)",
              color: "var(--text-muted)", textTransform: "uppercase",
              letterSpacing: "0.08em", marginBottom: 8 }}>Key Components</div>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
              {report.architecture.key_components.map((c: string, i: number) => (
                <li key={i} className="animated-list-item" style={{
                  fontSize: "0.82rem",
                  color: "var(--text-secondary)",
                  paddingLeft: "0.75rem",
                  borderLeft: "2px solid var(--border)",
                }}>
                  {c}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div>
          <div style={{ fontSize: "0.7rem", fontFamily: "var(--font-mono)",
            color: "var(--text-muted)", textTransform: "uppercase",
            letterSpacing: "0.08em", marginBottom: 8 }}>Roadmap</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {report.architecture.roadmap.map((step: string, i: number) => (
              <div key={i} className="animated-list-item" style={{
                display: "flex", gap: "0.75rem", alignItems: "flex-start",
              }}>
                <span style={{
                  flexShrink: 0,
                  width: 28, height: 28, borderRadius: "50%",
                  background: i === 0 ? "var(--accent-dim)" : "var(--bg-card2)",
                  border: `1px solid ${i === 0 ? "rgba(0,212,255,0.3)" : "var(--border)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.7rem", fontFamily: "var(--font-mono)",
                  color: i === 0 ? "var(--accent)" : "var(--text-muted)",
                  fontWeight: 700,
                }}>{i + 1}</span>
                <span style={{ fontSize: "0.88rem", color: "var(--text-secondary)",
                  paddingTop: 4, lineHeight: 1.5 }}>
                  {step}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sources */}
      <section className="report-section card" style={{ marginBottom: "1.25rem" }}>
        <h3 style={{ marginBottom: "1rem", color: "var(--accent)" }}>
          All Sources Used
          <span style={{
            marginLeft: 8,
            fontSize: "0.75rem",
            fontFamily: "var(--font-mono)",
            color: "var(--text-muted)",
            fontWeight: 400,
          }}>({report.sources_used?.length ?? 0})</span>
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
          {report.sources_used?.map((s: any, i: number) => (
            <div key={i} className="animated-list-item" style={{
              display: "flex", gap: "0.6rem", alignItems: "center",
            }}>
              <span style={{
                flexShrink: 0,
                padding: "0.15rem 0.4rem",
                borderRadius: 4,
                fontSize: "0.65rem",
                fontFamily: "var(--font-mono)",
                fontWeight: 600,
                background: s.source_type === "github"
                  ? "rgba(139,92,246,0.15)"
                  : "rgba(0,212,255,0.1)",
                color: s.source_type === "github" ? "#a78bfa" : "var(--accent)",
                border: `1px solid ${s.source_type === "github"
                  ? "rgba(139,92,246,0.25)"
                  : "rgba(0,212,255,0.2)"}`,
              }}>
                {s.source_type}
              </span>
              <a href={s.url} target="_blank" rel="noreferrer"
                style={{ fontSize: "0.82rem", flex: 1, overflow: "hidden",
                  textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {s.title}
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* Export */}
      <section className="report-section" style={{ marginBottom: "3rem" }}>
        <div className="export-row">
          <a className="export-btn" href={exportReportUrl(versionId, "markdown")}
            target="_blank" rel="noreferrer">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Export Markdown
          </a>
          <a className="export-btn" href={exportReportUrl(versionId, "pdf")}
            target="_blank" rel="noreferrer">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
            </svg>
            Export PDF
          </a>
        </div>
      </section>
    </div>
  );
}
