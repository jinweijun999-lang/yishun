import OpenAI from 'openai';
const zhipu = new OpenAI({
  apiKey: "18f88af2796d4277b2d9c22d72fc77bc.O2fVSErbDoEbnZGx",
  baseURL: "https://open.bigmodel.cn/api/paas/v4",
});

try {
  const completion = await zhipu.chat.completions.create({
    model: "glm-4",
    messages: [{ role: "user", content: "Hello" }],
  });
  console.log("API works:", completion.choices[0]?.message?.content?.substring(0, 100));
} catch (e) {
  console.log("API Error:", e.message);
}
