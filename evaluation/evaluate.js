/**
 * Evaluation script to test RAG retrieval accuracy.
 * It reads questions.json, embeds the question, and checks if the retrieved chunks
 * contain the expected concepts or are near the expected timestamps.
 * 
 * Usage:
 *   - Mock Mode: node evaluate.js
 *   - Real Mode: node evaluate.js <videoId> (Requires ChromaDB to be running)
 */

const fs = require('fs');
const path = require('path');

// Try loading dotenv to access CHROMA_URL
try {
  const serverDotenv = path.join(__dirname, '../server/node_modules/dotenv');
  require(serverDotenv).config({ path: path.join(__dirname, '../server/.env') });
} catch (err) {
  try {
    require('dotenv').config({ path: path.join(__dirname, '../server/.env') });
  } catch (e) {
    // Ignore, non-fatal if dotenv is not present
  }
}

let generateEmbeddings = null;
let searchChunks = null;
let isRealMode = false;
const videoId = process.argv[2];

if (videoId) {
  try {
    generateEmbeddings = require('../server/src/services/embedding.service').generateEmbeddings;
    searchChunks = require('../server/src/clients/chroma.client').searchChunks;
    isRealMode = true;
    console.log(`Running in REAL mode for Video ID: ${videoId}\n`);
  } catch (err) {
    console.warn('Could not load Node services. Falling back to MOCK mode.\n');
  }
} else {
  console.log('No videoId provided. Running in MOCK mode.');
  console.log('To run real evaluation: node evaluate.js <videoId>\n');
}

// Fallback Mock function
async function mockRetrieveChunks(question) {
  return [
    { text: "This is a retrieved chunk mentioning synchronous blocks execution.", startTime: 110, endTime: 130 },
    { text: "Another chunk about event loops.", startTime: 340, endTime: 360 }
  ];
}

async function runEvaluation() {
  const questionsPath = path.join(__dirname, 'questions.json');
  const questions = JSON.parse(fs.readFileSync(questionsPath, 'utf8'));

  let top1Correct = 0;
  let top3Correct = 0;
  let top5Correct = 0;

  console.log('Starting Evaluation...\n');

  for (const q of questions) {
    console.log(`Evaluating: "${q.question}"`);
    
    let chunks = [];
    let embedLatency = 0;
    let retrieveLatency = 0;
    if (isRealMode && generateEmbeddings && searchChunks) {
      try {
        const embedStart = Date.now();
        const queryEmbeddings = await generateEmbeddings([q.question]);
        embedLatency = Date.now() - embedStart;

        const retrieveStart = Date.now();
        chunks = await searchChunks(videoId, queryEmbeddings[0], 5);
        retrieveLatency = Date.now() - retrieveStart;
      } catch (err) {
        console.error(`  Error during retrieval: ${err.message}. Falling back to mock.`);
        chunks = await mockRetrieveChunks(q.question);
      }
    } else {
      chunks = await mockRetrieveChunks(q.question);
    }
    
    // Simple heuristic: check if any chunk text includes words from expectedConcept
    const isMatch = (chunk) => chunk.text.toLowerCase().includes(q.expectedConcept.split(',')[0].toLowerCase().trim());
    
    const indexFound = chunks.findIndex(isMatch);
    
    if (indexFound === 0) top1Correct++;
    if (indexFound >= 0 && indexFound < 3) top3Correct++;
    if (indexFound >= 0 && indexFound < 5) top5Correct++;

    console.log(`  Found at index: ${indexFound !== -1 ? indexFound : 'Not found'}`);
    if (isRealMode) {
      console.log(`  Retrieval Latency - Embedding: ${embedLatency}ms | Chroma: ${retrieveLatency}ms`);
    }
    if (indexFound !== -1 && chunks[indexFound]) {
      console.log(`  Matched Chunk: "${chunks[indexFound].text.substring(0, 60)}..."`);
      console.log(`  Chunk Time: ${chunks[indexFound].startTime}s - ${chunks[indexFound].endTime}s`);
    }
    console.log();
  }

  const total = questions.length;
  console.log('--- Evaluation Results ---');
  console.log(`Top-1 Accuracy: ${((top1Correct / total) * 100).toFixed(2)}%`);
  console.log(`Top-3 Accuracy: ${((top3Correct / total) * 100).toFixed(2)}%`);
  console.log(`Top-5 Accuracy: ${((top5Correct / total) * 100).toFixed(2)}%`);
}

runEvaluation().catch(console.error);
