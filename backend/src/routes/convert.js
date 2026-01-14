import express from 'express';
import { createJob, getJob } from '../utils/jobQueue.js';
import { validateYouTubeUrl } from '../utils/validator.js';
import path from 'path';
import fs from 'fs';

const router = express.Router();

/**
 * POST /api/convert
 * Create a new conversion job
 */
router.post('/convert', (req, res) => {
  try {
    const { youtubeUrl, email } = req.body;

    // Validate input
    if (!youtubeUrl || !email) {
      return res.status(400).json({ error: 'youtubeUrl and email are required' });
    }

    if (!validateYouTubeUrl(youtubeUrl)) {
      return res.status(400).json({ error: 'Invalid YouTube URL' });
    }

    // Create job
    const job = createJob(youtubeUrl, email);

    res.json({
      jobId: job.jobId,
      status: job.status
    });
  } catch (error) {
    console.error('Error creating job:', error);
    res.status(500).json({ error: 'Failed to create job' });
  }
});

/**
 * GET /api/jobs/:jobId
 * Get job status
 */
router.get('/jobs/:jobId', (req, res) => {
  try {
    const { jobId } = req.params;
    const job = getJob(jobId);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json({
      jobId: job.jobId,
      status: job.status,
      progress: job.progress,
      error: job.error,
      downloadUrl: job.downloadUrl
    });
  } catch (error) {
    console.error('Error getting job:', error);
    res.status(500).json({ error: 'Failed to get job status' });
  }
});

/**
 * GET /api/download/:jobId
 * Download the generated PowerPoint
 */
router.get('/download/:jobId', (req, res) => {
  try {
    const { jobId } = req.params;
    const job = getJob(jobId);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (job.status !== 'completed') {
      return res.status(400).json({ error: 'Job not completed yet' });
    }

    const tempDir = process.env.TEMP_DIR || './tmp';
    const filePath = path.join(tempDir, `job-${jobId}`, 'output.pptx');

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.download(filePath, `youtube-slides-${jobId}.pptx`, (err) => {
      if (err) {
        console.error('Download error:', err);
        res.status(500).json({ error: 'Failed to download file' });
      }
    });
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({ error: 'Failed to download file' });
  }
});

export default router;
