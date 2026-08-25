const express = require('express');
const router = express.Router();
const videoController = require('../controllers/video.controller');

// Create a new video processing job
router.post('/', videoController.startVideoProcessing);

// Get the status of a specific job (Polling)
router.get('/jobs/:jobId', videoController.getJobStatus);

// Subscribe to job status updates (SSE)
router.get('/jobs/:jobId/progress', videoController.subscribeJobProgress);

// Endpoints for learning features
router.post('/:videoId/chat', videoController.chat);
router.get('/:videoId/summary', videoController.getSummary);
router.get('/:videoId/quiz', videoController.getQuiz);

module.exports = router;
