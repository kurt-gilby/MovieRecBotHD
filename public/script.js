const micButton = document.getElementById("micBtn");
const userMessageInput = document.getElementById("userMessage");
const chatForm = document.getElementById("chat-form");
const playbackBtn = document.getElementById("playbackBtn");
const audioPlayer = document.getElementById("audioPlayer");

let capturedAudioBlob = null;

// Text input submit
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const message = userMessageInput.value;
  document.getElementById("gpt-response").textContent = "🤔 Thinking...";
  document.getElementById("movie-list").innerHTML = "";

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userMessage: message }),
    });

    const data = await response.json();

    document.getElementById("gpt-response").textContent = "GPT Reply:\n" + data.gptReply;
    document.getElementById("gpt-response").style.display = "block";

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
    document.getElementById("gpt-response").textContent = "❌ Error: " + err.message;
    console.error(err);
  }
});

// 🆕 Mic recording
micButton.addEventListener("click", async () => {
  document.getElementById("gpt-response").textContent = "🎤 Listening...";
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
      capturedAudioBlob = new Blob(audioChunks, { type: 'audio/webm' });

      // Set up playback
      const audioURL = URL.createObjectURL(capturedAudioBlob);
      audioPlayer.src = audioURL;
      audioPlayer.style.display = "block";
      playbackBtn.style.display = "inline-block";

      // Prepare FormData to send
      const formData = new FormData();
      formData.append("audio", capturedAudioBlob, "recording.webm");

      try {
        const response = await fetch("/api/speech", {
          method: "POST",
          body: formData
        });

        const data = await response.json();

        if (data.text) {
          console.log("🎤 Recognized speech:", data.text);
          userMessageInput.value = data.text;
          chatForm.dispatchEvent(new Event('submit'));
        } else {
          alert("❌ Could not recognize any speech. Please try again.");
        }

      } catch (err) {
        console.error("❌ Error sending audio for transcription:", err.message);
      }
    };

    recorder.start();
    console.log("🎤 Recording started...");
    setTimeout(() => {
      recorder.stop();
      console.log("🛑 Recording stopped after 5 seconds");
    }, 5000); // 5 seconds max

  } catch (error) {
    micButton.classList.remove("recording");
    console.error("❌ Error during recording:", error.message);
  }
});

// Play captured audio
playbackBtn.addEventListener("click", () => {
  if (capturedAudioBlob) {
    audioPlayer.play();
  }
});
