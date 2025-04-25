const sdk = require("microsoft-cognitiveservices-speech-sdk");
const fs = require("fs"); // Optional: Used only if you want to write audio files
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static");
const { Readable } = require("stream");

ffmpeg.setFfmpegPath(ffmpegPath);
require("dotenv").config();

// Convert WebM buffer to WAV buffer
async function webmToWav(webmBuffer) {
  return new Promise((resolve, reject) => {
    const inputStream = new Readable();
    inputStream.push(webmBuffer);
    inputStream.push(null);

    const chunks = [];

    ffmpeg()
      .input(inputStream)
      .inputFormat("webm")
      .outputFormat("wav")
      .audioCodec("pcm_s16le")
      .audioChannels(1)
      .audioFrequency(16000)
      .on("error", (err) => reject(err))
      .on("end", () => resolve(Buffer.concat(chunks)))
      .pipe()
      .on("data", (chunk) => chunks.push(chunk));
  });
}

// Transcribe audio using Azure Speech SDK
async function recognizeSpeechFromAudio(wavBuffer) {
  const speechConfig = sdk.SpeechConfig.fromSubscription(
    process.env.AZURE_SPEECH_KEY,
    process.env.AZURE_SPEECH_REGION
  );
  speechConfig.speechRecognitionLanguage = "en-US";

  const pushStream = sdk.AudioInputStream.createPushStream();
  pushStream.write(wavBuffer);
  pushStream.close();

  const audioConfig = sdk.AudioConfig.fromStreamInput(pushStream);
  const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);

  return new Promise((resolve, reject) => {
    recognizer.recognizeOnceAsync((result) => {
      if (result.reason === sdk.ResultReason.RecognizedSpeech) {
        console.log("🎤 Speech recognition result:", result.text);
        resolve(result.text);
      } else {
        console.error("❌ Recognition failed. Reason:", result.reason);
        reject(new Error("Speech Recognition failed"));
      }
    });
  });
}

// Main function to handle full pipeline
async function transcribeAudio(webmAudioBuffer) {
  try {
    console.log("⚙️ Converting WebM to WAV...");
    const wavAudioBuffer = await webmToWav(webmAudioBuffer);
    console.log("✅ Conversion successful. Sending to Azure Speech...");
    return await recognizeSpeechFromAudio(wavAudioBuffer);
  } catch (error) {
    console.error("❌ Error in /api/speech route:", error);
    throw error;
  }
}

module.exports = transcribeAudio;
// This function converts a WebM audio buffer to WAV format and then uses the Azure Speech SDK to transcribe the audio. It handles errors during both conversion and recognition, logging them appropriately. The function returns the recognized text or throws an error if any step fails.
// The conversion is done using the fluent-ffmpeg library, and the Azure Speech SDK is used for speech recognition. The function is designed to be used in an Express.js route handler, where it can process audio data received from a client.