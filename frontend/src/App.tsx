/**
 * App.tsx — Master Application Router & Intelligence Controller.
 * Unifies Dashboard, 3D Hero New Analysis, Live SSE Pipeline Workspace,
 * Research Explorer, Saved Reports Archive, and System Settings Telemetry.
 */
import { useState, useEffect } from "react";
import AppShell, { NavView } from "./components/AppShell";
import DashboardPage from "./pages/DashboardPage";
import NewAnalysisPage from "./pages/NewAnalysisPage";
import ResearchExplorerPage from "./pages/ResearchExplorerPage";
import ReportsPage from "./pages/ReportsPage";
import SettingsPage from "./pages/SettingsPage";
import PipelineWorkspace from "./components/PipelineWorkspace";
import ReportViewEnhanced from "./components/ReportViewEnhanced";
import VersionHistory from "./components/VersionHistory";

import {
  createIdea,
  streamPipeline,
  streamRevise,
  getReport,
  getVersions,
  getStats,
  AppStats,
} from "./api";

type StageEvent = { stage: string; status: string; detail?: any };

export default function App() {
  const [currentView, setCurrentView] = useState<NavView>("dashboard");
  const [stats, setStats] = useState<AppStats | null>(null);

  // Active Analysis Workspace state
  const [activeIdeaId, setActiveIdeaId] = useState<number | null>(null);
  const [activeIdeaText, setActiveIdeaText] = useState<string>("");
  const [pipelineEvents, setPipelineEvents] = useState<StageEvent[]>([]);
  const [isRunningPipeline, setIsRunningPipeline] = useState(false);
  const [report, setReport] = useState<any | null>(null);
  const [activeVersionId, setActiveVersionId] = useState<number | null>(null);
  const [versions, setVersions] = useState<any[]>([]);
  const [isRevising, setIsRevising] = useState(false);
  const [submittingIdea, setSubmittingIdea] = useState(false);

  useEffect(() => {
    getStats().then(setStats).catch(console.error);
  }, []);

  // ── Start a new pipeline analysis ───────────────────────────
  async function handleStartAnalysis(ideaText: string) {
    setSubmittingIdea(true);
    setActiveIdeaText(ideaText);
    setPipelineEvents([]);
    setReport(null);
    setVersions([]);
    setActiveVersionId(null);
    setIsRunningPipeline(true);
    setCurrentView("workspace");

    try {
      const { idea_id } = await createIdea(ideaText);
      setActiveIdeaId(idea_id);

      streamPipeline(
        idea_id,
        (event) => {
          setPipelineEvents((prev) => [...prev, event]);
          if (event.stage === "report" && event.status === "done" && event.detail?.report_version_id) {
            setActiveVersionId(event.detail.report_version_id);
          }
        },
        async () => {
          setIsRunningPipeline(false);
          setSubmittingIdea(false);
          try {
            const vList = await getVersions(idea_id);
            setVersions(vList);
            if (vList.length > 0 && !activeVersionId) {
              setActiveVersionId(vList[vList.length - 1].id);
            }
          } catch (e) {
            console.error(e);
          }
        }
      );
    } catch (err) {
      console.error("Failed to start idea analysis:", err);
      setIsRunningPipeline(false);
      setSubmittingIdea(false);
    }
  }

  // ── Open an existing report directly ────────────────────────
  async function handleOpenReport(ideaId: number, versionId?: number) {
    setActiveIdeaId(ideaId);
    setPipelineEvents([]);
    setIsRunningPipeline(false);
    setCurrentView("workspace");

    try {
      const vList = await getVersions(ideaId);
      setVersions(vList);
      const targetVersionId = versionId || (vList.length > 0 ? vList[vList.length - 1].id : null);
      if (targetVersionId) {
        setActiveVersionId(targetVersionId);
        const rData = await getReport(targetVersionId);
        setReport(rData);
        if (rData?.idea_summary) {
          setActiveIdeaText(rData.idea_summary);
        }
      }
    } catch (e) {
      console.error("Error opening existing report:", e);
    }
  }

  // ── Load report when activeVersionId changes ────────────────
  useEffect(() => {
    if (activeVersionId && currentView === "workspace") {
      getReport(activeVersionId)
        .then(setReport)
        .catch((e) => console.error("Error loading report:", e));
    }
  }, [activeVersionId, currentView]);

  // ── Revision Loop: re-run pipeline with revision prompt ─────
  async function handleReviseIdea(revisedText: string) {
    if (!activeIdeaId) return;
    setIsRevising(true);
    setIsRunningPipeline(true);
    setPipelineEvents([]);
    setReport(null);

    streamRevise(
      activeIdeaId,
      revisedText,
      (event) => {
        setPipelineEvents((prev) => [...prev, event]);
        if (event.stage === "report" && event.status === "done" && event.detail?.report_version_id) {
          setActiveVersionId(event.detail.report_version_id);
        }
      },
      async () => {
        setIsRevising(false);
        setIsRunningPipeline(false);
        try {
          const vList = await getVersions(activeIdeaId);
          setVersions(vList);
        } catch (e) {
          console.error(e);
        }
      }
    );
  }

  return (
    <AppShell
      currentView={currentView}
      onNavigate={setCurrentView}
      demoMode={stats?.demo_mode ?? true}
    >
      {/* ── Dashboard View ── */}
      {currentView === "dashboard" && (
        <DashboardPage
          onNewAnalysis={() => setCurrentView("new_analysis")}
          onOpenReport={handleOpenReport}
        />
      )}

      {/* ── New Analysis / 3D Hero View ── */}
      {currentView === "new_analysis" && (
        <NewAnalysisPage
          onSubmit={handleStartAnalysis}
          submitting={submittingIdea}
          demoMode={stats?.demo_mode ?? true}
        />
      )}

      {/* ── Research Explorer View ── */}
      {currentView === "explorer" && <ResearchExplorerPage />}

      {/* ── Saved Reports View ── */}
      {currentView === "reports" && (
        <ReportsPage
          onOpenReport={handleOpenReport}
          onNewAnalysis={() => setCurrentView("new_analysis")}
        />
      )}

      {/* ── System Status & Settings View ── */}
      {currentView === "settings" && <SettingsPage />}

      {/* ── Analysis Workspace View ── */}
      {currentView === "workspace" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          {/* Header Bar with back and version controls */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "1rem",
              paddingBottom: "1.25rem",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <button
                onClick={() => setCurrentView("dashboard")}
                className="btn btn-secondary"
                style={{ padding: "0.35rem 0.75rem", fontSize: "0.8rem" }}
              >
                ← Back to Dashboard
              </button>
              <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
                Analysis ID #{activeIdeaId || "—"}
              </span>
            </div>

            {versions.length > 1 && (
              <VersionHistory
                versions={versions}
                onSelect={(vid) => setActiveVersionId(vid)}
              />
            )}
          </div>

          {/* Running State: Live 8-Stage Progress Workspace */}
          {isRunningPipeline && (
            <div style={{ maxWidth: 860, margin: "0 auto", width: "100%" }}>
              <PipelineWorkspace events={pipelineEvents} ideaText={activeIdeaText} />
            </div>
          )}

          {/* Completed State: Rich Intelligence Dossier */}
          {!isRunningPipeline && report && activeVersionId && (
            <ReportViewEnhanced
              report={report}
              versionId={activeVersionId}
              ideaId={activeIdeaId || undefined}
              onRevise={handleReviseIdea}
              revising={isRevising}
            />
          )}

          {/* Fallback if pipeline finished but report is loading */}
          {!isRunningPipeline && !report && (
            <div className="glass-panel" style={{ padding: "4rem 2rem", textAlign: "center" }}>
              <span className="spinner-dots"><span /><span /><span /></span>
              <p style={{ marginTop: "1rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                Fetching compiled dossier from SQLite...
              </p>
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
}
