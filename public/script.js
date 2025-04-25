const micButton = document.getElementById("micBtn");
const userMessageInput = document.getElementById("userMessage");
const chatForm = document.getElementById("chat-form");
const playbackBtn = document.getElementById("playbackBtn");
const audioPlayer = document.getElementById("audioPlayer");
const gptResponse = document.getElementById("gpt-response");

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
    gptResponse.innerHTML = `<strong>🎬 You asked:</strong> ${message}`;
    userMessageInput.value = ""; // Clear input

    data.movieSuggestions.forEach((movie) => {
      const card = document.createElement("div");
      card.className = "movie";
      const posterPath = movie.poster_path
        ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
        : "https://via.placeholder.com/300x450?text=No+Image";

      card.innerHTML = `
        <img src="${posterPath}" alt="${movie.title}" />
        <h3>${movie.title}</h3>
        <p><strong>Release:</strong> ${movie.release_date}</p>
        <p>${movie.overview}</p>
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