import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import Header from "./components/Header";
import VideoInput from "./components/VideoInput";
import ProcessingPipeline from "./components/ProcessingPipeline";
import SummarySection from "./components/SummarySection";
import QuizSection from "./components/QuizSection";
import AITutor from "./components/AITutor";
import "./App.css";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

function App() {
  // --- State ---
  const [videoUrl, setVideoUrl] = useState("");
  const [jobId, setJobId] = useState(null);
  const [jobStatus, setJobStatus] = useState("idle"); // idle | queued | transcribing | chunking | embedding | indexing | summarizing | ready | error
  const [jobProgress, setJobProgress] = useState(0);
  const [jobMessage, setJobMessage] = useState("");
  const [jobError, setJobError] = useState(null);

  const [videoId, setVideoId] = useState(null);
  const [summary, setSummary] = useState(null);
  const [quiz, setQuiz] = useState(null);

  const [tutorOpen, setTutorOpen] = useState(false);
  const [tutorInitialQuestion, setTutorInitialQuestion] = useState(null);

  const eventSourceRef = useRef(null);

  // --- Reset everything ---
  const handleReset = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setVideoUrl("");
    setJobId(null);
    setJobStatus("idle");
    setJobProgress(0);
    setJobMessage("");
    setJobError(null);
    setVideoId(null);
    setSummary(null);
    setQuiz(null);
    setTutorOpen(false);
    setTutorInitialQuestion(null);
  };

  // --- Submit YouTube URL to backend ---
  const handleAnalyze = async (url) => {
    if (!url.trim()) return;
    setVideoUrl(url);
    setJobError(null);
    setJobStatus("queued");
    setJobProgress(0);
    setSummary(null);
    setQuiz(null);
    setVideoId(null);

    try {
      const res = await axios.post(`${API_BASE_URL}/videos`, { url });
      setJobId(res.data.jobId);
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        "Failed to start processing. Is the backend running?";
      setJobError(msg);
      setJobStatus("error");
    }
  };

  // Keep exactly one progress stream per job. Closing the previous stream is
  // important when a user starts a new analysis before the old one finishes.
  useEffect(() => {
    if (!jobId) return;

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const es = new EventSource(`${API_BASE_URL}/videos/jobs/${jobId}/progress`);
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setJobStatus(data.status);
        setJobProgress(data.progress || 0);
        setJobMessage(data.message || "");

        if (data.status === "ready") {
          const vid = data.result?.videoId;
          setVideoId(vid);
          // The SSE payload only confirms completion and supplies the ID;
          // summary and quiz are exposed by their own resource endpoints.
          fetchSummaryAndQuiz(vid);
          es.close();
        }

        if (data.status === "error") {
          setJobError(data.message || "An error occurred during processing.");
          es.close();
        }
      } catch (e) {
        console.error("SSE parse error:", e);
      }
    };

    es.onerror = () => {
      setJobError("Connection to server lost during processing.");
      es.close();
    };

    return () => {
      es.close();
    };
  }, [jobId]);

  // --- Fetch summary and quiz after ready ---
  const fetchSummaryAndQuiz = async (vid) => {
    try {
      const [summaryRes, quizRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/videos/${vid}/summary`),
        axios.get(`${API_BASE_URL}/videos/${vid}/quiz`),
      ]);
      setSummary(summaryRes.data);

      // Accept the response shapes used by the API and older stored results.
      const raw = quizRes.data;
      if (Array.isArray(raw)) setQuiz(raw);
      else if (raw.questions) setQuiz(raw.questions);
      else if (raw.quiz) setQuiz(raw.quiz);
      else setQuiz([]);

      // Keep history client-side, deduplicated by URL, and capped at five items.
      saveToHistory(videoUrl, vid, summaryRes.data?.title);
    } catch (err) {
      console.error("Failed to fetch summary/quiz:", err);
    }
  };

  // --- Save analysis to localStorage history ---
  const saveToHistory = (url, vid, title) => {
    try {
      const stored = JSON.parse(
        localStorage.getItem("studystream_history") || "[]",
      );
      const entry = { url, videoId: vid, title: title || url };
      const filtered = stored.filter((h) => h.url !== url);
      const updated = [entry, ...filtered].slice(0, 5);
      localStorage.setItem("studystream_history", JSON.stringify(updated));
    } catch (e) {
      console.error("Error saving history:", e);
    }
  };

  const isProcessing = [
    "queued",
    "transcribing",
    "chunking",
    "embedding",
    "indexing",
    "summarizing",
  ].includes(jobStatus);
  const isReady = jobStatus === "ready" && videoId;
  const hasVideo = isProcessing || isReady || jobStatus === "error";

  return (
    <div className="min-h-screen bg-grid relative">
      <div
        className={`relative z-10 flex min-h-screen transition-all duration-300 ${isReady ? "gap-0" : ""}`}
      >
        {/* Main Content Area */}
        <div className={`flex-grow min-w-0 transition-all duration-300`}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-24">
            <Header hasVideo={hasVideo} onReset={handleReset} />

            {/* Landing / Input */}
            {!hasVideo && (
              <VideoInput onAnalyze={handleAnalyze} isLoading={false} />
            )}

            {/* Processing Pipeline */}
            {isProcessing && (
              <ProcessingPipeline
                status={jobStatus}
                progress={jobProgress}
                message={jobMessage}
              />
            )}

            {/* Error State */}
            {jobStatus === "error" && (
              <div className="max-w-xl mx-auto mt-10 glass-panel rounded-xl border border-rose-900/50 p-8 text-center animate-fade-in">
                <div className="text-rose-500 text-4xl mb-4">⚠</div>
                <h3 className="text-lg font-bold text-rose-400 mb-2">
                  Processing Failed
                </h3>
                <p className="text-sm text-slate-400 mb-6">{jobError}</p>
                <button
                  onClick={handleReset}
                  className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-white font-semibold rounded-lg transition-all"
                >
                  Try Again
                </button>
              </div>
            )}

            {/* Results Dashboard */}
            {isReady && (
              <div className="animate-fade-in">
                {/* Video Status Badge */}
                <div className="flex flex-wrap items-center justify-between gap-4 mb-8 p-4 glass-panel rounded-xl border border-emerald-900/30">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-600"></div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                        Ready to study
                      </p>
                      <p className="text-sm text-slate-300 truncate max-w-xs md:max-w-md mt-0.5">
                        {summary?.title || videoUrl}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setTutorOpen((isOpen) => !isOpen)}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-[#c1443c] hover:text-[#a63731] bg-white hover:bg-[#fff5f3] border border-[#c1443c] rounded-md transition-colors"
                  >
                    {tutorOpen ? "Close Tutor" : "Open Tutor"}
                  </button>
                </div>

                <div className="space-y-8">
                  <SummarySection summary={summary} />
                  <QuizSection
                    quiz={quiz}
                    onAskTutor={(q) => {
                      setTutorInitialQuestion(q);
                      setTutorOpen(true);
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* AI Tutor Sidebar - only show when a video is ready */}
        {isReady && tutorOpen && (
          <div className="hidden lg:block w-96 shrink-0 sticky top-0 h-screen py-4 pr-4">
            <AITutor
              videoId={videoId}
              videoUrl={videoUrl}
              isOpen={true}
              onClose={() => setTutorOpen(false)}
              onOpen={() => setTutorOpen(true)}
              initialQuestion={tutorInitialQuestion}
            />
          </div>
        )}
      </div>

      {/* Mobile AI Tutor Drawer - shown only below lg breakpoint */}
      <div className="lg:hidden">
        {isReady && (
          <AITutor
            videoId={videoId}
            videoUrl={videoUrl}
            isOpen={tutorOpen}
            onClose={() => setTutorOpen(false)}
            onOpen={() => setTutorOpen(true)}
            initialQuestion={tutorInitialQuestion}
          />
        )}
      </div>
    </div>
  );
}

export default App;
