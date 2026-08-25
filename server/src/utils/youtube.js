const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const TEMP_DIR = path.join(__dirname, '../../temp_audio');

// Ensure temp directory exists
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

/**
 * Downloads audio from a YouTube URL using yt-dlp.
 * Returns the path to the downloaded audio file.
 */
function downloadAudio(youtubeUrl) {
  return new Promise((resolve, reject) => {
    const filename = `${uuidv4()}.m4a`;
    const filepath = path.join(TEMP_DIR, filename);

    // Download best audio format
    const command = `yt-dlp -f "bestaudio[ext=m4a]" -o "${filepath}" "${youtubeUrl}"`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`yt-dlp error: ${stderr}`);
        return reject(error);
      }
      resolve(filepath);
    });
  });
}

function cleanupAudio(filepath) {
  if (fs.existsSync(filepath)) {
    fs.unlinkSync(filepath);
  }
}

module.exports = {
  downloadAudio,
  cleanupAudio,
};
