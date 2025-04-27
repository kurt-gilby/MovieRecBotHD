# 🎬 MovieRecBotHD

A multimodal AI-powered Movie Recommendation Assistant.  
Built using **Node.js**, **Azure AI Services**, **OpenAI GPT-4.1**, and **TMDb API**.

---

## ✨ Features

- **Text Input:** Type any question about movies (genres, actors, moods)
- **Voice Input:** Record voice and transcribe using Azure Speech-to-Text
- **Image Input:** Upload movie poster, extract title with Azure Vision OCR, and get recommendations
- **GPT-4.1 Integration:** Smart movie suggestions based on your query
- **TMDb API Integration:** Fetches real-time movie details like posters, ratings, genres, etc.
- **Fully Responsive UI:** Supports both desktop and mobile
- **Dark Mode Themed** 🌙

---

## 🛠️ Tech Stack

- **Frontend:** HTML, CSS, Vanilla JavaScript
- **Backend:** Node.js, Express.js
- **AI Services:** 
  - Azure Speech-to-Text
  - Azure Vision OCR
  - Azure OpenAI GPT-4.1
- **External API:** TMDb (The Movie Database)

---

## 🧩 Folder Structure
/public # Frontend (HTML, CSS, JS)
- index.html
- style.css
- script.js /server
- index.js # Express Server

routes/
- movie.js # API Routes

utils/
- gpt.js # GPT integration
- tmdb.js # TMDb fetch
- speech.js # Speech recognition
- vision.js # OCR processing .env # Azure and API keys

---

## 🚀 How to Run Locally

1. Clone the repo:

```bash
git clone https://github.com/kurt-gilby/MovieRecBotHD.git
cd MovieRecBotHD
```

2. Install dependencies:
```bash
npm install
```

3. Create a .evn file and add:
- AZURE_SPEECH_KEY=YOUR_AZURE_SPEECH_KEY
- AZURE_SPEECH_REGION=YOUR_REGION
- AZURE_OPENAI_KEY=YOUR_AZURE_OPENAI_KEY
- AZURE_OPENAI_ENDPOINT=YOUR_OPENAI_ENDPOINT
- AZURE_OPENAI_DEPLOYMENT=YOUR_DEPLOYMENT_NAME
- TMDB_API_KEY=YOUR_TMDB_API_KEY

4. Start the server:
```bash
node index.js
```

5. Open http://localhost:3000 in browser!

📄 License
This project is for educational and personal use.
Commercial usage requires API providers' license agreements (Azure, TMDb).htt