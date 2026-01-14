# YouTube to PowerPoint Converter - Design Document

**Date:** 2026-01-12
**Status:** Approved for Implementation

## Overview

Web application that converts YouTube presentation videos into PowerPoint decks with AI-generated speaker notes. Users submit a YouTube URL, the system identifies slides using Gemini AI, extracts frames, and generates a downloadable PPT file.

## Technology Stack

- **Frontend:** React (Vite)
- **Backend:** Node.js with Express
- **Video Processing:** ytdl-core, ffmpeg
- **AI:** Google Gemini 2.0 Flash API
- **PowerPoint Generation:** PptxGenJS
- **Job Queue:** In-memory array-based queue
- **Storage:** Local filesystem (/tmp)

## Architecture

### System Components

1. **React Frontend**
   - Simple form: YouTube URL + email input
   - Job status polling UI
   - Download button when complete

2. **Express Backend**
   - REST API for job management
   - In-memory job queue
   - Background worker process
   - File serving for downloads

3. **Processing Pipeline**
   - Video download (ytdl-core)
   - Gemini API integration
   - Frame extraction (ffmpeg)
   - PowerPoint generation (PptxGenJS)

### Data Flow

1. User submits YouTube URL + email via web form
2. Backend validates URL, creates job (UUID), returns job ID
3. Job enters in-memory queue
4. Worker picks up job:
   - Downloads video to `/tmp/job-{id}/video.mp4`
   - Calls Gemini with URL (sample every 3 seconds)
   - Receives: timestamps, coordinates, speaker notes
   - Extracts frames with ffmpeg
   - Crops to slide coordinates
   - Generates PPT with images + notes
   - Saves to `/tmp/job-{id}/output.pptx`
5. Frontend polls job status
6. User downloads completed PPT
7. Cleanup removes files after 1 hour

## API Design

### POST /api/convert
**Request:**
```json
{
  "youtubeUrl": "https://youtube.com/watch?v=...",
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "jobId": "uuid-here",
  "status": "queued"
}
```

### GET /api/jobs/:jobId
**Response:**
```json
{
  "jobId": "uuid",
  "status": "queued | processing | completed | failed",
  "progress": 45,
  "error": "Error message if failed",
  "downloadUrl": "/api/download/uuid"
}
```

### GET /api/download/:jobId
Returns PowerPoint file (binary stream)

### GET /api/health
Health check endpoint

## Processing Pipeline Details

### 1. Video Download
- Use ytdl-core to download YouTube video
- Save to `/tmp/job-{jobId}/video.mp4`
- Retry once on failure

### 2. Gemini Analysis
**Prompt:**
```
Analyze this YouTube video: {url}
Sample frames every 3 seconds.
For each frame containing a presentation slide:
1. Identify the timestamp
2. Provide rectangular coordinates of the slide (x, y, width, height)
3. Generate speaker notes describing the slide content

Return as JSON array with format:
[
  {
    "timestamp": "00:00:15",
    "coordinates": {"x": 100, "y": 50, "width": 1280, "height": 720},
    "speakerNotes": "This slide discusses..."
  }
]
```

### 3. Frame Extraction
For each slide from Gemini:
```bash
ffmpeg -ss {timestamp} -i video.mp4 -vframes 1 -vf "crop={w}:{h}:{x}:{y}" slide-{index}.png
```

### 4. PowerPoint Generation
Using PptxGenJS:
- Create new presentation
- For each slide: add image + speaker notes
- Set slide size to 16:9
- Save to `/tmp/job-{jobId}/output.pptx`

### 5. Cleanup
- Schedule cleanup 1 hour after job completion
- Cleanup job runs every 15 minutes
- Remove `/tmp/job-{jobId}` directory

## Error Handling

| Error | Strategy |
|-------|----------|
| Invalid YouTube URL | Immediate validation failure |
| Video download fails | Retry once, then fail job |
| Gemini API fails | Retry with exponential backoff (3 attempts) |
| No slides detected | Create PPT with warning slide |
| Frame extraction fails | Skip frame, log error, continue |
| PPT generation fails | Fail job with error message |

## Job States

1. **queued** - Job created, waiting for worker
2. **processing** - Worker actively processing
3. **completed** - PPT ready for download
4. **failed** - Error occurred, check error field

## Storage Structure

```
/tmp/
  job-{uuid}/
    video.mp4           # Downloaded video
    slides/
      slide-0.png       # Extracted slide images
      slide-1.png
      ...
    output.pptx         # Generated PowerPoint
```

## Security Considerations

- Validate YouTube URL format
- Sanitize job IDs (UUID only)
- Rate limit API endpoints
- Limit video duration (max 2 hours)
- Limit concurrent jobs (max 5)
- Auto-cleanup prevents disk exhaustion

## Future Enhancements (Not in MVP)

- User accounts and job history
- Email notifications
- Persistent job queue (Redis/Bull)
- Cloud storage (S3) for files
- WebSocket real-time updates
- Batch processing
- Custom slide detection parameters
- Support for other video platforms
- PowerPoint template customization

## Dependencies

**Backend:**
- express
- ytdl-core
- @google/generative-ai
- pptxgenjs
- fluent-ffmpeg
- uuid
- cors
- dotenv

**Frontend:**
- react
- react-dom
- axios
- vite

**System:**
- Node.js 18+
- ffmpeg (system installed)

## Environment Variables

```
GEMINI_API_KEY=your-api-key
PORT=3001
CLEANUP_INTERVAL_MS=900000
JOB_EXPIRY_MS=3600000
MAX_CONCURRENT_JOBS=5
```

## Deployment Notes

- Ensure ffmpeg is installed on server
- Set appropriate temp directory permissions
- Configure reverse proxy for production
- Set up process manager (PM2)
- Monitor disk space usage
- Set up log rotation
