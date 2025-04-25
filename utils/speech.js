const sdk = require("microsoft-cognitiveservices-speech-sdk");
require("dotenv").config();

async function recognizeSpeechFromAudio(buffer) {
  return new Promise((resolve, reject) => {
    try {
      const speechConfig = sdk.SpeechConfig.fromSubscription(
        process.env.AZURE_SPEECH_KEY,
        process.env.AZURE_SPEECH_REGION
      );
      speechConfig.speechRecognitionLanguage = "en-US";

      const pushStream = sdk.AudioInputStream.createPushStream();
      pushStream.write(buffer);
      pushStream.close();

      const audioConfig = sdk.AudioConfig.fromStreamInput(pushStream);
      const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);

      recognizer.recognizeOnceAsync(result => {
        console.log("🎤 Speech recognition result received:", result);
        if (result.reason === sdk.ResultReason.RecognizedSpeech) {
          console.log("✅ Recognized:", result.text);
          resolve(result.text);
        } else {
          console.error("❌ Recognition failed. Reason:", result.reason);
          console.error("❌ Details:", result.errorDetails || "No additional error details available.");
          reject(new Error(result.errorDetails || "Speech Recognition failed"));
        }
      });
    } catch (error) {
      console.error("❌ Fatal error in recognizeSpeechFromAudio:", error.message);
      reject(error);
    }
  });
}

module.exports = recognizeSpeechFromAudio;
// This code defines a function to recognize speech from an audio buffer using the Microsoft Azure Cognitive Services Speech SDK. It sets up the necessary configurations, processes the audio input, and returns the recognized text. If any errors occur during the process, they are logged to the console and an error is thrown.
// The function also handles cases where the recognition fails and provides detailed error messages.