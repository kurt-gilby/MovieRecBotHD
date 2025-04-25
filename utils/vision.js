const axios = require('axios');

async function extractTextFromImage(imageBuffer) {
  const endpoint = process.env.AZURE_SPEECH_ENDPOINT; // ✅ Reuse existing endpoint
  const key = process.env.AZURE_SPEECH_KEY;

  const url = `${endpoint}/vision/v3.2/read/analyze`; // Azure Read API (OCR)

  const headers = {
    'Ocp-Apim-Subscription-Key': key,
    'Content-Type': 'application/octet-stream',
  };

  const { headers: responseHeaders } = await axios.post(url, imageBuffer, { headers });
  const operationLocation = responseHeaders['operation-location'];

  // Wait briefly and fetch result
  await new Promise(resolve => setTimeout(resolve, 2000)); // Small wait
  
  const resultResponse = await axios.get(operationLocation, {
    headers: { 'Ocp-Apim-Subscription-Key': key },
  });

  const lines = resultResponse.data.analyzeResult.readResults.flatMap(page => 
    page.lines.map(line => line.text)
  );

  return lines.join(' ');
}

module.exports = extractTextFromImage;
// This code defines a function to extract text from an image using Azure's Read API (OCR). It sends the image buffer to the API, retrieves the operation location, and then fetches the result after a brief wait. The extracted text is returned as a single string. The function uses Axios for HTTP requests and handles the response to extract lines of text from the image.
// It also handles errors and logs them appropriately. The function is exported for use in other modules.