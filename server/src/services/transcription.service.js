/**
 * Fetches a YouTube transcript through TranscriptAPI.
 * @returns {Promise<Array>} Array of segments: { text, start, end }
 */
async function fetchTranscript(youtubeUrl) {
  if (!process.env.TRANSCRIPT_API_KEY) {
    throw new Error("TRANSCRIPT_API_KEY is not configured.");
  }

  try {
    const response = await fetch(
      `https://transcriptapi.com/api/v2/youtube/transcript?video_url=${encodeURIComponent(youtubeUrl)}&send_metadata=true`,
      {
        headers: {
          Authorization: `Bearer ${process.env.TRANSCRIPT_API_KEY}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error(`TranscriptAPI returned ${response.status}`);
    }

    const data = await response.json();
    const segments = (
      data.transcript ||
      data.content ||
      data.segments ||
      []
    ).map((item) => ({
      text: item.text,
      start: Number(item.start ?? item.offset ?? 0),
      end: Number(
        item.end ?? (item.start ?? item.offset ?? 0) + (item.duration ?? 0),
      ),
    }));

    if (segments.length === 0) {
      throw new Error("TranscriptAPI returned no transcript segments.");
    }

    return segments;
  } catch (error) {
    console.error("Error fetching transcript:", error.message);
    throw new Error(
      "Could not fetch transcript for this video. Make sure it has captions available.",
    );
  }
}

module.exports = {
  fetchTranscript,
};
