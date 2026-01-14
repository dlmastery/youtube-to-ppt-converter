# Quick Start Guide

## Prerequisites Check

1. **Node.js 18+**
   ```bash
   node --version
   ```

2. **ffmpeg installed**
   ```bash
   ffmpeg -version
   ```

   If not installed:
   - Windows: `choco install ffmpeg`
   - macOS: `brew install ffmpeg`
   - Linux: `sudo apt install ffmpeg`

3. **Gemini API Key**
   - Get one at: https://makersuite.google.com/app/apikey

## Installation

1. **Install Backend Dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Install Frontend Dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

3. **Configure Environment**
   ```bash
   cd ../backend
   cp .env.example .env
   ```

   Edit `.env` and add your Gemini API key:
   ```
   GEMINI_API_KEY=your-actual-api-key-here
   ```

## Running the App

### Option 1: Two Terminals (Recommended for Development)

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Option 2: Using Concurrently (Single Terminal)

From root directory:
```bash
npm install
npm run dev
```

## Access the App

Open http://localhost:3000 in your browser

## Test It Out

Try with a presentation video, for example:
- Any YouTube video with visible slides
- TED talks with presentation slides
- Conference presentations
- Tutorial videos with slide decks

## Troubleshooting

**"Cannot find module '@google/generative-ai'"**
- Run `cd backend && npm install`

**"ffmpeg not found"**
- Make sure ffmpeg is in your PATH
- Restart terminal after installing

**"Invalid API key"**
- Check your `.env` file has the correct key
- Key should start with your Gemini API key format

**"Video download failed"**
- Some videos are restricted by YouTube
- Try a different video
- Check internet connection

## What's Next?

1. Enter a YouTube URL
2. Provide your email
3. Click "Convert to PowerPoint"
4. Wait for processing (progress bar will show)
5. Download your PowerPoint file!

Enjoy! 🎉
