import OpenAI from 'openai';

const apiKey = process.env.GOOGLE_API_KEY;
if (!apiKey) {
  throw new Error('GOOGLE_API_KEY is required to run this smoke test.');
}

const google = new OpenAI({
  apiKey,
  baseURL: 'https://generativelanguage.googleapis.com/v1beta',
});

try {
  const completion = await google.chat.completions.create({
    model: 'gemini-1.5-flash',
    messages: [{ role: 'user', content: 'Hello' }],
  });
  console.log('API works:', completion.choices[0]?.message?.content?.substring(0, 100));
} catch (e) {
  console.log('API Error:', e.message);
}
