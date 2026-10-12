/**
 * ResearchNetworkGraph.tsx — Interactive intelligence network graph.
 * Renders the user's idea at center with connected GitHub repositories,
 * arXiv research papers, and technical components.
 * Supports interactive node selection, inspector drawer, and visual filtering.
 */
import { useState, useMemo } from "react";

interface Props {
  ideaSummary?: string;
  sources?: any[];
  similarSources?: any[];
  technologies?: string[];
}

interface GraphNode {
  id: string;
  label: string;
  type: "idea" | "github" | "paper" | "tech";
  x: number;
  y: number;
  score?: number;
  url?: string;
  summary?: string;
}

export default function ResearchNetworkGraph({
  ideaSummary = "User Project Core",
  sources = [],
  similarSources = [],
  technologies = [],
}: Props) {
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [filterType, setFilterType] = useState<"all" | "github" | "paper" | "tech">("all");

  const width = 800;
  const height = 500;
  const centerX = width / 2;
  const centerY = height / 2;

  // Build nodes and links deterministically
  const { nodes, links } = useMemo(() => {
    const list: GraphNode[] = [];
    const edgeList: { from: GraphNode; to: GraphNode; stroke: string }[] = [];

    // 1. Center Idea Node
    const centerNode: GraphNode = {
      id: "root-idea",
      label: ideaSummary.slice(0, 36) + "...",
      type: "idea",
      x: centerX,
      y: centerY,
      summary: ideaSummary,
    };
    list.push(centerNode);

    // 2. Sources (GitHub & Papers)
    const combinedSources = [...(sources || []), ...(similarSources || [])];
    // Deduplicate by URL or title
    const seen = new Set<string>();
    const uniqueSources = combinedSources.filter((s) => {
      const key = s.url || s.title;
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 16);

    const totalSources = uniqueSources.length;
    uniqueSources.forEach((src, idx) => {
      const angle = (idx / (totalSources || 1)) * Math.PI * 2;
      const radius = 170 + (idx % 3) * 25;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      const isPaper = src.source_type === "paper" || (src.url && src.url.includes("arxiv"));
      const node: GraphNode = {
        id: `source-${idx}`,
        label: (src.title || "Untitled").slice(0, 24),
        type: isPaper ? "paper" : "github",
        x,
        y,
        score: src.similarity_score,
        url: src.url,
        summary: src.summary,
      };
      list.push(node);
      edgeList.push({
        from: centerNode,
        to: node,
        stroke: isPaper ? "rgba(139, 92, 246, 0.45)" : "rgba(0, 240, 255, 0.45)",
      });
    });

    // 3. Technology stack nodes
    (technologies || []).slice(0, 4).forEach((tech, idx) => {
      const angle = ((idx + 0.5) / 4) * Math.PI * 2;
      const radius = 95;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      const node: GraphNode = {
        id: `tech-${idx}`,
        label: tech.slice(0, 20),
        type: "tech",
        x,
        y,
      };
      list.push(node);
      edgeList.push({
        from: centerNode,
        to: node,
        stroke: "rgba(16, 185, 129, 0.45)",
      });
    });

    return { nodes: list, links: edgeList };
  }, [ideaSummary, sources, similarSources, technologies]);

  const filteredNodes = nodes.filter(
    (n) => filterType === "all" || n.type === "idea" || n.type === filterType
  );

  return (
    <div className="glass-panel" style={{ padding: "1.5rem", position: "relative", overflow: "hidden" }}>
      {/* Header controls & legend */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1rem",
          marginBottom: "1rem",
        }}
      >
        <div>
          <h3 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ color: "var(--cyan)" }}>❖</span> Research Knowledge Graph
          </h3>
          <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
            Interactive spatial mapping of your project idea to discovered repositories and papers
          </p>
        </div>

        {/* Filter buttons */}
        <div style={{ display: "flex", gap: "0.4rem" }}>
          {[
            { id: "all", label: "All Nodes" },
            { id: "github", label: "GitHub Repos" },
            { id: "paper", label: "Papers" },
            { id: "tech", label: "Tech Stack" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id as any)}
              className="btn btn-sm"
              style={{
                background: filterType === f.id ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.03)",
                color: filterType === f.id ? "#fff" : "var(--text-secondary)",
                borderColor: filterType === f.id ? "var(--cyan)" : "var(--border-subtle)",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Canvas */}
      <div style={{ width: "100%", height: 440, position: "relative", background: "rgba(5, 8, 14, 0.7)", borderRadius: "var(--radius-sm)" }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          style={{ width: "100%", height: "100%", display: "block" }}
        >
          {/* Background grid */}
          <defs>
            <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.8" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Links */}
          {links.map((link, idx) => {
            const isVisible =
              filterType === "all" ||
              link.to.type === "idea" ||
              link.to.type === filterType;
            if (!isVisible) return null;

            return (
              <line
                key={`link-${idx}`}
                x1={link.from.x}
                y1={link.from.y}
                x2={link.to.x}
                y2={link.to.y}
                stroke={link.stroke}
                strokeWidth={selectedNode?.id === link.to.id ? 2.5 : 1.2}
                strokeDasharray={link.to.type === "tech" ? "4,4" : undefined}
                style={{ transition: "stroke-width 0.2s ease" }}
              />
            );
          })}

          {/* Nodes */}
          {filteredNodes.map((node) => {
            const isSelected = selectedNode?.id === node.id;
            let fill = "#00f0ff";
            let glow = "rgba(0, 240, 255, 0.5)";
            let r = 8;

            if (node.type === "idea") {
              fill = "#00f0ff";
              glow = "rgba(0, 240, 255, 0.8)";
              r = 18;
            } else if (node.type === "github") {
              fill = "#38bdf8";
              glow = "rgba(56, 189, 248, 0.6)";
              r = 9;
            } else if (node.type === "paper") {
              fill = "#c084fc";
              glow = "rgba(192, 132, 252, 0.6)";
              r = 9;
            } else if (node.type === "tech") {
              fill = "#34d399";
              glow = "rgba(52, 211, 153, 0.6)";
              r = 7;
            }

            return (
              <g
                key={node.id}
                onClick={() => setSelectedNode(node)}
                style={{ cursor: "pointer" }}
              >
                {/* Glow ring */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={r + (isSelected ? 8 : 4)}
                  fill={glow}
                  opacity={isSelected ? 0.6 : 0.2}
                />
                {/* Node circle */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={r}
                  fill={fill}
                  stroke="#0a0f1d"
                  strokeWidth={2}
                />
                {/* Label */}
                <text
                  x={node.x}
                  y={node.y + r + 14}
                  fill={isSelected ? "#fff" : "var(--text-secondary)"}
                  fontSize={node.type === "idea" ? "12px" : "10px"}
                  fontFamily="var(--font-mono)"
                  textAnchor="middle"
                  style={{ pointerEvents: "none", fontWeight: isSelected ? 600 : 400 }}
                >
                  {node.label}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Selected Node Details Drawer */}
        {selectedNode && (
          <div
            style={{
              position: "absolute",
              bottom: "1rem",
              right: "1rem",
              width: 320,
              background: "rgba(13, 18, 30, 0.94)",
              backdropFilter: "blur(14px)",
              border: "1px solid var(--border-medium)",
              borderRadius: "var(--radius-sm)",
              padding: "1rem",
              boxShadow: "0 8px 30px rgba(0,0,0,0.6)",
              zIndex: 10,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
              <span className={`badge badge-${selectedNode.type === "paper" ? "violet" : selectedNode.type === "tech" ? "emerald" : "cyan"}`}>
                {selectedNode.type}
              </span>
              <button
                onClick={() => setSelectedNode(null)}
                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "1rem" }}
              >
                ✕
              </button>
            </div>
            <div style={{ fontWeight: 600, fontSize: "0.92rem", marginBottom: "0.4rem", color: "var(--text-primary)" }}>
              {selectedNode.label}
            </div>
            {selectedNode.summary && (
              <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.75rem", maxHeight: 90, overflowY: "auto" }}>
                {selectedNode.summary}
              </p>
            )}
            {selectedNode.url && (
              <a
                href={selectedNode.url}
                target="_blank"
                rel="noreferrer"
                className="btn btn-sm btn-secondary"
                style={{ width: "100%", justifyContent: "center" }}
              >
                Open Source ↗
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
