import OpenAI from 'openai';

const apiKey = process.env.GOOGLE_API_KEY;
if (!apiKey) {
  throw new Error('GOOGLE_API_KEY is required to run this smoke test.');
}

const google = new OpenAI({
  apiKey,
  baseURL: 'https://generativelanguage.googleapis.com/v1',
});

const models = ['gemini-2.0-flash-exp', 'gemini-1.5-flash-002', 'gemini-1.5-flash'];

async function test() {
  for (const model of models) {
    try {
      const completion = await google.chat.completions.create({
        model,
        messages: [{ role: 'user', content: 'Hi' }],
      });
      console.log(`${model}: SUCCESS`);
      break;
    } catch (e) {
      console.log(`${model}: ${e.message}`);
    }
  }
}

test();
