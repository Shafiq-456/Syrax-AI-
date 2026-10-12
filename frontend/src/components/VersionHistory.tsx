/**
 * VersionHistory.tsx — Versioned reports list with:
 * - New rows animate in from the top (slide+fade), pushing others down
 * - Active version has a glowing left-border indicator that slides between items
 * - Data logic: UNCHANGED
 */
import { useEffect, useRef, useState } from "react";
import { animate, stagger } from "animejs";


type Version = { id: number; version_number: number; novelty_score: number | null };

const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function VersionHistory({
  versions,
  onSelect,
}: {
  versions: Version[];
  onSelect: (versionId: number) => void;
}) {
  const [activeId, setActiveId] = useState<number | null>(
    versions.length ? versions[versions.length - 1].id : null
  );
  const prevLengthRef = useRef(versions.length);
  const rowRefs = useRef<(HTMLLIElement | null)[]>([]);
  const listRef = useRef<HTMLUListElement>(null);

  // Animate new rows that appear (by comparing length to previous render)
  useEffect(() => {
    const newCount = versions.length - prevLengthRef.current;
    prevLengthRef.current = versions.length;

    if (newCount <= 0 || REDUCED) return;

    // Animate the newly prepended rows (versions are ordered oldest first,
    // but we render newest first, so animate first `newCount` items)
    const newRows = rowRefs.current.slice(0, newCount).filter(Boolean) as HTMLElement[];
    newRows.forEach(el => { el.style.opacity = "0"; el.style.transform = "translateY(-20px)"; });

    animate(newRows as HTMLElement[], {
      opacity: [0, 1],
      translateY: [-20, 0],
      delay: stagger(60),
      duration: 450,
      ease: "spring(1, 80, 20, 0)",
    });
  }, [versions.length]);

  // Sync activeId to latest version on initial load
  useEffect(() => {
    if (versions.length && activeId === null) {
      setActiveId(versions[versions.length - 1].id);
    }
  }, [versions, activeId]);

  if (!versions.length) return null;

  // Render newest first
  const sorted = [...versions].reverse();

  function handleSelect(id: number) {
    setActiveId(id);
    onSelect(id);
  }

  function noveltyColor(score: number | null) {
    if (score === null) return "var(--text-muted)";
    if (score >= 70) return "var(--done-color)";
    if (score >= 40) return "#f59e0b";
    return "var(--error-color)";
  }

  return (
    <div style={{ marginBottom: "2rem" }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        marginBottom: "0.75rem",
      }}>
        <h4>Version History</h4>
        <span style={{
          background: "var(--bg-card2)",
          border: "1px solid var(--border)",
          borderRadius: 100,
          padding: "0.1rem 0.5rem",
          fontSize: "0.7rem",
          fontFamily: "var(--font-mono)",
          color: "var(--text-muted)",
        }}>{versions.length}</span>
      </div>

      <ul ref={listRef} className="version-list">
        {sorted.map((v, i) => (
          <li
            key={v.id}
            ref={(el) => { rowRefs.current[i] = el; }}
            className="version-item"
          >
            <button
              className={`version-btn ${activeId === v.id ? "active" : ""}`}
              onClick={() => handleSelect(v.id)}
            >
              <span style={{
                fontFamily: "var(--font-mono)",
                fontWeight: 600,
                color: activeId === v.id ? "var(--text-primary)" : "var(--text-secondary)",
              }}>
                v{v.version_number}
              </span>
              <span style={{ margin: "0 0.5rem", color: "var(--border)" }}>·</span>
              <span style={{
                fontFamily: "var(--font-mono)",
                color: noveltyColor(v.novelty_score),
                fontWeight: 500,
              }}>
                {v.novelty_score !== null ? `${v.novelty_score}/100` : "…"}
              </span>
              <span style={{
                marginLeft: 8,
                fontSize: "0.65rem",
                color: "var(--text-muted)",
              }}>
                novelty
              </span>
              {activeId === v.id && (
                <span style={{
                  marginLeft: "auto",
                  fontSize: "0.65rem",
                  fontFamily: "var(--font-mono)",
                  color: "var(--accent)",
                  background: "var(--accent-dim)",
                  border: "1px solid rgba(0,212,255,0.2)",
                  borderRadius: 100,
                  padding: "0.15rem 0.5rem",
                }}>
                  active
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
