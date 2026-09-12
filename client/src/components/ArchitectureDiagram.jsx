import React, { useMemo, useState, useCallback, useRef } from "react";
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
import {
  User,
  Layout,
  Server,
  DoorOpen,
  Globe,
  Shield,
  Target,
  Cpu,
  Database,
  Wrench,
  TestTube,
  Box,
  RotateCcw,
  Sparkles,
  X,
  AlertTriangle,
  Boxes,
} from "lucide-react";

import "@xyflow/react/dist/style.css";

/* ==========================================================
   THEME & CONFIGURATION
========================================================== */

const NODE_CONFIG = {
  actor: { icon: User, title: "User", color: "#3b82f6" },
  frontend: { icon: Layout, title: "Frontend", color: "#06b6d4" },
  backend: { icon: Server, title: "Backend", color: "#8b5cf6" },
  entry: { icon: DoorOpen, title: "Entry Point", color: "#10b981" },
  api: { icon: Globe, title: "API Gateway", color: "#f59e0b" },
  middleware: { icon: Shield, title: "Middleware", color: "#ec4899" },
  controller: { icon: Target, title: "Controller", color: "#6366f1" },
  service: { icon: Cpu, title: "Service", color: "#14b8a6" },
  database: { icon: Database, title: "Database", color: "#f43f5e" },
  utility: { icon: Wrench, title: "Utility", color: "#64748b" },
  test: { icon: TestTube, title: "Tests", color: "#a855f7" },
  default: { icon: Box, title: "Module", color: "#64748b" },
};

/* ==========================================================
   CUSTOM ARCHITECTURE NODE
========================================================== */

