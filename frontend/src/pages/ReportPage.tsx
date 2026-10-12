/**
 * ReportPage.tsx — Orchestrates the pipeline run and routes between
 * PipelineProgress and ReportView.
 *
 * Data/SSE logic: UNCHANGED.
 * Visual additions:
 * - BackgroundScene receives `activeStage` so nodes light up as stages complete
 * - Fade-in entrance for the page itself
 * - Layout: centered max-width container with padding
 */
import { useEffect, useRef, useState } from "react";
import { animate } from "animejs";
import PipelineProgress from "../components/PipelineProgress";
import ReportView from "../components/ReportView";
import VersionHistory from "../components/VersionHistory";
import BackgroundScene from "../components/BackgroundScene";
import { streamPipeline, getVersions, getReport, createIdea } from "../api";

type StageEvent = { stage: string; status: string; detail?: any };

const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function ReportPage({ initialIdeaText }: { initialIdeaText: string }) {
  const [ideaId, setIdeaId]               = useState<number | null>(null);
  const [events, setEvents]               = useState<StageEvent[]>([]);
  const [report, setReport]               = useState<any | null>(null);
  const [activeVersionId, setActiveVersionId] = useState<number | null>(null);
  const [versions, setVersions]           = useState<any[]>([]);
  const [activeStage, setActiveStage]     = useState(-1);

  const wrapRef = useRef<HTMLDivElement>(null);

  // ── Page fade-in ──────────────────────────────────────────
  useEffect(() => {
    if (REDUCED || !wrapRef.current) return;
    animate(wrapRef.current, {
      opacity: [0, 1],
      translateY: [16, 0],
      duration: 500,
      ease: "outExpo",
    });
  }, []);

  // ── Pipeline kick-off (UNCHANGED logic) ───────────────────
  useEffect(() => {
    createIdea(initialIdeaText).then(({ idea_id }) => {
      setIdeaId(idea_id);
      streamPipeline(
        idea_id,
        (event) => {
          setEvents((prev) => [...prev, event]);
          if (event.stage === "report" && event.status === "done") {
            setActiveVersionId(event.detail.report_version_id);
          }
        },
        () => {
          getVersions(idea_id).then(setVersions);
        }
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Load report on version change (UNCHANGED) ─────────────
  useEffect(() => {
    if (activeVersionId) {
      getReport(activeVersionId).then(setReport).catch(() => setReport(null));
    }
  }, [activeVersionId]);

  // ── Handle stage completion → light up background node ────
  function handleStageComplete(stageIndex: number) {
    setActiveStage(stageIndex);
  }

  // ── Report entrance animation ─────────────────────────────
  const reportRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!report || REDUCED || !reportRef.current) return;
    animate(reportRef.current, {
      opacity: [0, 1],
      translateY: [24, 0],
      duration: 550,
      ease: "outExpo",
    });
  }, [report]);

  return (
    <>
      <BackgroundScene activeStage={activeStage} />

      <div className="app-layer" style={{
        minHeight: "100vh",
        padding: "2rem 1.5rem",
      }}>
        <div ref={wrapRef} style={{ opacity: 0, maxWidth: 760, margin: "0 auto" }}>

          {/* Top nav bar */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            marginBottom: "2rem",
            paddingBottom: "1rem",
            borderBottom: "1px solid var(--border)",
          }}>
            <span style={{
              fontFamily: "var(--font-mono)",
              fontWeight: 700,
              fontSize: "1.1rem",
              background: "linear-gradient(135deg, #fff 30%, var(--accent) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              Syrax
            </span>
            <span style={{
              width: 1, height: 18, background: "var(--border)", flexShrink: 0,
            }} />
            <span style={{
              fontSize: "0.78rem",
              fontFamily: "var(--font-mono)",
              color: "var(--text-muted)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              flex: 1,
            }}>
              {initialIdeaText.slice(0, 80)}{initialIdeaText.length > 80 ? "…" : ""}
            </span>
          </div>

          {/* Version history (appears when pipeline completes) */}
          {versions.length > 0 && (
            <VersionHistory versions={versions} onSelect={setActiveVersionId} />
          )}

          {/* Pipeline progress (shown while no report) */}
          {!report && (
            <div style={{
              minHeight: "60vh",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "2rem",
            }}>
              <PipelineProgress
                events={events}
                onStageComplete={handleStageComplete}
              />
            </div>
          )}

          {/* Report view */}
          {report && activeVersionId && (
            <div ref={reportRef} style={{ opacity: 0 }}>
              <ReportView report={report} versionId={activeVersionId} />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
