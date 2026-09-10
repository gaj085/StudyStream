import React, { useState } from "react";

function PerformanceMetrics({ latency }) {
  const [expanded, setExpanded] = useState(false);

  if (!latency) return null;

  const formatMs = (ms) => {
    if (!ms && ms !== 0) return "-";
    if (ms >= 1000) return `${(ms / 1000).toFixed(2)}s`;
    return `${ms}ms`;
  };

  const metrics = [
    { label: "Embedding", value: latency.embedding, color: "text-blue-400" },
    { label: "Retrieval", value: latency.retrieval, color: "text-rose-500" },
    { label: "LLM", value: latency.generation, color: "text-cyan-400" },
    {
      label: "Total",
      value: latency.total,
      color: "text-emerald-400",
      bold: true,
    },
  ];

  return (
    <div className="performance-panel border-t border-slate-800/50 pt-3 mt-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-[10px] text-slate-500 hover:text-slate-400 transition-colors uppercase tracking-wider font-semibold"
      >
        <span>{expanded ? "▾" : "▸"}</span>
        Performance
      </button>

      {expanded && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {metrics.map((m) => (
            <div
              key={m.label}
              className="flex justify-between items-center px-3 py-2 bg-slate-950/60 rounded-lg border border-slate-800/50"
            >
              <span className="text-[11px] text-slate-500">{m.label}</span>
              <span
                className={`text-[11px] font-mono font-semibold ${m.color} ${m.bold ? "text-xs" : ""}`}
              >
                {formatMs(m.value)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default PerformanceMetrics;
