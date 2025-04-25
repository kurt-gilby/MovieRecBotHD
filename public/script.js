// Updated script.js - Speech input + Text input + Mic visual feedback

const micButton = document.getElementById("micBtn");
const userMessageInput = document.getElementById("userMessage");
const chatForm = document.getElementById("chat-form");

// Handle Text Input Submission
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const message = userMessageInput.value;
  document.getElementById("gpt-response").textContent = "🤔 Thinking...";
  document.getElementById("movie-list").innerHTML = "";

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userMessage: message }),
    });

    const data = await response.json();

    document.getElementById("gpt-response").textContent = "GPT Reply:\n" + data.gptReply;
    document.getElementById("gpt-response").style.display = "block"; // Just in case it's hidden

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

// Handle Mic Button + Azure Speech-to-Text + Auto Submit
micButton.addEventListener("click", async () => {
  // Immediately show recording started
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
      document.getElementById("gpt-response").textContent = "🧠 Transcribing...";

      const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
      const arrayBuffer = await audioBlob.arrayBuffer();
      const base64Audio = arrayBufferToBase64(arrayBuffer);

      try {
        const response = await fetch("/api/speech", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ audio: base64Audio }),
        });

        const data = await response.json();

        if (data.text) {
          console.log("🎤 Recognized speech:", data.text);
          userMessageInput.value = data.text;
          // Auto-submit the form
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
      console.log("🛑 Recording stopped after 3 seconds");
    }, 3000); // 3 seconds recording

  } catch (error) {
    micButton.classList.remove("recording");
    console.error("❌ Error during recording:", error.message);
  }
});

// Utility function to convert ArrayBuffer to Base64
function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}
