import OpenAI from 'openai';

const apiKey = process.env.ZHIPU_API_KEY;
if (!apiKey) {
  throw new Error('ZHIPU_API_KEY is required to run this smoke test.');
}

const zhipu = new OpenAI({
  apiKey,
  baseURL: 'https://open.bigmodel.cn/api/paas/v4',
});

try {
  const completion = await zhipu.chat.completions.create({
    model: 'glm-4',
    messages: [{ role: 'user', content: 'Hello' }],
  });
  console.log('API works:', completion.choices[0]?.message?.content?.substring(0, 100));
} catch (e) {
  console.log('API Error:', e.message);
}
