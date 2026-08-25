import React from 'react';
import { BookOpen, Check, Award, Lightbulb } from 'lucide-react';

function SummarySection({ summary }) {
  if (!summary) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title & Summary */}
      <div className="glass-panel p-6 md:p-8 rounded-xl border border-slate-800/80 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex items-start gap-4 mb-4">
          <div className="w-10 h-10 rounded-lg bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-blue-400">Lecture Summary</span>
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
            <h4 className="text-sm font-bold text-slate-200 tracking-wide uppercase">Key Concepts</h4>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {summary.keyConcepts && summary.keyConcepts.length > 0 ? (
              summary.keyConcepts.map((kc, i) => (
                <span 
                  key={i} 
                  className="px-3 py-1.5 text-xs font-semibold text-purple-300 hover:text-white bg-purple-950/20 border border-purple-900/40 hover:border-purple-500/40 rounded-full transition-all duration-200 cursor-default"
                >
                  {kc}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-500">No key concepts generated.</span>
            )}
          </div>
        </div>

        {/* Takeaways */}
        <div className="glass-panel p-6 rounded-xl border border-slate-800/85">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-md bg-cyan-600/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-slate-200 tracking-wide uppercase">Important Takeaways</h4>
          </div>

          <ul className="space-y-3">
            {summary.takeaways && summary.takeaways.length > 0 ? (
              summary.takeaways.map((ta, i) => (
                <li key={i} className="flex items-start gap-3 text-slate-350 text-xs md:text-sm">
                  <div className="w-4 h-4 rounded-full bg-cyan-900/30 border border-cyan-800/50 flex items-center justify-center mt-0.5 shrink-0 text-cyan-400">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                  <span>{ta}</span>
                </li>
              ))
            ) : (
              <li className="text-xs text-slate-500">No takeaways generated.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default SummarySection;
