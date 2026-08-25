const { YoutubeTranscript } = require('youtube-transcript');

/**
 * Fetches the transcript for a YouTube video.
 * @param {string} videoId or video URL
 * @returns {Promise<Array>} Array of segments: { text, start, duration }
 */
async function fetchTranscript(youtubeUrl) {
  try {
    const transcript = await YoutubeTranscript.fetchTranscript(youtubeUrl);
    
    // Format to match our pipeline requirements: { text, start, end }
    const segments = transcript.map(item => ({
      text: item.text,
      start: item.offset / 1000.0, // youtube-transcript returns offset in ms
      end: (item.offset + item.duration) / 1000.0
    }));

    return segments;
  } catch (error) {
    console.error('Error fetching transcript:', error.message);
    throw new Error('Could not fetch transcript for this video. Make sure it has captions available.');
  }
}

module.exports = {
  fetchTranscript
};
