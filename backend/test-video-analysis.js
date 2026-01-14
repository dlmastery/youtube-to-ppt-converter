import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function testVideoAnalysis() {
  try {
    console.log('Using API key:', process.env.GEMINI_API_KEY.substring(0, 20) + '...');
    console.log('\n=== Test: Video analysis with YouTube URL ===');

    const model = 'gemini-2.5-flash';

    const prompt = `Sample frames every 3 seconds.
Return a JSON array with format: [{"timestamp": "00:15", "coordinates": {"x": 0, "y": 0, "width": 1920, "height": 1080}, "speakerNotes": "description"}]`;

    // Use fileData structure for YouTube URLs (official API format)
    const contents = [
      {
        fileData: {
          fileUri: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        },
      },
      {
        text: prompt,
      },
    ];

    console.log('Sending request...');
    const result = await genAI.models.generateContent({
      model: model,
      contents: contents,
    });
    const response = result.text;

    console.log('✅ Success! Response length:', response.length);
    console.log('Response preview:', response.substring(0, 200));

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nError details:', error);
  }
}

testVideoAnalysis();
