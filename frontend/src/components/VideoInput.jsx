import React, { useState, useEffect } from "react";
import {
  Video,
  ArrowRight,
  History,
  Play,
  MessageSquare,
  HelpCircle,
  Clock,
} from "lucide-react";

function VideoInput({ onAnalyze, isLoading }) {
  const [url, setUrl] = useState("");
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const savedHistory = localStorage.getItem("studystream_history");
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Error loading history:", e);
      }
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!url.trim()) return;
    onAnalyze(url);
  };

  const handleSelectHistory = (historyUrl) => {
    setUrl(historyUrl);
    onAnalyze(historyUrl);
  };

  const CAPABILITIES = [
    {
      icon: MessageSquare,
      title: "Ask questions",
      desc: "Find an explanation without scrubbing through the video.",
      color: "text-blue-400",
      border: "hover:border-blue-800/60",
      bg: "hover:bg-blue-950/20",
    },
    {
      icon: HelpCircle,
      title: "Check yourself",
      desc: "A short quiz built from what the lecture covers.",
      color: "text-purple-400",
      border: "hover:border-purple-800/60",
      bg: "hover:bg-purple-950/20",
    },
    {
      icon: Clock,
      title: "Jump to the source",
      desc: "Every answer points back to a moment in the lecture.",
      color: "text-cyan-400",
      border: "hover:border-cyan-800/60",
      bg: "hover:bg-cyan-950/20",
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center max-w-2xl mx-auto py-10 md:py-16 animate-fade-in">
      <div className="text-center mb-10">
        <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
          Make a lecture easier to{" "}
          <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            study
          </span>
        </h2>
        <p className="text-base text-slate-400 max-w-lg mx-auto">
          Paste a YouTube lecture to get a short study guide, a quick check, and
          answers tied to the transcript.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="w-full mb-6">
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/30 to-purple-500/30 rounded-xl blur opacity-30 group-focus-within:opacity-100 group-hover:opacity-60 transition duration-300"></div>

          <div className="relative flex flex-col md:flex-row items-center gap-3 p-2 bg-slate-900/80 border border-slate-800 rounded-xl shadow-2xl backdrop-blur-xl">
            <div className="flex items-center gap-3 flex-grow w-full px-3 py-1">
              <Video className="w-6 h-6 text-blue-400 shrink-0" />
              <input
                type="text"
                placeholder="Paste YouTube lecture URL (e.g. https://youtube.com/watch?v=...)"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={isLoading}
                className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 border-none outline-none focus:ring-0 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !url.trim()}
              className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:from-slate-800 disabled:to-slate-800 text-sm font-semibold rounded-lg shadow-lg hover:shadow-blue-500/20 disabled:shadow-none hover:scale-[1.02] disabled:scale-100 disabled:text-slate-500 transition-all text-white shrink-0 cursor-pointer"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  Analyze
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      <div className="study-transcript-card w-full max-w-md p-5 mb-10 text-left">
        <div className="flex items-center justify-between border-b border-slate-800/50 pb-3 mb-4 study-eyebrow">
          <span>lecture_transcript.txt</span>
          <span>12:34</span>
        </div>
        <p className="text-sm leading-7 text-slate-700">
          &quot;...the second law tells us that{" "}
          <mark>entropy of an isolated system never decreases</mark> - this is
          the direction time appears to flow in...&quot;
        </p>
        <p className="mt-4 text-xs text-rose-700 font-medium">
          ↳ asked: &quot;what&apos;s entropy again?&quot; answered from 12:34
        </p>
      </div>

      {/* Pipeline label */}
      <div className="text-[11px] text-slate-500 mb-10 tracking-widest uppercase font-medium">
        Transcript <span className="text-slate-600 mx-1">→</span>
        Study guide <span className="text-slate-600 mx-1">→</span>
        Questions <span className="text-slate-600 mx-1">→</span>
        Sources
      </div>

      {/* Capability Cards */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-3 mb-10">
        {CAPABILITIES.map((cap) => {
          const Icon = cap.icon;
          return (
            <div
              key={cap.title}
              className={`flex flex-col items-center text-center p-5 rounded-xl bg-slate-900/30 border border-slate-850 ${cap.border} ${cap.bg} transition-all duration-200 cursor-default`}
            >
              <Icon className={`w-6 h-6 mb-3 ${cap.color}`} />
              <p className="text-sm font-semibold text-slate-200 mb-1">
                {cap.title}
              </p>
              <p className="text-xs text-slate-500 leading-snug">{cap.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Lightweight History Panel */}
      {history.length > 0 && (
        <div className="w-full border-t border-slate-900 pt-8 animate-fade-in">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold mb-4 px-2 tracking-wider uppercase">
            <History className="w-3.5 h-3.5" />
            Recent
          </div>
          <div className="grid gap-2">
            {history.slice(0, 3).map((item, index) => (
              <button
                key={index}
                onClick={() => handleSelectHistory(item.url)}
                disabled={isLoading}
                className="flex items-center justify-between text-left p-3.5 bg-slate-900/30 hover:bg-slate-900/60 border border-slate-850 hover:border-slate-800 rounded-lg group transition-all duration-200"
              >
                <div className="flex items-center gap-3 min-w-0 pr-4">
                  <Play className="w-3.5 h-3.5 text-blue-400 shrink-0 opacity-40 group-hover:opacity-100 group-hover:scale-110 transition-all" />
                  <span className="text-sm font-medium text-slate-350 group-hover:text-slate-200 truncate">
                    {item.title || item.url}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 shrink-0 font-mono hidden sm:inline-block">
                  {item.videoId
                    ? `ID: ${item.videoId.substring(0, 6)}...`
                    : "YouTube"}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default VideoInput;
