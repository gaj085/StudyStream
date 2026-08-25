import React from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';

function Header({ hasVideo, onReset }) {
  return (
    <header className="flex items-center justify-between py-6 border-b border-slate-800/80 mb-10">
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg blur opacity-40 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-slate-900 border border-slate-800 text-blue-400">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
            StudyStream
          </h1>
          <p className="text-xs text-slate-400">AI-powered video learning assistant</p>
        </div>
      </div>

      {hasVideo && (
        <button
          onClick={onReset}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 rounded-lg transition-all shadow-lg shadow-black/20"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          New Analysis
        </button>
      )}
    </header>
  );
}

export default Header;
