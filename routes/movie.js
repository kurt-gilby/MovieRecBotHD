const express = require('express');
const router = express.Router();
const { getGPTResponse, getCleanedOCRText, getRelevantMovieResponse } = require('../utils/gpt'); 
const getRecommendations = require('../utils/tmdb');
const recognizeSpeechFromAudio = require("../utils/speech");
const { extractTextFromImage } = require('../utils/vision'); 
const multer = require('multer');
const upload = multer(); // In-memory storage for file uploads




router.post('/chat', async (req, res) => {
    console.log("💬 Entered /chat route");
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
    console.log("🎤 Entered /speech route");
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
    
    router.post('/ocr', upload.single('image'), async (req, res) => {
        console.log("📸 Entered OCR route");
        try {
          const imageBytes = req.file.buffer;
          const extractedText = await extractTextFromImage(imageBytes);
          console.log("🖼️ OCR Extracted Text:", extractedText);
      
          const gptReply = await getCleanedOCRText(extractedText);
          console.log("🎯 GPT Relevant Movie:", gptReply);
      
          const movieSuggestions = await getRecommendations(gptReply);
          console.log("🎥 TMDb Results:", movieSuggestions);
      
          res.json({ gptReply, movieSuggestions });
      
        } catch (error) {
          console.error("❌ Error in /ocr route:", error.message);
          res.status(500).send('Error processing image OCR');
        }
      });

    module.exports = router;
// This code defines a route for handling chat messages. It uses the OpenAI GPT model to generate a response based on the user's message and then fetches movie recommendations based on that response. 
// The results are sent back to the client in JSON format. If any errors occur during the process, an error message is returned with a 500 status code.
