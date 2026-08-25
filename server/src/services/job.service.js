const { v4: uuidv4 } = require('uuid');

// In-memory store for jobs
// Structure: { jobId: { status: 'queued', progress: 0, message: '', result: null } }
const jobs = {};

function createJob() {
  const jobId = uuidv4();
  jobs[jobId] = {
    jobId,
    status: 'queued', // queued, downloading, transcribing, chunking, embedding, indexing, ready, error
    progress: 0,
    message: 'Job created',
    result: null,
  };
  return jobId;
}

function updateJobProgress(jobId, status, progress, message) {
  if (jobs[jobId]) {
    jobs[jobId].status = status;
    jobs[jobId].progress = progress;
    jobs[jobId].message = message;
    
    // In the future, emit SSE or WebSocket event here
    console.log(`[JOB ${jobId}] ${status} (${progress}%): ${message}`);
  }
}

function getJob(jobId) {
  return jobs[jobId];
}

function completeJob(jobId, result) {
  if (jobs[jobId]) {
    jobs[jobId].status = 'ready';
    jobs[jobId].progress = 100;
    jobs[jobId].message = 'Processing complete';
    jobs[jobId].result = result;
    console.log(`[JOB ${jobId}] ready`);
  }
}

function failJob(jobId, error) {
  if (jobs[jobId]) {
    jobs[jobId].status = 'error';
    jobs[jobId].message = error.message || 'An error occurred';
    console.error(`[JOB ${jobId}] error: ${jobs[jobId].message}`);
  }
}

module.exports = {
  createJob,
  updateJobProgress,
  getJob,
  completeJob,
  failJob,
};