function ArchitectureNode({ data, selected }) {
  const config = NODE_CONFIG[data?.type] || NODE_CONFIG.default;
  const Icon = config.icon;

  return (
    <div
      className={`w-[220px] rounded-xl p-3.5 transition-all duration-200 border backdrop-blur-md relative group ${
        selected
          ? "bg-slate-900/90 border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.25)] ring-1 ring-indigo-500/50"
          : "bg-slate-900/70 border-slate-800 hover:border-slate-700 shadow-lg shadow-black/40"
      }`}
    >
      {/* Accent Glow Line */}
      <div
        className="absolute top-0 left-3 right-3 h-[2px] rounded-full"
        style={{
          background: `linear-gradient(90deg, transparent, ${config.color}, transparent)`,
        }}
      />

      <Handle
        type="target"
        position={Position.Left}
        className="!w-2.5 !h-2.5 !bg-slate-900 !border-2"
        style={{ borderColor: config.color }}
      />

      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
          style={{
            backgroundColor: `${config.color}15`,
            border: `1px solid ${config.color}35`,
            color: config.color,
          }}
        >
          <Icon size={18} />
        </div>

        <div className="min-w-0 flex-1">
          <h4 className="text-xs font-semibold text-slate-100 truncate tracking-tight">
            {data?.label || config.title}
          </h4>
          <span
            className="text-[10px] font-mono font-bold uppercase tracking-wider block mt-0.5"
            style={{ color: config.color }}
          >
            {data?.type || "module"}
          </span>
        </div>
      </div>

      {data?.description && (
        <p className="mt-2.5 pt-2 border-t border-slate-800/80 text-[11px] leading-relaxed text-slate-400 line-clamp-2">
          {data.description}
        </p>
      )}

      <Handle
        type="source"
        position={Position.Right}
        className="!w-2.5 !h-2.5 !bg-slate-900 !border-2"
        style={{ borderColor: config.color }}
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
   AUTOMATIC NODE LAYOUT
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

  const MAX_COLUMNS_PER_ROW = 5;
  const columnWidth = 260;
  const rowHeight = 150;
  const bandGap = 100;

  const cellMap = new Map();

  rawNodes.forEach((node) => {
    const rawRank = depth.get(node.id) || 0;
    const compactRank = rankIndex.get(rawRank) ?? 0;
    const column = compactRank % MAX_COLUMNS_PER_ROW;
    const band = Math.floor(compactRank / MAX_COLUMNS_PER_ROW);
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
        width: 220,
        height: 80,
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

export default function ArchitectureDiagram({ architecture, height = 650, error = null }) {
  const [selectedNode, setSelectedNode] = useState(null);
  const reactFlowInstanceRef = useRef(null);

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
        color: "#6366f1",
        width: 14,
        height: 14,
      },
      style: {
        stroke: "#6366f1",
        strokeWidth: 1.5,
        opacity: 0.6,
      },
      labelStyle: {
        fill: "#94a3b8",
        fontSize: 10,
        fontWeight: 600,
      },
      labelBgStyle: {
        fill: "#0f172a",
        fillOpacity: 0.9,
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
        style={{ height }}
        className="w-full rounded-2xl border border-rose-500/20 bg-slate-950 flex flex-col items-center justify-center p-6 text-center gap-2"
      >
        <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-1">
          <AlertTriangle size={24} />
        </div>
        <h3 className="text-sm font-semibold text-rose-400">Couldn't load architecture</h3>
        <p className="text-xs text-rose-300/70 max-w-sm">
          {typeof error === "string" ? error : "An error occurred while building the system architecture map."}
        </p>
      </div>
    );
  }

  if (!architecture || sanitized.nodes.length === 0) {
    return (
      <div
        style={{ height }}
        className="w-full rounded-2xl border border-slate-800 bg-slate-950 flex flex-col items-center justify-center p-6 text-center gap-2"
      >
        <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 text-slate-500 flex items-center justify-center mb-1">
          <Boxes size={24} />
        </div>
        <h3 className="text-sm font-semibold text-slate-300">
          {!architecture ? "No architecture available" : "No architecture flow detected"}
        </h3>
        <p className="text-xs text-slate-500 max-w-sm">
          Execute a repository analysis to visualize backend services, pipelines, and component flows.
        </p>
      </div>
    );
  }

  const riskBadgeStyles = {
    High: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    Medium: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    Low: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  }[riskLevel] || "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";

  return (
    <div
      style={{ height }}
      className="w-full flex flex-col rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden shadow-2xl relative"
    >
      {/* Header Bar */}
      <div className="px-5 py-3.5 bg-slate-900/80 border-b border-slate-800 backdrop-blur-md flex items-center justify-between z-10 shrink-0">
        <div>
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            Repository Architecture
          </h3>
          <p className="text-xs text-slate-400 mt-0.5 font-mono">
            {architecture?.framework?.name && `${architecture.framework.name} · `}
            {nodes.length} components · {edges.length} connections
          </p>
        </div>

        <div className="flex items-center gap-2">
          {typeof architecture?.score === "number" && (
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
              Score: {architecture.score}
            </span>
          )}

          <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${riskBadgeStyles}`}>
            {riskLevel} Risk
          </span>

          <button
            type="button"
            onClick={handleResetView}
            className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:text-white transition"
          >
            <RotateCcw size={12} />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* ReactFlow Canvas */}
      <div className="flex-1 relative w-full min-h-0">
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
          <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#334155" />
          <Controls className="!bg-slate-900 !border-slate-800 !shadow-xl !rounded-xl overflow-hidden [&>button]:!bg-slate-900 [&>button]:!border-slate-800 [&>button]:!text-slate-300 hover:[&>button]:!bg-slate-800" />

          <MiniMap
            pannable
            zoomable
            nodeColor={(n) => NODE_CONFIG[n.data?.type]?.color || "#6366f1"}
            nodeStrokeColor={(n) => NODE_CONFIG[n.data?.type]?.color || "#6366f1"}
            nodeStrokeWidth={2}
            nodeBorderRadius={6}
            maskColor="rgba(2, 6, 23, 0.75)"
            className="!bg-slate-900/90 !border-slate-800 !rounded-xl !overflow-hidden"
          />
        </ReactFlow>

        {/* Legend */}
        {legendTypes.length > 0 && (
          <div className="absolute top-4 left-4 z-10 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-md flex flex-wrap gap-3 max-w-md shadow-lg">
            {legendTypes.map((type) => {
              const cfg = NODE_CONFIG[type] || NODE_CONFIG.default;
              const Icon = cfg.icon;
              return (
                <div key={type} className="flex items-center gap-1.5 text-slate-300">
                  <Icon size={12} style={{ color: cfg.color }} />
                  <span className="text-[11px] font-medium capitalize text-slate-400">{type}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Selected Node Drawer */}
        {selectedNode && (
          <div className="absolute right-4 top-4 z-20 w-72 p-4 rounded-xl bg-slate-900/95 border border-slate-800 backdrop-blur-md shadow-2xl space-y-3 animate-in fade-in slide-in-from-right-4 duration-200">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="text-sm font-bold text-slate-100">{selectedNode.data?.label}</h4>
                <span
                  className="text-[10px] font-mono font-bold uppercase tracking-wider inline-block mt-1 px-2 py-0.5 rounded border"
                  style={{
                    backgroundColor: `${NODE_CONFIG[selectedNode.data?.type]?.color}15`,
                    borderColor: `${NODE_CONFIG[selectedNode.data?.type]?.color}30`,
                    color: NODE_CONFIG[selectedNode.data?.type]?.color,
                  }}
                >
                  {selectedNode.data?.type}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedNode(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
              >
                <X size={14} />
              </button>
            </div>

            {selectedNode.data?.description && (
              <p className="text-xs text-slate-300 leading-relaxed pt-2 border-t border-slate-800">
                {selectedNode.data.description}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}