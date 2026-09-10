import React from "react";
import { BookOpen, Check, Award, Lightbulb } from "lucide-react";

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
          <div className="w-10 h-10 rounded-lg bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <span className="study-eyebrow">Lecture summary</span>
            <h3 className="text-xl md:text-2xl font-bold text-slate-100 mt-0.5 leading-snug">
              {summary.title}
            </h3>
          </div>
        </div>
        <p className="text-slate-350 text-sm md:text-base leading-relaxed">
          {summary.summary}
        </p>
      </div>

      {/* Grid of Key Concepts & Takeaways */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Key Concepts */}
        <div className="glass-panel p-6 rounded-xl border border-slate-800/85">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-md bg-purple-600/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
              <Lightbulb className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-slate-200 tracking-wide uppercase">
              Key Concepts
            </h4>
          </div>

          <ul className="space-y-2">
            {keyConcepts.length > 0 ? (
              keyConcepts.map((kc, i) => (
                <li
                  key={i}
                  className="border-l-2 border-blue-400/50 pl-3 text-xs font-medium leading-relaxed text-slate-500"
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
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-md bg-cyan-600/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-slate-200 tracking-wide uppercase">
              Important Takeaways
            </h4>
          </div>

          <ul className="space-y-3">
            {takeaways.length > 0 ? (
              takeaways.map((ta, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 text-slate-350 text-xs md:text-sm"
                >
                  <div className="w-4 h-4 rounded-full bg-cyan-900/30 border border-cyan-800/50 flex items-center justify-center mt-0.5 shrink-0 text-cyan-400">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                  <span>{ta}</span>
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
