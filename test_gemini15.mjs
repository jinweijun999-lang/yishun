import OpenAI from 'openai';

const google = new OpenAI({
  apiKey: "AIzaSyCzqYZ1JCCW_VjMD1zs8bFssAI0tEWuYfY",
  baseURL: "https://generativelanguage.googleapis.com/v1beta",
});

try {
  const completion = await google.chat.completions.create({
    model: "gemini-1.5-flash",
    messages: [{ role: "user", content: "Hello" }],
  });
  console.log("API works:", completion.choices[0]?.message?.content?.substring(0, 100));
} catch (e) {
  console.log("API Error:", e.message);
}
