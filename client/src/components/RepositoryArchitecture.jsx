import React from "react";
import {
  GitBranch,
  Sparkles,
  Globe,
  Server,
  Database,
  Layers,
  Shield,
  Code2,
  ChevronDown,
} from "lucide-react";

// Centralized type config so icon + color always stay in sync
// (previously these lived in two separate switch statements that
// could silently drift out of sync as types were added).
const NODE_TYPES = {
  frontend: {
    icon: Globe,
    text: "text-indigo-700",
    bg: "bg-indigo-50",
    border: "border-indigo-200",
    iconBg: "bg-indigo-100",
  },
  api: {
    icon: Server,
    text: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
    iconBg: "bg-blue-100",
  },
  service: {
    icon: Layers,
    text: "text-purple-700",
    bg: "bg-purple-50",
    border: "border-purple-200",
    iconBg: "bg-purple-100",
  },
  database: {
    icon: Database,
    text: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    iconBg: "bg-emerald-100",
  },
  middleware: {
    icon: Shield,
    text: "text-orange-700",
    bg: "bg-orange-50",
    border: "border-orange-200",
    iconBg: "bg-orange-100",
  },
  controller: {
    icon: Code2,
    text: "text-slate-700",
    bg: "bg-slate-50",
    border: "border-slate-200",
    iconBg: "bg-slate-100",
  },
  default: {
    icon: Layers,
    text: "text-slate-700",
    bg: "bg-slate-50",
    border: "border-slate-200",
    iconBg: "bg-slate-100",
  },
};

function getTypeConfig(type) {
  return NODE_TYPES[type] || NODE_TYPES.default;
}

function ArchitectureNode({ node, index }) {
  const config = getTypeConfig(node.type);
  const Icon = config.icon;

  return (
    <div
      role="listitem"
      aria-label={`${node.label}: ${node.description || ""}`}
      className={`
        w-full max-w-xs
        rounded-xl border p-4 shadow-sm
        transition-transform duration-200
        hover:-translate-y-0.5 hover:shadow-md
        ${config.bg} ${config.border}
      `}
      style={{
        animation: `archNodeIn 0.4s ease-out ${index * 80}ms both`,
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className={`shrink-0 rounded-lg p-2 ${config.iconBg} ${config.text}`}
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
        </div>

        <div className="min-w-0">
          <p className={`text-sm font-semibold ${config.text}`}>
            {node.label}
          </p>
          {node.description && (
            <p className="text-xs text-slate-500 mt-1 leading-5">
              {node.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function Connector({ label }) {
  return (
    <div className="flex flex-col items-center py-2" aria-hidden="true">
      <div className="h-5 w-px bg-slate-300" />
      {label && (
        <span className="my-1 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs font-medium text-slate-500">
          {label}
        </span>
      )}
      <div className="h-5 w-px bg-slate-300" />
      <ChevronDown className="h-3.5 w-3.5 text-slate-300 -mt-0.5" />
    </div>
  );
}

function EmptyState({ title, message, icon: Icon = GitBranch }) {
  return (
    <div className="text-center py-10">
      <Icon className="h-10 w-10 text-slate-300 mx-auto" aria-hidden="true" />
      <p className="text-sm text-slate-500 mt-3">{message}</p>
    </div>
  );
}

export default function RepositoryArchitecture({ architecture }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
      <style>{`
        @keyframes archNodeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          [style*="archNodeIn"] { animation: none !important; }
        }
      `}</style>

      {/* Header */}
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-50">
              <GitBranch className="h-5 w-5 text-indigo-600" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                AI Architecture
              </h2>
              <p className="text-sm text-slate-500">
                How your repository works
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-50">
            <Sparkles className="h-4 w-4 text-purple-600" aria-hidden="true" />
            <span className="text-xs font-medium text-purple-700">
              AI Generated
            </span>
          </div>
        </div>
      </div>

      {!architecture ? (
        <div className="p-8">
          <EmptyState message="Analyze the repository to generate its architecture." />
        </div>
      ) : (
        <>
          {/* Architecture */}
          <div className="p-8">
            {(() => {
              const flow = architecture.flow || {};
              const nodes = flow.nodes || [];
              const edges = flow.edges || [];

              if (nodes.length === 0) {
                return (
                  <EmptyState message="Architecture flow is not available yet." />
                );
              }

              return (
                <div
                  role="list"
                  aria-label="Repository architecture flow"
                  className="flex flex-col items-center overflow-x-auto"
                >
                  {nodes.map((node, index) => {
                    const edge = edges.find((item) => item.source === node.id);
                    const isLast = index === nodes.length - 1;

                    return (
                      <React.Fragment key={node.id ?? index}>
                        <ArchitectureNode node={node} index={index} />
                        {!isLast && <Connector label={edge?.label} />}
                      </React.Fragment>
                    );
                  })}
                </div>
              );
            })()}
          </div>

          {/* AI Explanation */}
          <div className="mx-6 mb-6 rounded-xl border border-purple-100 bg-purple-50/50 p-5">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-purple-600" aria-hidden="true" />
              <h3 className="text-sm font-semibold text-slate-900">
                How this repository works
              </h3>
            </div>
            <p className="text-sm text-slate-600 leading-6">
              {architecture.aiSummary ||
                architecture.summary?.title ||
                "RepoIQ AI detected the main architectural layers of this repository."}
            </p>
          </div>
        </>
      )}
    </div>
  );
}