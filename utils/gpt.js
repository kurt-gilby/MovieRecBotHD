const { AzureOpenAI } = require("openai");
require("dotenv").config();

const client = new AzureOpenAI({
  endpoint: process.env.AZURE_OPENAI_ENDPOINT,
  apiKey: process.env.AZURE_OPENAI_KEY,
  apiVersion: "2025-01-01-preview",
  deployment: process.env.AZURE_OPENAI_DEPLOYMENT
});

async function getGPTResponse(prompt) {
    console.log("▶️ Calling GPT with prompt:", prompt);
    console.log("🔧 Endpoint:", process.env.AZURE_OPENAI_ENDPOINT);
    console.log("📦 Deployment:", process.env.AZURE_OPENAI_DEPLOYMENT);
    console.log("🔐 API Key starts with:", process.env.AZURE_OPENAI_KEY.slice(0, 5));
    try {
        const result = await client.chat.completions.create({
            messages: [
              { role: "system", content: 'You are a helpful movie recommendation assistant.Only respond with a list of movie titles and their release years in the following format: "Movie Title:Year" Give the movie title in quotes and the year in four digits, Return exactly 5 entries (unless the user specifies another number).' },
              { role: "user", content: prompt }
            ],
            max_tokens: 300,
            temperature: 0.9,
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0
          });
          console.log("✅ GPT response received");
          return result.choices[0].message.content;        

    } catch (error){
            console.error("❌ GPT request failed:");
        if (error.response?.data) {
        console.error("Server responded with:", error.response.data);
        } else if (error.message) {
        console.error("Error message:", error.message);
        } else {
        console.error(error);
        }

        return "Sorry, I couldn’t process your request right now.";

    }
}

module.exports = getGPTResponse;