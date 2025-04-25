const axios = require('axios');
require('dotenv').config();

async function getRecommendations(gptReply) {
  const lines = gptReply.split("\n").filter(line => line.trim() !== "");
  console.log("🔍 Parsed GPT lines:", lines);

  const results = [];

  for (const line of lines) {
    // Match: "Movie Title":Year (title may contain colon or special chars)
    const match = line.match(/["“](.+?)["”]\s*:\s*(\d{4})/);

    if (!match) {
      console.warn("⚠️ Invalid line format (no match):", line);
      continue;
    }

    const title = match[1].trim(); // Movie title within quotes
    const year = match[2].trim();  // 4-digit year

    console.log("📽️ Extracted title:", title, "| Year:", year);

    try {
      const response = await axios.get("https://api.themoviedb.org/3/search/movie", {
        params: {
          api_key: process.env.TMDB_API_KEY,
          query: title,
          year: year
        }
      });

      if (response.data.results.length > 0) {
        const movie = response.data.results[0];
        results.push(movie);
      } else {
        console.warn("⚠️ No TMDb results found for:", title, "| Year:", year);
      }

    } catch (error) {
      console.error(`❌ TMDb error for ${title}:`, error.message);
    }
  }

  console.log("🍿 Final TMDb Results:", results);
  return results;
}

module.exports = getRecommendations;
// This code defines a function to fetch movie recommendations based on titles and years extracted from a GPT response. It uses the TMDb API to search for movies and returns the results as an array of movie objects. If any errors occur during the process, they are logged to the console.
// The function also handles cases where the GPT response format is invalid or when no results are found for a given title and year.