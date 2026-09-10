import React, { useState } from "react";
import {
  CheckCircle,
  XCircle,
  ArrowRight,
  RotateCcw,
  MessageSquare,
} from "lucide-react";

function QuizSection({ quiz, onAskTutor }) {
  const [started, setStarted] = useState(false);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  if (!quiz || quiz.length === 0) return null;

  const currentQ = quiz[currentQIndex];

  const handleStart = () => {
    setStarted(true);
  };

  const handleSelect = (opt) => {
    if (!submitted) {
      setSelectedOption(opt);
    }
  };

  const handleSubmit = () => {
    if (!selectedOption) return;
    setSubmitted(true);
    if (selectedOption === currentQ.correctAnswer) {
      setScore(score + 1);
    }
  };

  const handleNext = () => {
    if (currentQIndex < quiz.length - 1) {
      setCurrentQIndex(currentQIndex + 1);
      setSelectedOption(null);
      setSubmitted(false);
    } else {
      setFinished(true);
    }
  };

  const handleReset = () => {
    setStarted(false);
    setCurrentQIndex(0);
    setSelectedOption(null);
    setSubmitted(false);
    setScore(0);
    setFinished(false);
  };

  if (!started) {
    return (
      <div className="glass-panel p-8 rounded-xl border border-slate-800/85 text-center flex flex-col items-center justify-center animate-fade-in relative overflow-hidden">
        <h3 className="text-2xl font-bold text-slate-100 mb-2">Quick check</h3>
        <p className="text-slate-400 mb-6 max-w-sm">
          See what stuck with a short quiz based on the lecture.
        </p>
        <button
          onClick={handleStart}
          className="px-6 py-2.5 bg-white hover:bg-[#fff5f3] text-[#c1443c] font-semibold rounded-md border border-[#c1443c] transition-colors"
        >
          Start Quiz
        </button>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="glass-panel p-8 rounded-xl border border-slate-800/85 text-center animate-fade-in">
        <p className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-2">
          Quiz complete
        </p>
        <div className="text-6xl font-extrabold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent my-6">
          {score} / {quiz.length}
        </div>
        <p className="text-sm text-slate-400 mb-8">
          {score === quiz.length
            ? "Perfect score. You mastered this lecture."
            : score >= Math.ceil(quiz.length / 2)
              ? "Good work. Review the ones you missed with the Tutor."
              : "Keep going. Ask the Tutor to explain the concepts you found tricky."}
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button
            onClick={handleReset}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-white hover:bg-slate-50 text-[#111] font-medium rounded-lg transition-colors border-2 border-[#111] hover:border-[#c1443c]"
          >
            <RotateCcw className="w-4 h-4" />
            Review Answers
          </button>
          <button
            onClick={() =>
              onAskTutor(
                "I need help understanding some concepts from the quiz.",
              )
            }
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-all shadow-lg hover:shadow-blue-500/20"
          >
            <MessageSquare className="w-4 h-4" />
            Ask Tutor
          </button>
        </div>
      </div>
    );
  }

  const isCorrect = selectedOption === currentQ.correctAnswer;

  return (
    <div className="glass-panel p-6 md:p-8 rounded-xl border border-slate-800/85 animate-fade-in flex flex-col min-h-[400px]">
      <div className="flex justify-between items-center mb-6">
        <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
          Question {currentQIndex + 1} of {quiz.length}
        </span>
        <span className="text-xs font-medium text-slate-500 bg-slate-900 px-2 py-1 rounded-md border border-slate-800">
          Score: {score}
        </span>
      </div>

      <h4 className="text-lg md:text-xl font-semibold text-slate-100 mb-6 leading-relaxed">
        {currentQ.question}
      </h4>

      <div className="space-y-3 flex-grow">
        {currentQ.options.map((opt, i) => {
          let style =
            "bg-slate-900/50 border-slate-800 hover:border-purple-500/50 hover:bg-slate-800/80 text-slate-300";
          if (submitted) {
            if (opt === currentQ.correctAnswer) {
              style =
                "bg-emerald-900/20 border-emerald-500/50 text-emerald-200";
            } else if (opt === selectedOption && !isCorrect) {
              style = "bg-rose-900/20 border-rose-500/50 text-rose-200";
            } else {
              style =
                "bg-slate-900/30 border-slate-800/50 text-slate-500 opacity-50";
            }
          } else if (opt === selectedOption) {
            style =
              "bg-purple-900/40 border-purple-500 text-purple-100 shadow-[0_0_10px_rgba(168,85,247,0.2)]";
          }

          return (
            <button
              key={i}
              onClick={() => handleSelect(opt)}
              disabled={submitted}
              className={`w-full text-left p-4 rounded-xl border transition-all duration-200 flex items-center justify-between ${style}`}
            >
              <span className="text-sm md:text-base pr-4">{opt}</span>
              {submitted && opt === currentQ.correctAnswer && (
                <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
              )}
              {submitted && opt === selectedOption && !isCorrect && (
                <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-6 pt-6 border-t border-slate-800/80">
        {!submitted ? (
          <button
            onClick={handleSubmit}
            disabled={!selectedOption}
            className="quiz-submit-button w-full py-3 bg-purple-600 disabled:bg-slate-800 disabled:text-slate-500 text-white font-semibold rounded-lg transition-colors"
          >
            Submit Answer
          </button>
        ) : (
          <div className="animate-fade-in-up">
            <div
              className={`p-4 rounded-lg mb-4 border ${isCorrect ? "bg-emerald-950/30 border-emerald-900/50" : "bg-rose-950/30 border-rose-900/50"}`}
            >
              <p className="text-sm">
                <span
                  className={`font-bold mr-2 ${isCorrect ? "text-emerald-400" : "text-rose-400"}`}
                >
                  {isCorrect ? "Correct!" : "Incorrect."}
                </span>
                <span className="text-slate-300">{currentQ.explanation}</span>
              </p>
            </div>
            <button
              onClick={handleNext}
              className="w-full py-3 flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-[#111] font-semibold rounded-lg transition-colors border-2 border-[#111] hover:border-[#c1443c]"
            >
              {currentQIndex < quiz.length - 1
                ? "Next question"
                : "View results"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default QuizSection;
