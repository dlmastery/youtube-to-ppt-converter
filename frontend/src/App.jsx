import { useState } from 'react';
import { createConversionJob, pollJobStatus, getDownloadUrl } from './services/api';

function App() {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [email, setEmail] = useState('');
  const [job, setJob] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!youtubeUrl || !email) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setIsProcessing(true);

      // Create job
      const newJob = await createConversionJob(youtubeUrl, email);
      setJob(newJob);

      // Poll for status updates
      await pollJobStatus(newJob.jobId, (updatedJob) => {
        setJob(updatedJob);
      });

      setIsProcessing(false);
    } catch (err) {
      console.error('Error:', err);
      setError(err.response?.data?.error || 'An error occurred. Please try again.');
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setYoutubeUrl('');
    setEmail('');
    setJob(null);
    setError(null);
    setIsProcessing(false);
  };

  const handleDownload = () => {
    if (job && job.status === 'completed') {
      window.location.href = getDownloadUrl(job.jobId);
    }
  };

  return (
    <div className="container">
      <h1>🎥 YouTube to PowerPoint</h1>
      <p className="subtitle">
        Convert YouTube presentations into PowerPoint slides with AI-generated speaker notes
      </p>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="youtubeUrl">YouTube URL</label>
          <input
            id="youtubeUrl"
            type="url"
            placeholder="https://www.youtube.com/watch?v=..."
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            disabled={isProcessing || job}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email Address</label>
          <input
            id="email"
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isProcessing || job}
            required
          />
        </div>

        {!job && (
          <button type="submit" disabled={isProcessing}>
            {isProcessing ? (
              <>
                <span className="spinner"></span>
                Converting...
              </>
            ) : (
              'Convert to PowerPoint'
            )}
          </button>
        )}
      </form>

      {error && (
        <div className="error-message">{error}</div>
      )}

      {job && (
        <div className="status-box">
          <div className="status-header">
            <span className="status-text">Job Status</span>
            <span className={`status-badge ${job.status}`}>
              {job.status}
            </span>
          </div>

          {(job.status === 'queued' || job.status === 'processing') && (
            <>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${job.progress || 0}%` }}
                ></div>
              </div>
              <div className="progress-text">
                {job.progress || 0}% complete
              </div>
            </>
          )}

          {job.status === 'completed' && (
            <>
              <p style={{ color: '#28a745', marginBottom: '15px', fontWeight: 500 }}>
                ✅ Your PowerPoint is ready!
              </p>
              <button className="download-button" onClick={handleDownload}>
                Download PowerPoint
              </button>
            </>
          )}

          {job.status === 'failed' && job.error && (
            <div className="error-message">
              {job.error}
            </div>
          )}

          <button className="reset-button" onClick={handleReset}>
            Convert Another Video
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
