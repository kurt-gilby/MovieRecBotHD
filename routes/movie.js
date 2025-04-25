const express = require('express');
const router = express.Router();
const getGPTResponse = require('../utils/gpt');
const getRecommendations = require('../utils/tmdb');
const recognizeSpeechFromAudio = require("../utils/speech");

router.post('/chat', async (req, res) => {
    const {userMessage} = req.body;
    console.log("Received:", userMessage);
    try {
        const gptReply = await getGPTResponse(userMessage);
        console.log("GPT Reply:", gptReply);
        const movieSuggestions = await getRecommendations(gptReply);
        console.log("TMDb Results:", movieSuggestions);
        res.json({gptReply, movieSuggestions});
    } 
    catch (err){
        console.error("Error in /chat route:", err.response?.data || err.message || err);
        res.status(500).send('Error processing chat')
    }
    });
    
router.post('/speech', async (req, res) => {
    try {
        const audioBuffer = req.body.audio; // We'll receive base64-encoded audio blob
        const audioBytes = Buffer.from(audioBuffer, 'base64');
    
        const recognizedText = await recognizeSpeechFromAudio(audioBytes);
    
        res.json({ text: recognizedText });
    } catch (error) {
        console.error("❌ Error in /speech route:", error.message);
        res.status(500).send('Error processing speech');
    }
    });

    module.exports = router;
// This code defines a route for handling chat messages. It uses the OpenAI GPT model to generate a response based on the user's message and then fetches movie recommendations based on that response. 
// The results are sent back to the client in JSON format. If any errors occur during the process, an error message is returned with a 500 status code.
