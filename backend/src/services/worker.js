import { getNextJob, updateJob, deleteJob, getExpiredJobs } from '../utils/jobQueue.js';
import { analyzeVideo } from './gemini.js';
import { downloadVideo, extractSlides } from './videoProcessor.js';
import { generatePowerPoint } from './pptGenerator.js';
import fs from 'fs';
import path from 'path';

const MAX_CONCURRENT_JOBS = parseInt(process.env.MAX_CONCURRENT_JOBS || '5');
const CLEANUP_INTERVAL = parseInt(process.env.CLEANUP_INTERVAL_MS || '900000'); // 15 minutes
const JOB_EXPIRY = parseInt(process.env.JOB_EXPIRY_MS || '3600000'); // 1 hour
const TEMP_DIR = process.env.TEMP_DIR || './tmp';

let activeJobs = 0;
let isRunning = false;

/**
 * Process a single job
 */
async function processJob(job) {
  const jobDir = path.join(TEMP_DIR, `job-${job.jobId}`);
  const slidesDir = path.join(jobDir, 'slides');
  const videoPath = path.join(jobDir, 'video.mp4');
  const outputPath = path.join(jobDir, 'output.pptx');

  try {
    console.log(`\n=== Processing job ${job.jobId} ===`);
    console.log(`YouTube URL: ${job.youtubeUrl}`);

    // Create job directory
    fs.mkdirSync(jobDir, { recursive: true });
    fs.mkdirSync(slidesDir, { recursive: true });

    // Update status to processing
    updateJob(job.jobId, { status: 'processing', progress: 10 });

    // Step 1: Analyze video with Gemini
    console.log('Step 1: Analyzing video with Gemini...');
    const slides = await analyzeVideo(job.youtubeUrl);
    updateJob(job.jobId, { progress: 30 });

    if (slides.length === 0) {
      console.log('No slides detected, creating empty presentation');
    } else {
      console.log(`Detected ${slides.length} slides`);
    }

    // Step 2: Download video
    console.log('Step 2: Downloading video...');
    await downloadVideo(job.youtubeUrl, videoPath);
    updateJob(job.jobId, { progress: 50 });

    // Step 3: Extract slides
    console.log('Step 3: Extracting slides...');
    const extractedSlides = await extractSlides(videoPath, slides, slidesDir);
    updateJob(job.jobId, { progress: 70 });

    console.log(`Extracted ${extractedSlides.length} slides`);

    // Step 4: Generate PowerPoint
    console.log('Step 4: Generating PowerPoint...');
    await generatePowerPoint(extractedSlides, outputPath);
    updateJob(job.jobId, { progress: 90 });

    // Step 5: Mark as completed
    updateJob(job.jobId, {
      status: 'completed',
      progress: 100,
      downloadUrl: `/api/download/${job.jobId}`
    });

    console.log(`Job ${job.jobId} completed successfully!`);
    console.log(`PowerPoint saved to: ${outputPath}`);

    // Clean up video file to save space (keep slides and PPT)
    if (fs.existsSync(videoPath)) {
      fs.unlinkSync(videoPath);
      console.log('Cleaned up video file');
    }
  } catch (error) {
    console.error(`Job ${job.jobId} failed:`, error);

    updateJob(job.jobId, {
      status: 'failed',
      error: error.message
    });

    // Clean up on failure
    if (fs.existsSync(jobDir)) {
      fs.rmSync(jobDir, { recursive: true, force: true });
    }
  } finally {
    activeJobs--;
  }
}

/**
 * Worker loop - processes jobs from queue
 */
async function workerLoop() {
  if (!isRunning) return;

  try {
    // Check if we can process more jobs
    if (activeJobs >= MAX_CONCURRENT_JOBS) {
      setTimeout(workerLoop, 1000);
      return;
    }

    // Get next job
    const job = getNextJob();

    if (job) {
      activeJobs++;
      processJob(job); // Don't await - process in background
    }
  } catch (error) {
    console.error('Worker error:', error);
  }

  // Continue loop
  setTimeout(workerLoop, 1000);
}

/**
 * Start the background worker
 */
export function startWorker() {
  console.log('Starting background worker...');
  console.log(`Max concurrent jobs: ${MAX_CONCURRENT_JOBS}`);

  // Ensure temp directory exists
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  }

  isRunning = true;
  workerLoop();
}

/**
 * Stop the worker
 */
export function stopWorker() {
  console.log('Stopping worker...');
  isRunning = false;
}

/**
 * Cleanup expired jobs
 */
function cleanupExpiredJobs() {
  try {
    const expiredJobs = getExpiredJobs(JOB_EXPIRY);

    console.log(`Cleanup: Found ${expiredJobs.length} expired jobs`);

    for (const job of expiredJobs) {
      const jobDir = path.join(TEMP_DIR, `job-${job.jobId}`);

      // Delete files
      if (fs.existsSync(jobDir)) {
        fs.rmSync(jobDir, { recursive: true, force: true });
        console.log(`Cleaned up job ${job.jobId}`);
      }

      // Delete from memory
      deleteJob(job.jobId);
    }
  } catch (error) {
    console.error('Cleanup error:', error);
  }
}

/**
 * Start cleanup interval
 */
export function startCleanup() {
  console.log(`Starting cleanup job (every ${CLEANUP_INTERVAL / 1000}s)`);
  console.log(`Job expiry: ${JOB_EXPIRY / 1000}s`);

  setInterval(cleanupExpiredJobs, CLEANUP_INTERVAL);
}
