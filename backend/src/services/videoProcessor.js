import ytdl from 'ytdl-core';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';
import { timestampToSeconds } from './gemini.js';

/**
 * Download YouTube video
 */
export async function downloadVideo(youtubeUrl, outputPath) {
  return new Promise((resolve, reject) => {
    console.log(`Downloading video from ${youtubeUrl}`);

    const videoStream = ytdl(youtubeUrl, {
      quality: 'highest',
      filter: 'videoandaudio'
    });

    const writeStream = fs.createWriteStream(outputPath);

    videoStream.pipe(writeStream);

    writeStream.on('finish', () => {
      console.log(`Video downloaded to ${outputPath}`);
      resolve(outputPath);
    });

    writeStream.on('error', (error) => {
      console.error('Download error:', error);
      reject(new Error(`Failed to download video: ${error.message}`));
    });

    videoStream.on('error', (error) => {
      console.error('ytdl-core error:', error);
      reject(new Error(`ytdl-core error: ${error.message}`));
    });
  });
}

/**
 * Extract frame at specific timestamp
 */
export async function extractFrame(videoPath, timestamp, outputPath, coordinates = null) {
  return new Promise((resolve, reject) => {
    console.log(`Extracting frame at ${timestamp} to ${outputPath}`);

    const seconds = timestampToSeconds(timestamp);

    let command = ffmpeg(videoPath)
      .seekInput(seconds)
      .frames(1);

    // Apply crop if coordinates provided
    if (coordinates && coordinates.width > 0 && coordinates.height > 0) {
      const cropFilter = `crop=${coordinates.width}:${coordinates.height}:${coordinates.x}:${coordinates.y}`;
      command = command.videoFilters(cropFilter);
    }

    command
      .output(outputPath)
      .on('end', () => {
        console.log(`Frame extracted: ${outputPath}`);
        resolve(outputPath);
      })
      .on('error', (error) => {
        console.error('ffmpeg error:', error);
        reject(new Error(`Failed to extract frame: ${error.message}`));
      })
      .run();
  });
}

/**
 * Extract all slides from video
 */
export async function extractSlides(videoPath, slides, slidesDir) {
  const extractedSlides = [];

  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i];
    const outputPath = path.join(slidesDir, `slide-${i}.png`);

    try {
      await extractFrame(videoPath, slide.timestamp, outputPath, slide.coordinates);
      extractedSlides.push({
        index: i,
        path: outputPath,
        speakerNotes: slide.speakerNotes
      });
    } catch (error) {
      console.error(`Failed to extract slide ${i}:`, error);
      // Continue with other slides
    }
  }

  return extractedSlides;
}
