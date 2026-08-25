// Using dynamic import because @xenova/transformers is an ES module
// and we are using CommonJS.

let pipeline = null;

async function getPipeline() {
  if (!pipeline) {
    const transformers = await import('@xenova/transformers');
    // Using all-MiniLM-L6-v2, which creates 384-dimensional embeddings
    pipeline = await transformers.pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
      quantized: true, // Use quantized version for faster inference and smaller size
    });
  }
  return pipeline;
}

/**
 * Generates embeddings for an array of texts.
 * @param {Array<string>} texts 
 * @returns {Promise<Array<Array<number>>>}
 */
async function generateEmbeddings(texts) {
  try {
    const extractor = await getPipeline();
    
    // Process texts one by one or in batches
    const embeddings = [];
    for (const text of texts) {
      const output = await extractor(text, { pooling: 'mean', normalize: true });
      // output.data is a Float32Array containing the embedding vector
      embeddings.push(Array.from(output.data));
    }
    
    return embeddings;
  } catch (error) {
    console.error('Error generating embeddings:', error);
    throw error;
  }
}

module.exports = {
  generateEmbeddings
};
