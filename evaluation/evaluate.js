/**
 * Evaluation script to measure RAG retrieval using Recall@K.
 *
 * It reads questions.json, embeds each question, and checks whether
 * the retrieved chunks contain any of the expected concept phrases.
 *
 * Usage:
 *   - Mock Mode:
 *       node evaluate.js
 *
 *   - Real Mode:
 *       node evaluate.js <videoId>
 *       (Requires ChromaDB to be running)
 */

const fs = require("fs");
const path = require("path");

// Try loading dotenv from the server's node_modules so the evaluator
// can access CHROMA_URL and other server environment variables.
try {
  const serverDotenv = path.join(__dirname, "../server/node_modules/dotenv");

  require(serverDotenv).config({
    path: path.join(__dirname, "../server/.env"),
  });
} catch (err) {
  // Fallback in case dotenv is installed in the evaluator's
  // own node_modules.
  try {
    require("dotenv").config({
      path: path.join(__dirname, "../server/.env"),
    });
  } catch (e) {
    // dotenv is optional for mock evaluation.
  }
}

let generateEmbeddings = null;
let searchChunks = null;
let isRealMode = false;

const videoId = process.argv[2];

/*
 * Real mode:
 * Load the same embedding and ChromaDB services used by the
 * actual StudyStream RAG pipeline.
 */
if (videoId) {
  try {
    generateEmbeddings =
      require("../server/src/services/embedding.service").generateEmbeddings;

    searchChunks = require("../server/src/clients/chroma.client").searchChunks;

    isRealMode = true;

    console.log(`Running in REAL mode for Video ID: ${videoId}\n`);
  } catch (err) {
    console.warn("Could not load Node services. Falling back to MOCK mode.\n");
  }
} else {
  console.log("No videoId provided. Running in MOCK mode.");
  console.log("To run real evaluation: node evaluate.js <videoId>\n");
}

/*
 * Fallback mock retrieval used when running the evaluator without
 * a videoId or when the real services cannot be loaded.
 *
 * This allows the evaluation script itself to be tested without
 * requiring ChromaDB or the embedding model.
 */
async function mockRetrieveChunks(question) {
  return [
    {
      text: "This is a retrieved chunk mentioning synchronous blocks execution.",
      startTime: 110,
      endTime: 130,
    },
    {
      text: "Another chunk about event loops.",
      startTime: 340,
      endTime: 360,
    },
  ];
}

async function runEvaluation() {
  const questionsPath = path.join(__dirname, "questions.json");

  const questions = JSON.parse(fs.readFileSync(questionsPath, "utf8"));

  let top1Correct = 0;
  let top3Correct = 0;
  let top5Correct = 0;

  console.log("Starting Evaluation...\n");

  for (const q of questions) {
    console.log(`Evaluating: "${q.question}"`);

    let chunks = [];
    let embedLatency = 0;
    let retrieveLatency = 0;

    /*
     * Real evaluation:
     *
     * 1. Generate the embedding for the question.
     * 2. Search ChromaDB using that embedding.
     * 3. Retrieve the top 5 chunks.
     */
    if (isRealMode && generateEmbeddings && searchChunks) {
      try {
        const embedStart = Date.now();

        const queryEmbeddings = await generateEmbeddings([q.question]);

        embedLatency = Date.now() - embedStart;

        const retrieveStart = Date.now();

        chunks = await searchChunks(videoId, queryEmbeddings[0], 5);

        retrieveLatency = Date.now() - retrieveStart;
      } catch (err) {
        console.error(
          `  Error during retrieval: ${err.message}. Falling back to mock.`,
        );

        chunks = await mockRetrieveChunks(q.question);
      }
    } else {
      chunks = await mockRetrieveChunks(q.question);
    }

    /*
     * Each question can contain multiple acceptable concept phrases.
     *
     * Example:
     *   "expectedConcept": "V8, V8 engine, Google's V8"
     *
     * A retrieved chunk is considered a match if it contains
     * at least one of those phrases.
     */
    const expectedConcepts = q.expectedConcept
      .split(",")
      .map((concept) => concept.trim().toLowerCase())
      .filter(Boolean);

    // Check whether any expected concept phrase appears in a retrieved chunk.
    const isMatch = (chunk) => {
      const text = chunk.text.toLowerCase();

      return expectedConcepts.some((concept) => text.includes(concept));
    };

    /*
     * findIndex() returns the rank of the first matching chunk.
     *
     * - index 0       → Recall@1 hit
     * - index 0-2     → Recall@3 hit
     * - index 0-4     → Recall@5 hit
     * - index -1      → retrieval miss
     */
    const indexFound = chunks.findIndex(isMatch);

    if (indexFound === 0) {
      top1Correct++;
    }

    if (indexFound >= 0 && indexFound < 3) {
      top3Correct++;
    }

    if (indexFound >= 0 && indexFound < 5) {
      top5Correct++;
    }

    console.log(
      `  Found at index: ${indexFound !== -1 ? indexFound : "Not found"}`,
    );

    /*
     * In real mode, report the latency of the two retrieval stages
     * separately so retrieval performance can be analyzed.
     */
    if (isRealMode) {
      console.log(
        `  Retrieval Latency - Embedding: ${embedLatency}ms | Chroma: ${retrieveLatency}ms`,
      );
    }

    /*
     * Display the matched chunk and its timestamp to make it easy
     * to manually verify whether the retrieval result is correct.
     */
    if (indexFound !== -1 && chunks[indexFound]) {
      console.log(
        `  Matched Chunk: "${chunks[indexFound].text.substring(0, 60)}..."`,
      );

      console.log(
        `  Chunk Time: ${chunks[indexFound].startTime}s - ${chunks[indexFound].endTime}s`,
      );
    }

    console.log();
  }

  /*
   * Calculate Recall@K.
   *
   * Recall@K answers:
   * "Did the expected information appear somewhere within
   *  the top K retrieved chunks?"
   */
  const total = questions.length;

  console.log("--- Evaluation Results ---");

  console.log(`Recall@1: ${((top1Correct / total) * 100).toFixed(2)}%`);

  console.log(`Recall@3: ${((top3Correct / total) * 100).toFixed(2)}%`);

  console.log(`Recall@5: ${((top5Correct / total) * 100).toFixed(2)}%`);
}

runEvaluation().catch(console.error);
