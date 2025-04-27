const { ComputerVisionClient } = require("@azure/cognitiveservices-computervision");
const { CognitiveServicesCredentials } = require("@azure/ms-rest-azure-js");
require("dotenv").config();

const endpoint = process.env.AZURE_SPEECH_ENDPOINT;
const key = process.env.AZURE_SPEECH_KEY;

// Setup client
const credentials = new CognitiveServicesCredentials(key);
const client = new ComputerVisionClient(credentials, endpoint);

// 🆕 This is your OCR function
async function extractTextFromImage(imageBuffer) {
  const result = await client.readInStream(imageBuffer);
  const operation = result.operationLocation.split('/').slice(-1)[0];

  let readResult;
  while (true) {
    readResult = await client.getReadResult(operation);
    if (readResult.status !== 'running') {
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  if (readResult.status === 'succeeded') {
    const lines = readResult.analyzeResult.readResults.flatMap(page => page.lines.map(line => line.text));
    return lines.join(' ');
  } else {
    throw new Error("Text extraction failed");
  }
}

// ❗ ADD THIS AT THE BOTTOM
module.exports = { extractTextFromImage };
// This function uses the Azure Computer Vision API to extract text from an image. It handles the asynchronous nature of the API call and returns the extracted text as a string. If the extraction fails, it throws an error.
// The function is exported for use in other parts of the application. The endpoint and key are retrieved from environment variables for security reasons.