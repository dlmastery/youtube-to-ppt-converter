import axios from 'axios';

const API_BASE_URL = '/api';

/**
 * Create a new conversion job
 */
export async function createConversionJob(youtubeUrl, email) {
  const response = await axios.post(`${API_BASE_URL}/convert`, {
    youtubeUrl,
    email
  });
  return response.data;
}

/**
 * Get job status
 */
export async function getJobStatus(jobId) {
  const response = await axios.get(`${API_BASE_URL}/jobs/${jobId}`);
  return response.data;
}

/**
 * Get download URL for job
 */
export function getDownloadUrl(jobId) {
  return `${API_BASE_URL}/download/${jobId}`;
}

/**
 * Poll job status until completion or failure
 */
export async function pollJobStatus(jobId, onUpdate, intervalMs = 2000) {
  return new Promise((resolve, reject) => {
    const interval = setInterval(async () => {
      try {
        const job = await getJobStatus(jobId);
        onUpdate(job);

        if (job.status === 'completed' || job.status === 'failed') {
          clearInterval(interval);
          resolve(job);
        }
      } catch (error) {
        clearInterval(interval);
        reject(error);
      }
    }, intervalMs);
  });
}
