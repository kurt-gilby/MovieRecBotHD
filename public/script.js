const micButton = document.getElementById("micBtn");
const userMessageInput = document.getElementById("userMessage");
const chatForm = document.getElementById("chat-form");
const playbackBtn = document.getElementById("playbackBtn");
const audioPlayer = document.getElementById("audioPlayer");
const gptResponse = document.getElementById("gpt-response");
const imageInput = document.getElementById('imageInput');
const imageForm = document.getElementById('image-form');


let capturedAudioBlob = null;

// ✅ Amplify audio function
async function amplifyAudio(blob, gainFactor = 2.0) {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const arrayBuffer = await blob.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

  const boostedBuffer = audioContext.createBuffer(
    audioBuffer.numberOfChannels,
    audioBuffer.length,
    audioBuffer.sampleRate
  );

  for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
    const input = audioBuffer.getChannelData(channel);
    const output = boostedBuffer.getChannelData(channel);
    for (let i = 0; i < input.length; i++) {
      output[i] = Math.max(-1, Math.min(1, input[i] * gainFactor));
    }
  }

  const destination = audioContext.createMediaStreamDestination();
  const source = audioContext.createBufferSource();
  source.buffer = boostedBuffer;
  source.connect(destination);
  source.start();

  const mediaRecorder = new MediaRecorder(destination.stream);
  const chunks = [];

  return new Promise((resolve) => {
    mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
    mediaRecorder.onstop = () => {
      const boostedBlob = new Blob(chunks, { type: 'audio/webm' });
      resolve(boostedBlob);
    };
    mediaRecorder.start();
    setTimeout(() => {
      mediaRecorder.stop();
      source.stop();
    }, boostedBuffer.duration * 1000);
  });
}

// ✅ Chat form submit (text or voice)
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  gptResponse.textContent = "🤔 Thinking...";
  gptResponse.style.display = "block";
  document.getElementById("movie-list").innerHTML = "";

  try {
    const message = userMessageInput.value;
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userMessage: message }),
    });

    const data = await response.json();
    gptResponse.innerHTML = `<strong>🎬 You asked:</strong> ${message}<br><strong>🤖 GPT4.1 suggests(Content sourced from TMDb):</strong>`;
    userMessageInput.value = ""; // Clear input

    data.movieSuggestions.forEach((movie) => {
      const card = document.createElement("div");
      card.className = "movie";
      const posterPath = movie.poster_path
        ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
        : "https://via.placeholder.com/300x450?text=No+Image";
    
        const genreMap = {
            28: "Action",
            12: "Adventure",
            16: "Animation",
            35: "Comedy",
            80: "Crime",
            99: "Documentary",
            18: "Drama",
            10751: "Family",
            14: "Fantasy",
            36: "History",
            27: "Horror",
            10402: "Music",
            9648: "Mystery",
            10749: "Romance",
            878: "Science Fiction",
            10770: "TV Movie",
            53: "Thriller",
            10752: "War",
            37: "Western"
          };
          
          const genreNames = movie.genre_ids
          ? movie.genre_ids.map(id => genreMap[id] || id).join(", ")
          : "N/A";
          
          card.innerHTML = `
          <img src="${posterPath}" alt="${movie.title}" />
          <h3>${movie.title}</h3>
          <p><strong>Overview:</strong> ${movie.overview || "No description available."}</p>
          <p><strong>Release Date:</strong> ${movie.release_date || "Unknown"}</p>
          <p><strong>Popularity:</strong> 🔥 ${movie.popularity?.toFixed(1) || "N/A"}</p>
          <p><strong>Original Language:</strong> 🎥 ${movie.original_language?.toUpperCase() || "N/A"}</p>
          <p><strong>Average Rating:</strong> ⭐ ${movie.vote_average?.toFixed(1) || "N/A"}</p>
          <p><strong>Vote Count:</strong> 🧮 ${movie.vote_count || "N/A"}</p>
          <p><strong>Genres:</strong> 🎬 ${genreNames}</p>
        `;
      document.getElementById("movie-list").appendChild(card);
    });

  } catch (err) {
    gptResponse.textContent = "❌ Error: " + err.message;
    console.error(err);
  }
});

