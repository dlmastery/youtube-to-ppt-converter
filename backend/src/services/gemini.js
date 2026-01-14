import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Analyze YouTube video with Gemini to identify slides
 */
export async function analyzeVideo(youtubeUrl) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `Sample frames every 3 seconds throughout the video.

For each frame that contains a presentation slide (PowerPoint, Keynote, Google Slides, or similar):
1. Identify the timestamp (in format MM:SS or HH:MM:SS)
2. Provide the rectangular coordinates of the slide area in pixels (x, y, width, height). If the slide occupies the full frame, use the full video dimensions.
3. Generate detailed speaker notes that summarize the content shown on that slide

Return ONLY a valid JSON array with this exact format:
[
  {
    "timestamp": "00:15",
    "coordinates": {
      "x": 0,
      "y": 0,
      "width": 1920,
      "height": 1080
    },
    "speakerNotes": "Detailed description of the slide content..."
  }
]

Important:
- Only include frames that actually contain slides
- Speaker notes should be comprehensive and useful
- Coordinates should be precise
- Return an empty array [] if no slides are detected
- Do NOT include any text outside the JSON array`;

    console.log('Sending request to Gemini...');
    console.log('YouTube URL:', youtubeUrl);

    // For now, just pass URL in the prompt text
    // TODO: Implement proper video file upload if needed
    const fullPrompt = `Analyze this YouTube video: ${youtubeUrl}

${prompt}`;

    const result = await model.generateContent(fullPrompt);

    const response = result.response.text();

    console.log('Gemini response received');
    console.log('Raw response:', response);

    // Parse JSON response
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.warn('No JSON array found in Gemini response');
      return [];
    }

    const slides = JSON.parse(jsonMatch[0]);

    console.log(`Detected ${slides.length} slides`);
    return slides;
  } catch (error) {
    console.error('Gemini API error:', error);
    throw new Error(`Failed to analyze video with Gemini: ${error.message}`);
  }
}

/**
 * Convert timestamp to seconds
 */
export function timestampToSeconds(timestamp) {
  const parts = timestamp.split(':').map(Number);

  if (parts.length === 2) {
    // MM:SS
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 3) {
    // HH:MM:SS
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }

  return 0;
}
