const { v4: uuidv4 } = require('uuid');

/**
 * Splits a transcript into semantically useful chunks while preserving timestamps.
 * @param {Array} segments Array of { text, start, end }
 * @param {number} maxChars Approximate max characters per chunk
 * @param {number} overlapChars Approximate overlap
 */
function chunkTranscript(segments, maxChars = 600, overlapChars = 100) {
  const chunks = [];
  
  if (!segments || segments.length === 0) return chunks;

  let currentChunkText = "";
  let currentStart = segments[0].start;
  let currentEnd = segments[0].end;
  let currentSegmentIndexes = [];

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    
    currentChunkText += seg.text + " ";
    currentEnd = seg.end;
    currentSegmentIndexes.push(i);

    if (currentChunkText.length >= maxChars) {
      chunks.push({
        chunkId: uuidv4(),
        text: currentChunkText.trim(),
        startTime: currentStart,
        endTime: currentEnd,
        segmentIndexes: [...currentSegmentIndexes]
      });

      // Handle overlap (very simplified for this example)
      // In a real app we'd backtrack to find a good sentence boundary.
      currentChunkText = "";
      currentStart = seg.end;
      currentSegmentIndexes = [];
      
      // Let's just carry over the last segment for overlap
      currentChunkText = seg.text + " ";
      currentStart = seg.start;
      currentSegmentIndexes.push(i);
    }
  }

  if (currentChunkText.trim().length > 0) {
    chunks.push({
      chunkId: uuidv4(),
      text: currentChunkText.trim(),
      startTime: currentStart,
      endTime: currentEnd,
      segmentIndexes: currentSegmentIndexes
    });
  }

  return chunks;
}

module.exports = {
  chunkTranscript
};
