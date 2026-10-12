/**
 * PipelineProgress.tsx — Live SSE-driven pipeline stage list.
 * Each row animates through pending → running → done states.
 * Staggered entrance on mount via anime.js.
 * SSE/data logic is UNCHANGED — only visual presentation is added.
 */
import { useEffect, useRef, useState } from "react";
import { animate, stagger } from "animejs";

type StageEvent = { stage: string; status: string; detail?: any };

const STAGE_LABELS: Record<string, string> = {
  idea_analysis:   "Analyzing idea",
  search:          "Searching GitHub + papers",
  rag:             "Indexing sources",
  similarity:      "Scoring novelty",
  gaps:            "Detecting gaps",
  recommendations: "Generating recommendations",
  architecture:    "Suggesting architecture",
  report:          "Assembling report",
};

const STAGE_EMOJIS: Record<string, string> = {
  idea_analysis:   "✦",
  search:          "⌕",
  rag:             "⌬",
  similarity:      "≈",
  gaps:            "△",
  recommendations: "◈",
  architecture:    "⬡",
  report:          "▣",
};

const STAGE_ORDER = Object.keys(STAGE_LABELS);
const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function PipelineProgress({
  events,
  onStageComplete,
}: {
  events: StageEvent[];
  onStageComplete?: (stageIndex: number) => void;
}) {
  const listRef   = useRef<HTMLDivElement>(null);
  const rowRefs   = useRef<(HTMLDivElement | null)[]>([]);
  const iconRefs  = useRef<(HTMLDivElement | null)[]>([]);
  const prevStatus = useRef<Record<string, string>>({});
  const [, forceRender] = useState(0); // trigger re-render when events change

  // Staggered entrance animation on mount
  useEffect(() => {
    if (REDUCED) return;
    rowRefs.current = rowRefs.current.filter(Boolean);
    animate(rowRefs.current.filter(Boolean) as Element[], {
      opacity: [0, 1],
      translateX: [-20, 0],
      delay: stagger(65, { start: 80 }),
      duration: 500,
      ease: "outExpo",
    });
  }, []);

  // Detect status transitions and run per-row animations
  useEffect(() => {
    for (let i = 0; i < STAGE_ORDER.length; i++) {
      const stage  = STAGE_ORDER[i];
      const status = statusFor(stage);
      const prev   = prevStatus.current[stage];

      if (prev === status) continue;
      prevStatus.current[stage] = status;

      if (REDUCED) continue;

      const iconEl = iconRefs.current[i];

      if (status === "done" && iconEl) {
        // Pop the checkmark
        iconEl.classList.add("check-pop");
        setTimeout(() => iconEl.classList.remove("check-pop"), 500);
        // Notify parent so three.js can light a node
        onStageComplete?.(i);
      }

      if (status === "running" && iconEl) {
        animate(iconEl, {
          scale: [0.8, 1.1, 1],
          duration: 400,
          ease: "spring(1, 100, 20, 0)",
        });
      }
    }
    forceRender(n => n + 1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events]);

  function statusFor(stage: string) {
    const matching = events.filter((e) => e.stage === stage);
    return matching.length ? matching[matching.length - 1].status : "pending";
  }

  function detailFor(stage: string): string {
    const matching = events.filter((e) => e.stage === stage && e.detail);
    if (!matching.length) return "";
    const d = matching[matching.length - 1].detail;
    if (d?.count !== undefined) return `${d.count} found`;
    if (d?.novelty_score !== undefined) return `score ${d.novelty_score}`;
    if (d?.report_version_id !== undefined) return `v${d.report_version_id}`;
    return "";
  }

  const doneCount = STAGE_ORDER.filter(s => statusFor(s) === "done").length;
  const totalCount = STAGE_ORDER.length;

  return (
    <div style={{ width: "100%", maxWidth: 560, margin: "0 auto" }}>
      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "1.5rem",
      }}>
        <div>
          <h2 style={{ fontSize: "1.3rem", marginBottom: 4 }}>
            Analyzing your idea
          </h2>
          <p style={{ fontSize: "0.82rem", margin: 0, fontFamily: "var(--font-mono)" }}>
            {doneCount} of {totalCount} stages complete
          </p>
        </div>

        {/* Mini progress arc */}
        <svg width="52" height="52" viewBox="0 0 52 52" style={{ flexShrink: 0 }}>
          <circle cx="26" cy="26" r="22" fill="none"
            stroke="var(--bg-card2)" strokeWidth="4"/>
          <circle cx="26" cy="26" r="22" fill="none"
            stroke="var(--accent)" strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 22}`}
            strokeDashoffset={`${2 * Math.PI * 22 * (1 - doneCount / totalCount)}`}
            transform="rotate(-90 26 26)"
            style={{ transition: "stroke-dashoffset 0.5s cubic-bezier(0.22,1,0.36,1)" }}
          />
          <text x="26" y="30" textAnchor="middle"
            style={{ fill: "var(--accent)", fontSize: "11px",
                     fontFamily: "var(--font-mono)", fontWeight: 700 }}>
            {Math.round((doneCount / totalCount) * 100)}%
          </text>
        </svg>
      </div>

      {/* Stage list */}
      <div ref={listRef} style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
        {STAGE_ORDER.map((stage, i) => {
          const status = statusFor(stage);
          const detail = detailFor(stage);

          return (
            <div
              key={stage}
              ref={(el) => { rowRefs.current[i] = el; }}
              className={`stage-row s-${status}`}
              style={{ opacity: REDUCED ? 1 : 0 }}
            >
              {/* Icon */}
              <div
                ref={(el) => { iconRefs.current[i] = el; }}
                className={`stage-icon ${status}`}
              >
                {status === "done" ? (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                ) : status === "running" ? (
                  <span style={{ fontSize: "0.9rem" }}>
                    {STAGE_EMOJIS[stage]}
                  </span>
                ) : (
                  <span style={{
                    width: 8, height: 8, borderRadius: "50%",
                    background: "var(--text-muted)", display: "block",
                  }} />
                )}
              </div>

              {/* Label */}
              <span className={`stage-label ${status}`}>
                {STAGE_LABELS[stage]}
              </span>

              {/* Detail / spinner */}
              {status === "running" && (
                <span className="spinner-dots">
                  <span /><span /><span />
                </span>
              )}
              {status === "done" && detail && (
                <span className="stage-detail">{detail}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
