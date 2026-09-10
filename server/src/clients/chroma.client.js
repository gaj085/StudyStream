const { ChromaClient, CloudClient } = require("chromadb");

const client = process.env.CHROMA_API_KEY
  ? new CloudClient({
      apiKey: process.env.CHROMA_API_KEY,
      tenant: process.env.CHROMA_TENANT,
      database: process.env.CHROMA_DATABASE,
    })
  : new ChromaClient({
      path: process.env.CHROMA_URL || "http://localhost:8000",
    });

const COLLECTION_NAME = "studystream_transcripts";

const noopEmbeddingFunction = {
  generate: async (texts) => {
    // We compute and supply embeddings manually from embedding.service,
    // so we don't need Chroma to generate them for us. Returning empty array.
    return [];
  },
};

async function getOrCreateCollection() {
  return await client.getOrCreateCollection({
    name: COLLECTION_NAME,
    embeddingFunction: noopEmbeddingFunction,
  });
}

/**
 * Stores chunks and their embeddings into ChromaDB.
 * Uses upsert() so re-analysis of the same video is idempotent.
 */
async function storeChunks(videoId, chunks, embeddings) {
  try {
    const collection = await getOrCreateCollection();

    const ids = chunks.map((c) => c.chunkId);
    const documents = chunks.map((c) => c.text);
    const metadatas = chunks.map((c, i) => ({
      videoId,
      chunkIndex: i,
      startTime: c.startTime,
      endTime: c.endTime,
    }));

    // upsert() is safe for re-analysis: it inserts or replaces by ID
    await collection.upsert({
      ids,
      embeddings,
      metadatas,
      documents,
    });

    console.log(
      `[ChromaDB] Stored ${chunks.length} chunks for videoId=${videoId}`,
    );
  } catch (error) {
    console.error("[ChromaDB] Error storing chunks:", error);
    throw error;
  }
}

/**
 * Deletes all chunks belonging to a specific videoId.
 * Called before re-indexing to prevent stale chunk accumulation.
 */
async function deleteChunks(videoId) {
  try {
    const collection = await getOrCreateCollection();
    await collection.delete({ where: { videoId } });
    console.log(`[ChromaDB] Deleted existing chunks for videoId=${videoId}`);
  } catch (error) {
    // Non-fatal: if the collection has no matching docs, Chroma may throw.
    // We log and continue - the upsert will handle the rest.
    console.warn(
      `[ChromaDB] deleteChunks warning (may be empty) for videoId=${videoId}:`,
      error.message,
    );
  }
}

/**
 * Searches for the most relevant chunks in ChromaDB, strictly filtered by videoId.
 *
 * ISOLATION GUARANTEE: After the ChromaDB query, we apply a post-query validation
 * layer that discards any result whose metadata.videoId does not exactly match the
 * requested videoId. This defends against ChromaDB v3's known behaviour where a
 * `where` filter matching zero documents can fall back to returning results from
 * the entire collection.
 */
async function searchChunks(videoId, queryEmbedding, topK = 5) {
  try {
    const collection = await getOrCreateCollection();

    const results = await collection.query({
      queryEmbeddings: [queryEmbedding],
      nResults: topK,
      where: { videoId },
    });

    // Guard against empty or malformed results
    if (
      !results ||
      !results.documents ||
      results.documents.length === 0 ||
      results.documents[0].length === 0
    ) {
      return [];
    }

    const formattedResults = [];
    for (let i = 0; i < results.documents[0].length; i++) {
      const meta = results.metadatas[0][i];

      // POST-QUERY ISOLATION GUARD:
      // Discard any chunk whose videoId does not match the requested videoId.
      // This is a defence-in-depth measure against ChromaDB where-filter edge cases.
      if (!meta || meta.videoId !== videoId) {
        console.warn(
          `[ChromaDB] Isolation guard: discarded chunk with videoId=${meta?.videoId} (expected ${videoId})`,
        );
        continue;
      }

      formattedResults.push({
        chunkId: results.ids[0][i],
        text: results.documents[0][i],
        distance: results.distances[0][i], // Lower distance = higher similarity
        metadata: meta,
        startTime: meta.startTime,
        endTime: meta.endTime,
      });
    }

    return formattedResults;
  } catch (error) {
    console.error("[ChromaDB] Error searching chunks:", error);
    throw error;
  }
}

module.exports = {
  storeChunks,
  deleteChunks,
  searchChunks,
};
