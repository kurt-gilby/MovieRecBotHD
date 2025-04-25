const sdk = require("microsoft-cognitiveservices-speech-sdk");
require("dotenv").config();

async function recognizeSpeechFromAudio(audioBuffer) {
  return new Promise((resolve, reject) => {
    let speechConfig;
    try {
      speechConfig = sdk.SpeechConfig.fromSubscription(
        process.env.AZURE_SPEECH_KEY,
        process.env.AZURE_SPEECH_REGION
      );
      speechConfig.speechRecognitionLanguage = "en-US";
    } catch (error) {
      console.error("❌ Failed to create SpeechConfig:", error);
      return reject(new Error("Azure Speech configuration error"));
    }

    const pushStream = sdk.AudioInputStream.createPushStream();
    pushStream.write(audioBuffer);
    pushStream.close();

    const audioConfig = sdk.AudioConfig.fromStreamInput(pushStream);
    const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);

    recognizer.recognizeOnceAsync(
      (result) => {
        console.log("🎤 Speech recognition result received:", result);
        if (result.reason === sdk.ResultReason.RecognizedSpeech) {
          resolve(result.text);
        } else {
          console.error("❌ Recognition failed. Reason:", result.reason);
          reject(new Error("Speech Recognition failed"));
        }
      },
      (err) => {
        console.error("❌ Error during recognition:", err);
        reject(err);
      }
    );
  });
}

module.exports = recognizeSpeechFromAudio;
// This code defines a function to recognize speech from an audio buffer using the Azure Cognitive Services Speech SDK. It creates a speech configuration, sets up an audio input stream, and uses the recognizer to process the audio. If successful, it resolves with the recognized text; otherwise, it rejects with an error message. The function is exported for use in other parts of the application.
// The function also handles errors related to the speech configuration and recognition process, logging them to the console for debugging purposes.