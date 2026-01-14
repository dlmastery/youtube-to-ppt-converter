import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function testAPIKey() {
  try {
    console.log('Testing API key:', process.env.GEMINI_API_KEY);

    // Test with gemini-2.5-flash
    console.log('\n=== Test: Simple text generation with gemini-2.5-flash ===');
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent('Say hello');
    const response = result.response.text();
    console.log('✅ Success! Response:', response);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testAPIKey();
