const axios = require('axios');
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

async function getRelevantMovieResponse(prompt) {
  console.log("🎯 Calling GPT for OCR context with prompt:", prompt);

  try {
      const result = await client.chat.completions.create({
          messages: [
            { role: "system", content: 'You are a precise movie matching assistant. From the given extracted text from a poster, identify the single most relevant movie name and year. Only respond with one movie in the format: "Movie Title":Year. If multiple possibilities, choose the most famous or likely match.' },
            { role: "user", content: prompt }
          ],
          max_tokens: 150,
          temperature: 0.2, // More strict
          top_p: 1,
          frequency_penalty: 0,
          presence_penalty: 0
        });
        console.log("✅ OCR GPT response received");
        return result.choices[0].message.content;        

  } catch (error){
      console.error("❌ GPT OCR request failed:");
      if (error.response?.data) {
          console.error("Server responded with:", error.response.data);
      } else if (error.message) {
          console.error("Error message:", error.message);
      } else {
          console.error(error);
      }

      return "Sorry, I couldn’t process your OCR request right now.";
  }
}

// Add this in gpt.js below your existing functions

async function getCleanedOCRText(ocrRawText) {
  console.log("🧹 Cleaning OCR text with GPT...");
  try {
    const result = await client.chat.completions.create({
      messages: [
        {
          role: "system",
          content: 'You are a movie poster text cleaner. Extract only MOVIE TITLE and YEAR if available (if year is not available lookup the year). Remove all other credits, actor names, companies, and irrelevant words. Return a clean short list in the following format: "Movie Title:Year",Give the movie title in quotes and the year in four digits.Only the match entry (unless the user specifies another number).'
          
        },
        { role: "user", content: ocrRawText }
      ],
      max_tokens: 300,
      temperature: 0.5,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    });

    console.log("✅ GPT OCR cleanup response received.");
    return result.choices[0].message.content;
  } catch (error) {
    console.error("❌ GPT OCR cleanup failed:", error);
    return "Error cleaning OCR text.";
  }
}

module.exports = {
  getGPTResponse,
  getCleanedOCRText,
  getRelevantMovieResponse
};
// This code defines a function to interact with the Azure OpenAI service. It sends a prompt to the GPT model and retrieves a response. The function handles errors gracefully and logs relevant information for debugging.
// The module exports the function for use in other parts of the application. The prompt is designed to elicit a specific format of movie recommendations, and the function is structured to handle both general and OCR-specific requests.