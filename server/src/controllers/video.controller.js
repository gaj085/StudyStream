const {
  createJob,
  getJob,
  updateJobProgress,
  completeJob,
  failJob,
} = require("../services/job.service");
const { fetchTranscript } = require("../services/transcription.service");
const { chunkTranscript } = require("../services/chunking.service");
const { generateEmbeddings } = require("../services/embedding.service");
const { storeChunks, deleteChunks } = require("../clients/chroma.client");
const { handleChat } = require("../services/rag.service");
const { generateSummary, generateQuiz } = require("../services/llm.service");
const { v4: uuidv4 } = require("uuid");

// Process-local metadata keeps this MVP simple; restarting the server loses
// summaries and quizzes even though transcript vectors remain in ChromaDB.
const videoStore = {};

async function processVideoBackground(jobId, youtubeUrl) {
  try {
    const videoId = uuidv4();

    // 1. Transcribe (Fetch from YouTube)
    updateJobProgress(
      jobId,
      "transcribing",
      20,
      "Fetching transcript from YouTube...",
    );
    let segments;
    try {
      segments = await fetchTranscript(youtubeUrl);
    } catch (err) {
      throw new Error(
        "No usable YouTube captions were found for this video. Please try a video with subtitles enabled.",
      );
    }

    if (!segments || segments.length === 0) {
      throw new Error(
        "No usable YouTube captions were found for this video. Please try a video with subtitles enabled.",
      );
    }

    // 2. Chunking
    updateJobProgress(
      jobId,
      "chunking",
      40,
      "Chunking transcript with timestamp preservation...",
    );
    const chunks = chunkTranscript(segments);

    // 3. Embedding
    updateJobProgress(
      jobId,
      "embedding",
      60,
      "Generating local embeddings via MiniLM...",
    );
    const texts = chunks.map((c) => c.text);
    const embeddings = await generateEmbeddings(texts);

    // 4. Indexing (ChromaDB)
    // Delete any pre-existing chunks for this videoId before inserting.
    // Since videoId is a fresh UUID each run, this is a no-op for new videos,
    // but is a safety measure in case of any ID collision edge cases.
    updateJobProgress(
      jobId,
      "indexing",
      80,
      "Indexing embeddings in ChromaDB...",
    );
    await deleteChunks(videoId);
    await storeChunks(videoId, chunks, embeddings);

    // 5. Generate Summary and Quiz
    updateJobProgress(
      jobId,
      "summarizing",
      90,
      "Generating summary, key concepts, and quiz...",
    );
    let summary, quiz;
    try {
      summary = await generateSummary(segments);
    } catch (err) {
      throw new Error(
        "Learning content could not be generated. Please try again.",
      );
    }
    try {
      quiz = await generateQuiz(segments);
    } catch (err) {
      console.error("Quiz generation failed (non-fatal):", err.message);
      quiz = [];
    }

    // Save to in-memory store
    videoStore[videoId] = {
      videoId,
      youtubeUrl,
      summary,
      quiz,
      status: "ready",
    };

    // Complete
    completeJob(jobId, { videoId, chunkCount: chunks.length });
  } catch (error) {
    console.error("[processVideoBackground] Error:", error.message);
    failJob(jobId, error);
  }
}

async function startVideoProcessing(req, res) {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: "YouTube URL is required" });
  }

  if (!url.includes("youtube.com") && !url.includes("youtu.be")) {
    return res
      .status(400)
      .json({
        error: "Invalid YouTube URL. Please paste a valid YouTube link.",
      });
  }

  const jobId = createJob();
  // Start work after the 202 response so the request is not held open while
  // transcription, embedding, indexing, and generation run in sequence.
  processVideoBackground(jobId, url);
  return res.status(202).json({ jobId });
}

async function getJobStatus(req, res) {
  const { jobId } = req.params;
  const job = getJob(jobId);

  if (!job) {
    return res.status(404).json({ error: "Job not found" });
  }

  return res.json(job);
}

// SSE Endpoint for job progress. The endpoint sends the current snapshot first,
// then polls the shared job record until processing finishes or the client leaves.
async function subscribeJobProgress(req, res) {
  const { jobId } = req.params;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const job = getJob(jobId);
  if (job) {
    res.write(`data: ${JSON.stringify(job)}\n\n`);
  }

  // Job updates are stored in memory, so polling here keeps the controller
  // independent from the job worker while still giving the browser live status.
  const interval = setInterval(() => {
    const currentJob = getJob(jobId);
    if (currentJob) {
      res.write(`data: ${JSON.stringify(currentJob)}\n\n`);
      if (currentJob.status === "ready" || currentJob.status === "error") {
        clearInterval(interval);
        res.end();
      }
    } else {
      clearInterval(interval);
      res.end();
    }
  }, 1000);

  req.on("close", () => {
    clearInterval(interval);
  });
}

// Chat Endpoint
async function chat(req, res) {
  const { videoId } = req.params;
  const { question } = req.body;

  if (!question) {
    return res.status(400).json({ error: "Question is required" });
  }

  try {
    const video = videoStore[videoId];
    const result = await handleChat(videoId, question, video?.summary);
    return res.json(result);
  } catch (error) {
    console.error("[chat] Error:", error.message);
    return res
      .status(500)
      .json({ error: "Failed to process your question. Please try again." });
  }
}

// Summary Endpoint
async function getSummary(req, res) {
  const { videoId } = req.params;
  const video = videoStore[videoId];

  if (!video || !video.summary) {
    return res
      .status(404)
      .json({ error: "Summary not found. The video may still be processing." });
  }

  return res.json(video.summary);
}

// Quiz Endpoint
async function getQuiz(req, res) {
  const { videoId } = req.params;
  const video = videoStore[videoId];

  if (!video || !video.quiz) {
    return res
      .status(404)
      .json({ error: "Quiz not found. The video may still be processing." });
  }

  return res.json(video.quiz);
}

module.exports = {
  startVideoProcessing,
  getJobStatus,
  subscribeJobProgress,
  chat,
  getSummary,
  getQuiz,
};
