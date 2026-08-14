import React, { useMemo, useState, useCallback, useEffect, useRef } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  MarkerType,
  BackgroundVariant,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";

/* ==========================================================
   THEME & STYLING CONFIGURATION
========================================================== */

const NODE_CONFIG = {
  actor: { icon: "👤", title: "User", color: "#3b82f6" },
  frontend: { icon: "💻", title: "Frontend", color: "#06b6d4" },
  backend: { icon: "🖥️", title: "Backend", color: "#8b5cf6" },
  entry: { icon: "🚪", title: "Entry Point", color: "#10b981" },
  api: { icon: "🌐", title: "API Gateway", color: "#f59e0b" },
  middleware: { icon: "🛡️", title: "Middleware", color: "#ec4899" },
  controller: { icon: "🎯", title: "Controller", color: "#6366f1" },
  service: { icon: "⚙️", title: "Service", color: "#14b8a6" },
  database: { icon: "🗄️", title: "Database", color: "#f43f5e" },
  utility: { icon: "🔧", title: "Utility", color: "#64748b" },
  test: { icon: "🧪", title: "Tests", color: "#a855f7" },
  default: { icon: "📦", title: "Module", color: "#64748b" },
};

/* ==========================================================
   CUSTOM ARCHITECTURE NODE
========================================================== */

