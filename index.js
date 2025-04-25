const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const cors = require('cors');
const multer = require('multer');
dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static('public'));

const movieRouter = require('./routes/movie');
const recognizeSpeechFromAudio = require('./utils/speech'); // Import the speech recognition function
const upload = multer(); // 🆕 Multer in-memory storage

// 🆕 Setup new /api/speech route
app.post("/api/speech", upload.single('audio'), async (req, res) => {
    try {
      const buffer = req.file.buffer;
      const text = await recognizeSpeechFromAudio(buffer);
      res.json({ text });
    } catch (error) {
      console.error("❌ Error in /api/speech route:", error);
      res.status(500).json({ error: "Speech recognition failed" });
    }
  });

// Existing movie recommendation router
app.use('/api', movieRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));