//This is just added
const micButton = document.getElementById("micBtn");
const userMessageInput = document.getElementById("userMessage");
const chatForm = document.getElementById("chat-form");
const playbackBtn = document.getElementById("playbackBtn");
const audioPlayer = document.getElementById("audioPlayer");

let capturedAudioBlob = null;

// 📢 New function: Amplify audio
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
      output[i] = Math.max(-1, Math.min(1, input[i] * gainFactor)); // Clip safely
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

// ✍️ Text input submit
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  document.getElementById("gpt-response").textContent = "🤔 Thinking...";
  const message = userMessageInput.value;  
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

// 🎤 Mic recording
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
      document.getElementById("gpt-response").textContent = "";
      micButton.classList.remove("recording");

      const originalBlob = new Blob(audioChunks, { type: 'audio/webm' });
      capturedAudioBlob = await amplifyAudio(originalBlob, 2.0); // ✅ Boosted Blob

      // Set up playback
      const audioURL = URL.createObjectURL(capturedAudioBlob);
      audioPlayer.src = audioURL;
      audioPlayer.volume = 1.0;
      audioPlayer.style.display = "block";
      playbackBtn.style.display = "inline-block";

      // ✅ Now create Download Button
        let downloadBtn = document.getElementById("downloadBtn");
        if (!downloadBtn) {
        downloadBtn = document.createElement("button");
        downloadBtn.id = "downloadBtn";
        downloadBtn.textContent = "⬇️ Download Recording";
        downloadBtn.style.marginTop = "10px";
        document.body.appendChild(downloadBtn);
        }


      downloadBtn.addEventListener("click", () => {
        const blobURL = URL.createObjectURL(capturedAudioBlob);
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = blobURL;
        a.download = "recording.webm"; 
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(blobURL);
      });

      // Send amplified audio to Azure
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

// ▶️ Play captured audio
playbackBtn.addEventListener("click", () => {
  if (capturedAudioBlob) {
    audioPlayer.play();
  }
});