function ArchitectureNode({ data, selected }) {
  const config = NODE_CONFIG[data?.type] || NODE_CONFIG.default;

  return (
    <div
      style={{
        width: "200px",
        boxSizing: "border-box",
        padding: "10px 14px",
        borderRadius: "12px",
        background: selected ? "#1e293b" : "#0f172a",
        border: `1px solid ${selected ? config.color : "rgba(255, 255, 255, 0.12)"}`,
        boxShadow: selected
          ? `0 0 16px ${config.color}44, 0 6px 20px rgba(0, 0, 0, 0.4)`
          : "0 6px 18px rgba(0, 0, 0, 0.3)",
        transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
        backdropFilter: "blur(12px)",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "12px",
          right: "12px",
          height: "2px",
          background: `linear-gradient(90deg, transparent, ${config.color}, transparent)`,
          borderRadius: "2px",
        }}
      />

      <Handle
        type="target"
        position={Position.Left}
        style={{
          width: "8px",
          height: "8px",
          background: config.color,
          border: "2px solid #0f172a",
        }}
      />

      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        {/* ICON CONTAINER FIXED */}
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "8px",
            background: `${config.color}25`,
            border: `1px solid ${config.color}40`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "16px",
            lineHeight: "1",
            color: "#ffffff",
            flexShrink: 0,
            userSelect: "none",
          }}
        >
          {config.icon}
        </div>

        <div style={{ flexGrow: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: "12px",
              fontWeight: 600,
              color: "#f8fafc",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {data?.label || config.title}
          </div>

          <div
            style={{
              fontSize: "9px",
              fontWeight: 600,
              color: config.color,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              marginTop: "1px",
            }}
          >
            {data?.type || "module"}
          </div>
        </div>
      </div>

      {data?.description && (
        <div
          style={{
            marginTop: "8px",
            paddingTop: "6px",
            borderTop: "1px solid rgba(255, 255, 255, 0.06)",
            fontSize: "10px",
            lineHeight: 1.35,
            color: "#94a3b8",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {data.description}
        </div>
      )}

      <Handle
        type="source"
        position={Position.Right}
        style={{
          width: "8px",
          height: "8px",
          background: config.color,
          border: "2px solid #0f172a",
        }}
      />
    </div>
  );
}

const nodeTypes = {
  architecture: ArchitectureNode,
};

/* ==========================================================
   DATA VALIDATION
========================================================== */

function sanitizeArchitectureData(rawNodes, rawEdges) {
  const nodes = [];
  const seenNodeIds = new Set();

  for (const node of rawNodes || []) {
    if (!node || typeof node.id !== "string" || !node.id) continue;
    if (seenNodeIds.has(node.id)) continue;
    seenNodeIds.add(node.id);
    nodes.push(node);
  }

  const edges = [];
  const seenEdgeKeys = new Set();

  for (const edge of rawEdges || []) {
    if (!edge || typeof edge.source !== "string" || typeof edge.target !== "string") continue;
    if (!seenNodeIds.has(edge.source) || !seenNodeIds.has(edge.target)) continue;
    if (edge.source === edge.target) continue;

    const key = `${edge.source}->${edge.target}`;
    if (seenEdgeKeys.has(key)) continue;
    seenEdgeKeys.add(key);

    edges.push(edge);
  }

  return { nodes, edges };
}

/* ==========================================================
   COMPACT AUTOMATIC NODE LAYOUT
========================================================== */

function computeLayout(rawNodes, rawEdges) {
  if (!rawNodes || rawNodes.length === 0) return [];

  const ids = new Set(rawNodes.map((n) => n.id));
  const validEdges = (rawEdges || []).filter(
    (e) => ids.has(e.source) && ids.has(e.target)
  );

  const depth = new Map(rawNodes.map((n) => [n.id, 0]));

  for (let i = 0; i < rawNodes.length; i++) {
    let changed = false;
    for (const edge of validEdges) {
      const candidate = depth.get(edge.source) + 1;
      if (candidate > depth.get(edge.target)) {
        depth.set(edge.target, candidate);
        changed = true;
      }
    }
    if (!changed) break;
  }

  const distinctRanks = [...new Set(rawNodes.map((n) => depth.get(n.id) || 0))].sort((a, b) => a - b);
  const rankIndex = new Map(distinctRanks.map((rank, index) => [rank, index]));

  const MAX_COLUMNS_PER_ROW = 6;
  const columnWidth = 240;
  const rowHeight = 140;
  const bandGap = 90;

  const columnOf = (compactRank) => compactRank % MAX_COLUMNS_PER_ROW;
  const bandOf = (compactRank) => Math.floor(compactRank / MAX_COLUMNS_PER_ROW);

  const cellMap = new Map();

  rawNodes.forEach((node) => {
    const rawRank = depth.get(node.id) || 0;
    const compactRank = rankIndex.get(rawRank) ?? 0;
    const column = columnOf(compactRank);
    const band = bandOf(compactRank);
    const key = `${band}:${column}`;

    if (!cellMap.has(key)) cellMap.set(key, []);
    cellMap.get(key).push(node);
  });

  const bandHeights = new Map();
  for (const [key, nodesInCell] of cellMap.entries()) {
    const band = Number(key.split(":")[0]);
    bandHeights.set(band, Math.max(bandHeights.get(band) || 0, nodesInCell.length));
  }

  const bandYOffset = new Map();
  let cumulativeY = 0;
  for (const band of [...bandHeights.keys()].sort((a, b) => a - b)) {
    bandYOffset.set(band, cumulativeY);
    cumulativeY += bandHeights.get(band) * rowHeight + bandGap;
  }

  const positioned = [];

  for (const [key, nodesInCell] of cellMap.entries()) {
    const [bandStr, columnStr] = key.split(":");
    const column = Number(columnStr);
    const yBase = bandYOffset.get(Number(bandStr)) || 0;
    const totalHeight = (nodesInCell.length - 1) * rowHeight;

    nodesInCell.forEach((node, row) => {
      positioned.push({
        ...node,
        type: "architecture",
        // CRITICAL FIX: Providing explicit dimensions allows MiniMap to render node shapes properly
        width: 200,
        height: 70,
        position: {
          x: column * columnWidth,
          y: yBase + row * rowHeight - totalHeight / 2,
        },
        data: {
          label: node.label,
          type: node.type,
          description: node.description,
          originalNode: node,
        },
      });
    });
  }

  return positioned;
}

/* ==========================================================
   MAIN COMPONENT
========================================================== */

function ArchitectureDiagram({ architecture, height = 650, error = null }) {
  const [selectedNode, setSelectedNode] = useState(null);
  const reactFlowInstanceRef = useRef(null);

  useEffect(() => {
    setSelectedNode(null);
  }, [architecture]);

  const rawNodes = architecture?.flow?.nodes || [];
  const rawEdges = architecture?.flow?.edges || [];

  const sanitized = useMemo(
    () => sanitizeArchitectureData(rawNodes, rawEdges),
    [rawNodes, rawEdges]
  );

  const edges = useMemo(() => {
    return sanitized.edges.map((edge, index) => ({
      id: edge.id || `${edge.source}-${edge.target}-${index}`,
      source: edge.source,
      target: edge.target,
      label: edge.label || "",
      type: "smoothstep",
      animated: true,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: "#3b82f6",
        width: 14,
        height: 14,
      },
      style: {
        stroke: "#3b82f6",
        strokeWidth: 1.5,
        opacity: 0.65,
      },
      labelStyle: {
        fill: "#94a3b8",
        fontSize: 9,
        fontWeight: 600,
      },
      labelBgStyle: {
        fill: "#0f172a",
        fillOpacity: 0.85,
        rx: 4,
      },
    }));
  }, [sanitized.edges]);

  const nodes = useMemo(() => {
    return computeLayout(sanitized.nodes, sanitized.edges);
  }, [sanitized.nodes, sanitized.edges]);

  const legendTypes = useMemo(() => {
    const order = ["frontend", "backend", "api", "middleware", "controller", "service", "database", "utility", "test"];
    const present = new Set(nodes.map((n) => n.data?.type));
    return order.filter((t) => present.has(t));
  }, [nodes]);

  const riskLevel = useMemo(() => {
    if (architecture?.summary?.riskLevel) return architecture.summary.riskLevel;
    const risks = architecture?.risks || [];
    if (risks.some((r) => r.severity === "High")) return "High";
    if (risks.some((r) => r.severity === "Medium")) return "Medium";
    return "Low";
  }, [architecture]);

  const handleNodeClick = useCallback((_, node) => {
    setSelectedNode(node);
  }, []);

  const handleInit = useCallback((instance) => {
    reactFlowInstanceRef.current = instance;
  }, []);

  const handleResetView = useCallback(() => {
    setSelectedNode(null);
    reactFlowInstanceRef.current?.fitView({ padding: 0.2, minZoom: 0.3, duration: 300 });
  }, []);

  if (error) {
    return (
      <div
        style={{
          height,
          borderRadius: "18px",
          border: "1px solid rgba(239, 68, 68, 0.2)",
          background: "#0f172a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: "8px",
          padding: "24px",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: "28px" }}>⚠️</div>
        <div style={{ fontWeight: 600, color: "#f87171" }}>
          Couldn't load architecture
        </div>
        <div style={{ fontSize: "12px", color: "#fca5a5", maxWidth: "360px" }}>
          {typeof error === "string" ? error : "Something went wrong while analyzing this repository."}
        </div>
      </div>
    );
  }

  if (!architecture || sanitized.nodes.length === 0) {
    return (
      <div
        style={{
          height,
          borderRadius: "18px",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          background: "#0f172a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: "8px",
          color: "#64748b",
        }}
      >
        <div style={{ fontSize: "28px" }}>🏗️</div>
        <div style={{ fontWeight: 600, color: "#94a3b8" }}>
          {!architecture ? "Architecture is not available yet" : "No architecture flow detected"}
        </div>
        <div style={{ fontSize: "12px", color: "#64748b" }}>
          Analyze a repository to generate the architecture visualization.
        </div>
      </div>
    );
  }

  const riskColors =
    riskLevel === "High"
      ? { bg: "rgba(239, 68, 68, 0.1)", fg: "#f87171", border: "rgba(239, 68, 68, 0.2)" }
      : riskLevel === "Medium"
      ? { bg: "rgba(245, 158, 11, 0.1)", fg: "#fbbf24", border: "rgba(245, 158, 11, 0.2)" }
      : { bg: "rgba(16, 185, 129, 0.1)", fg: "#34d399", border: "rgba(16, 185, 129, 0.2)" };

  return (
    <div
      style={{
        width: "100%",
        height,
        display: "flex",
        flexDirection: "column",
        borderRadius: "18px",
        overflow: "hidden",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        background: "#0b0f17",
        boxSizing: "border-box",
      }}
    >
      {/* HEADER BAR */}
      <div
        style={{
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 20px",
          background: "rgba(15, 23, 42, 0.85)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          zIndex: 10,
        }}
      >
        <div>
          <div style={{ fontSize: "14px", fontWeight: 700, color: "#f8fafc" }}>
            Repository Architecture
          </div>
          <div style={{ marginTop: "2px", fontSize: "11px", color: "#94a3b8" }}>
            {architecture?.framework?.name ? `${architecture.framework.name} · ` : ""}
            {nodes.length} components · {edges.length} relationships
          </div>
        </div>

        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {typeof architecture?.score === "number" && (
            <span
              style={{
                fontSize: "10px",
                fontWeight: 600,
                padding: "3px 9px",
                borderRadius: "999px",
                background: "rgba(59, 130, 246, 0.1)",
                color: "#60a5fa",
                border: "1px solid rgba(59, 130, 246, 0.2)",
              }}
            >
              Score {architecture.score}
            </span>
          )}

          <span
            style={{
              fontSize: "10px",
              fontWeight: 600,
              padding: "3px 9px",
              borderRadius: "999px",
              background: riskColors.bg,
              color: riskColors.fg,
              border: `1px solid ${riskColors.border}`,
            }}
          >
            {riskLevel} Risk
          </span>

          <button
            onClick={handleResetView}
            title="Reset view"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "10px",
              fontWeight: 600,
              padding: "3px 9px",
              borderRadius: "999px",
              background: "rgba(255, 255, 255, 0.04)",
              color: "#cbd5e1",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              cursor: "pointer",
            }}
          >
            <span style={{ fontSize: "11px" }}>⟳</span> Reset View
          </button>
        </div>
      </div>

      {/* CANVAS CONTAINER */}
      <div style={{ flex: 1, position: "relative", width: "100%", minHeight: 0 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodeClick={handleNodeClick}
          onInit={handleInit}
          fitView
          fitViewOptions={{ padding: 0.2, minZoom: 0.3 }}
          minZoom={0.15}
          maxZoom={1.8}
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#334155" />
          <Controls />
          
          {/* MINIMAP FIXED WITH DYNAMIC NODE COLORS */}
          <MiniMap
            pannable
            zoomable
            nodeColor={(node) => NODE_CONFIG[node.data?.type]?.color || "#3b82f6"}
            nodeStrokeColor={(node) => NODE_CONFIG[node.data?.type]?.color || "#3b82f6"}
            nodeStrokeWidth={2}
            nodeBorderRadius={4}
            maskColor="rgba(11, 15, 23, 0.7)"
            style={{
              background: "#0f172a",
              borderRadius: "12px",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          />
        </ReactFlow>

        {/* FLOATING LEGEND PANEL */}
        {legendTypes.length > 0 && (
          <div
            style={{
              position: "absolute",
              top: 16,
              left: 16,
              zIndex: 10,
              padding: "8px 12px",
              borderRadius: "10px",
              background: "rgba(15, 23, 42, 0.8)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              display: "flex",
              flexWrap: "wrap",
              gap: "10px",
              maxWidth: "340px",
            }}
          >
            {legendTypes.map((type) => (
              <div key={type} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <span style={{ fontSize: "12px", color: "#ffffff" }}>
                  {NODE_CONFIG[type]?.icon}
                </span>
                <span
                  style={{
                    fontSize: "10px",
                    color: "#94a3b8",
                    textTransform: "capitalize",
                  }}
                >
                  {type}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* FLOATING SELECTED NODE DETAILS PANEL */}
        {selectedNode && (
          <div
            style={{
              position: "absolute",
              right: 16,
              top: 16,
              width: "260px",
              padding: "14px",
              borderRadius: "12px",
              background: "rgba(15, 23, 42, 0.9)",
              backdropFilter: "blur(16px)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              boxShadow: "0 16px 32px rgba(0,0,0,0.5)",
              zIndex: 20,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "#f8fafc" }}>
                {selectedNode.data?.label}
              </div>

              <button
                onClick={() => setSelectedNode(null)}
                style={{
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  fontSize: "16px",
                  color: "#64748b",
                  padding: 0,
                }}
              >
                ×
              </button>
            </div>

            <div
              style={{
                marginTop: "6px",
                display: "inline-block",
                padding: "2px 6px",
                borderRadius: "4px",
                background: `${NODE_CONFIG[selectedNode.data?.type]?.color || "#64748b"}20`,
                color: NODE_CONFIG[selectedNode.data?.type]?.color || "#94a3b8",
                fontSize: "9px",
                fontWeight: 600,
                textTransform: "uppercase",
                border: `1px solid ${NODE_CONFIG[selectedNode.data?.type]?.color || "#64748b"}40`,
              }}
            >
              {selectedNode.data?.type}
            </div>

            {selectedNode.data?.description && (
              <p
                style={{
                  marginTop: "10px",
                  fontSize: "11px",
                  lineHeight: 1.4,
                  color: "#94a3b8",
                }}
              >
                {selectedNode.data.description}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ArchitectureDiagram;