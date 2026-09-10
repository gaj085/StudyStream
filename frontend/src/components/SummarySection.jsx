import React from "react";

function SummarySection({ summary }) {
  if (!summary) return null;

  const keyConcepts = Array.isArray(summary.keyConcepts)
    ? summary.keyConcepts.map((item) => String(item ?? ""))
    : [];

  const takeaways = Array.isArray(summary.takeaways)
    ? summary.takeaways.map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object") {
          const action = item.action || item.title || "Takeaway";
          const insight =
            item.insight || item.description || item.summary || "";
          return insight ? `${action}: ${insight}` : String(action);
        }
        return String(item ?? "");
      })
    : [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title & Summary */}
      <div className="glass-panel p-6 md:p-8 rounded-xl border border-slate-800/80 relative overflow-hidden">
        <div className="flex items-start gap-4 mb-4">
          <div>
            <span className="study-eyebrow">Lecture summary</span>
            <h3 className="text-xl md:text-2xl font-bold text-[#111] mt-0.5 leading-snug">
              {summary.title}
            </h3>
          </div>
        </div>
        <p className="text-[#111] text-sm md:text-base leading-relaxed">
          {summary.summary}
        </p>
      </div>

      {/* Grid of Key Concepts & Takeaways */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Key Concepts */}
        <div className="glass-panel p-6 rounded-xl border border-slate-800/85">
          <div className="mb-4">
            <h4 className="text-sm font-bold text-[#111] tracking-wide uppercase">
              Key Concepts
            </h4>
          </div>

          <ul className="space-y-2">
            {keyConcepts.length > 0 ? (
              keyConcepts.map((kc, i) => (
                <li
                  key={i}
                  className="border-l border-slate-300 pl-3 text-xs font-medium leading-relaxed text-[#111]"
                >
                  {kc}
                </li>
              ))
            ) : (
              <li className="text-xs text-slate-500">No key concepts found.</li>
            )}
          </ul>
        </div>

        {/* Takeaways */}
        <div className="glass-panel p-6 rounded-xl border border-slate-800/85">
          <div className="mb-4">
            <h4 className="text-sm font-bold text-[#111] tracking-wide uppercase">
              Important Takeaways
            </h4>
          </div>

          <ul className="space-y-3">
            {takeaways.length > 0 ? (
              takeaways.map((ta, i) => (
                <li
                  key={i}
                  className="list-disc ml-4 pl-1 text-[#111] text-xs md:text-sm"
                >
                  {ta}
                </li>
              ))
            ) : (
              <li className="text-xs text-slate-500">No takeaways found.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default SummarySection;
