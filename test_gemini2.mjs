import OpenAI from 'openai';

const google = new OpenAI({
  apiKey: "AIzaSyCzqYZ1JCCW_VjMD1zs8bFssAI0tEWuYfY",
  baseURL: "https://generativelanguage.googleapis.com/v1",
});

const models = ["gemini-2.0-flash-exp", "gemini-1.5-flash-002", "gemini-1.5-flash"];

async function test() {
  for (const model of models) {
    try {
      const completion = await google.chat.completions.create({
        model: model,
        messages: [{ role: "user", content: "Hi" }],
      });
      console.log(`${model}: SUCCESS`);
      break;
    } catch (e) {
      console.log(`${model}: ${e.message}`);
    }
  }
}
test();
