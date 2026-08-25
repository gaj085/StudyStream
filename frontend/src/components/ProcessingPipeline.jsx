import React from 'react';
import { 
  FileText, Scissors, Cpu, Database, BookOpen, Check, Loader2 
} from 'lucide-react';

function ProcessingPipeline({ status, progress, message }) {
  // Define the stages
  const stages = [
    {
      id: 'transcribing',
      name: 'Fetch Transcript',
      desc: 'Retrieving captions directly from YouTube',
      minProgress: 20,
      icon: FileText,
    },
    {
      id: 'chunking',
      name: 'Chunk Transcript',
      desc: 'Splitting text while preserving timestamps',
      minProgress: 40,
      icon: Scissors,
    },
    {
      id: 'embedding',
      name: 'Generate Embeddings',
      desc: 'Converting segments into vectors via local MiniLM model',
      minProgress: 60,
      icon: Cpu,
    },
    {
      id: 'indexing',
      name: 'Index in ChromaDB',
      desc: 'Storing high-dimensional embeddings in vector database',
      minProgress: 80,
      icon: Database,
    },
    {
      id: 'summarizing',
      name: 'Generate Learning Content',
      desc: 'Generating video summary, concepts, takeaways, and quiz',
      minProgress: 90,
      icon: BookOpen,
    }
  ];

  // Helper to determine stage status
  const getStageStatus = (stage, currentStatus, currentProgress) => {
    if (currentStatus === 'error') return 'pending';
    
    // Find stage index and current active stage index
    const stageIdx = stages.findIndex(s => s.id === stage.id);
    
    // If progress is 100 or ready, all are complete
    if (currentStatus === 'ready' || currentProgress === 100) {
      return 'completed';
    }

    // Determine current active stage ID index
    const activeStageIdx = stages.findIndex(s => s.id === currentStatus);

    if (stageIdx < activeStageIdx && activeStageIdx !== -1) {
      return 'completed';
    }
    
    if (stageIdx === activeStageIdx) {
      return 'active';
    }

    // Fallback on progress percentage
    if (currentProgress >= stage.minProgress + 10) {
      return 'completed';
    } else if (currentProgress >= stage.minProgress && currentProgress < stage.minProgress + 10) {
      return 'active';
    }

    return 'pending';
  };

  return (
    <div className="max-w-xl mx-auto py-8 px-4 animate-fade-in">
      <div className="glass-panel p-8 rounded-2xl border border-slate-800/80 shadow-2xl relative overflow-hidden">
        {/* Glow decoration */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl"></div>
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl"></div>

        <div className="text-center mb-8">
          <h3 className="text-xl font-bold mb-2">Analyzing Video Lectures</h3>
          <p className="text-sm text-slate-400">Please wait while we process the RAG pipeline</p>
        </div>

        {/* Global Progress Bar */}
        <div className="mb-10">
          <div className="flex justify-between text-xs font-semibold text-slate-400 mb-2">
            <span>Overall Progress</span>
            <span className="text-blue-400 font-mono">{progress}%</span>
          </div>
          <div className="w-full bg-slate-900 border border-slate-850 rounded-full h-3 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-400 h-full rounded-full transition-all duration-700 ease-out" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          {message && (
            <p className="text-xs text-slate-500 text-center mt-3 italic animate-pulse">
              "{message}"
            </p>
          )}
        </div>

        {/* Pipeline Stages */}
        <div className="space-y-6 relative">
          {/* Connector Line */}
          <div className="absolute left-6 top-3 bottom-3 w-0.5 bg-slate-800"></div>

          {stages.map((stage, i) => {
            const stageStatus = getStageStatus(stage, status, progress);
            const Icon = stage.icon;

            return (
              <div 
                key={stage.id} 
                className={`flex items-start gap-4 relative transition-all duration-300 ${
                  stageStatus === 'pending' ? 'opacity-40' : 'opacity-100'
                }`}
              >
                {/* Node Dot / Status Icon */}
                <div className={`z-10 flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-300 ${
                  stageStatus === 'completed' 
                    ? 'bg-blue-600/20 border border-blue-500 text-blue-400' 
                    : stageStatus === 'active'
                    ? 'bg-purple-600/20 border border-purple-500 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.2)] animate-pulse'
                    : 'bg-slate-900 border border-slate-800 text-slate-500'
                }`}>
                  {stageStatus === 'completed' ? (
                    <Check className="w-5 h-5 stroke-[3]" />
                  ) : stageStatus === 'active' ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>

                {/* Stage Info */}
                <div className="flex-grow pt-1">
                  <div className="flex items-center gap-2">
                    <h4 className={`text-sm font-semibold transition-colors duration-300 ${
                      stageStatus === 'active' ? 'text-purple-400' : 'text-slate-200'
                    }`}>
                      {stage.name}
                    </h4>
                    {stageStatus === 'active' && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-purple-450 font-medium animate-pulse">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{stage.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default ProcessingPipeline;
