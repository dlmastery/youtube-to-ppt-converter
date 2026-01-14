import crypto from 'crypto';

// In-memory job storage
const jobs = new Map();
const queue = [];

/**
 * Create a new job
 */
export function createJob(youtubeUrl, email) {
  const jobId = crypto.randomUUID();

  const job = {
    jobId,
    youtubeUrl,
    email,
    status: 'queued', // queued, processing, completed, failed
    progress: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    error: null,
    downloadUrl: null
  };

  jobs.set(jobId, job);
  queue.push(jobId);

  return job;
}

/**
 * Get job by ID
 */
export function getJob(jobId) {
  return jobs.get(jobId);
}

/**
 * Update job status
 */
export function updateJob(jobId, updates) {
  const job = jobs.get(jobId);
  if (!job) {
    throw new Error(`Job ${jobId} not found`);
  }

  Object.assign(job, updates, { updatedAt: new Date() });
  jobs.set(jobId, job);

  return job;
}

/**
 * Get next job from queue
 */
export function getNextJob() {
  while (queue.length > 0) {
    const jobId = queue.shift();
    const job = jobs.get(jobId);

    if (job && job.status === 'queued') {
      return job;
    }
  }

  return null;
}

/**
 * Delete job
 */
export function deleteJob(jobId) {
  jobs.delete(jobId);
}

/**
 * Get all jobs (for debugging)
 */
export function getAllJobs() {
  return Array.from(jobs.values());
}

/**
 * Get expired jobs
 */
export function getExpiredJobs(expiryMs) {
  const now = new Date();
  const expiredJobs = [];

  for (const job of jobs.values()) {
    if (job.status === 'completed' || job.status === 'failed') {
      const age = now - job.updatedAt;
      if (age > expiryMs) {
        expiredJobs.push(job);
      }
    }
  }

  return expiredJobs;
}