// ✅ Mic recording & auto-submit
micButton.addEventListener("click", async () => {
  gptResponse.textContent = "🎤 Listening...";
  gptResponse.style.display = "block";
  micButton.classList.add("recording");

  if (!navigator.mediaDevices || !window.MediaRecorder) {
    alert("🎤 Your browser doesn't support audio recording!");
    micButton.classList.remove("recording");
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    const audioChunks = [];

    recorder.ondataavailable = (event) => {
      audioChunks.push(event.data);
    };

    recorder.onstop = async () => {
      micButton.classList.remove("recording");
      gptResponse.textContent = "🤔 Thinking...";

      const originalBlob = new Blob(audioChunks, { type: 'audio/webm' });
      capturedAudioBlob = await amplifyAudio(originalBlob);

      // 🔕 Hide playback & download
      audioPlayer.style.display = "none";
      playbackBtn.style.display = "none";

      const formData = new FormData();
      formData.append("audio", capturedAudioBlob, "recording.webm");

      try {
        const response = await fetch("/api/speech", {
          method: "POST",
          body: formData
        });

        const data = await response.json();

        if (data.text) {
          userMessageInput.value = data.text;
          chatForm.dispatchEvent(new Event('submit'));
        } else {
          gptResponse.textContent = "❌ Could not recognize any speech.";
        }

      } catch (err) {
        console.error("❌ Speech error:", err.message);
        gptResponse.textContent = "❌ Speech processing failed.";
      }
    };

    recorder.start();
    console.log("🎤 Recording...");
    setTimeout(() => {
      recorder.stop();
      console.log("🛑 Recording stopped.");
    }, 5000);

  } catch (err) {
    micButton.classList.remove("recording");
    console.error("❌ Error during mic access:", err.message);
  }
});

// ⏯️ Playback removed
playbackBtn.addEventListener("click", () => {
  if (capturedAudioBlob) {
    audioPlayer.play();
  }
});

imageInput.addEventListener('change', async () => {
  console.log("📸 Entered ImageForm Change");
  if (!imageInput.files || imageInput.files.length === 0) {
    alert("Please select an image.");
    return;
  }

  const file = imageInput.files[0];
  const formData = new FormData();
  formData.append('image', file);

  gptResponse.textContent = "📸 Scanning image...";
  gptResponse.style.display = "block";
  document.getElementById("movie-list").innerHTML = "";

  try {
    const ocrResponse = await fetch('/api/ocr', {
      method: 'POST',
      body: formData
    });

    const ocrData = await ocrResponse.json();
    console.log("📸 OCR Full Response:", ocrData);

    if (ocrData && ocrData.movieSuggestions && ocrData.movieSuggestions.length > 0) {
      console.log("🖼️ OCR Extracted and Cleaned:", ocrData.gptReply);

      gptResponse.innerHTML = `<strong>📸 Poster Scan Result:</strong><br><strong>🤖 GPT4.1 suggests(Content sourced from TMDb):</strong>`;

      ocrData.movieSuggestions.forEach((movie) => {
        const card = document.createElement("div");
        card.className = "movie";

        const posterPath = movie.poster_path
          ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
          : "https://via.placeholder.com/300x450?text=No+Image";

        const genreMap = {
          28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy", 80: "Crime",
          99: "Documentary", 18: "Drama", 10751: "Family", 14: "Fantasy", 36: "History",
          27: "Horror", 10402: "Music", 9648: "Mystery", 10749: "Romance",
          878: "Science Fiction", 10770: "TV Movie", 53: "Thriller",
          10752: "War", 37: "Western"
        };

        const genreNames = movie.genre_ids
          ? movie.genre_ids.map(id => genreMap[id] || id).join(", ")
          : "N/A";

        card.innerHTML = `
          <img src="${posterPath}" alt="${movie.title}" />
          <h3>${movie.title}</h3>
          <p><strong>Overview:</strong> ${movie.overview || "No description available."}</p>
          <p><strong>Release Date:</strong> ${movie.release_date || "Unknown"}</p>
          <p><strong>Popularity:</strong> 🔥 ${movie.popularity?.toFixed(1) || "N/A"}</p>
          <p><strong>Original Language:</strong> 🎥 ${movie.original_language?.toUpperCase() || "N/A"}</p>
          <p><strong>Average Rating:</strong> ⭐ ${movie.vote_average?.toFixed(1) || "N/A"}</p>
          <p><strong>Vote Count:</strong> 🧮 ${movie.vote_count || "N/A"}</p>
          <p><strong>Genres:</strong> 🎬 ${genreNames}</p>
        `;

        document.getElementById("movie-list").appendChild(card);
      });

    } else {
      gptResponse.textContent = "❌ No movie details detected from poster.";
    }

  } catch (err) {
    console.error("❌ Error in image OCR:", err.message);
    gptResponse.textContent = "❌ Failed to scan image.";
  }
});