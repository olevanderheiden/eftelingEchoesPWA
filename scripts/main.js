let audio;
let errorAudio = new Audio("./audio/sounds/error.wav");
let successAudio = new Audio("./audio/sounds/success.wav");
let audioPlaying = false;
let language = "english";

// Register the serviceWorker.js
if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register(
        "/serviceWorker.js",
        { scope: "/" }
      );
      // Call the function to display projects after service worker installation
      fetchRideList();
    } catch (error) {
      console.error("Service Worker registration failed:", error);
      errorAudio.play();
    }
  });
}

// Fetch the ride list data from the JSON file
async function fetchRideList() {
  try {
    const response = await fetch("rideslist.json");
    const rides = await response.json();

    const container = document.getElementById("rides-container");

    rides.forEach((ride) => {
      console.log("Ride data:", ride);
      const div = document.createElement("div");
      div.innerHTML = `
          <div>ID: ${ride.id}</div>
          <div>Name: ${ride.name}</div>
          <div>Ride Type: ${ride.rideType}</div>
          <div>Description: ${ride.description}</div>
          <div>Dub Type: ${
            ride.dubType === 0 ? "preshow only" : "Complete experience"
          }</div>`;
      if (navigator.onLine) {
        const downloadButton = document.createElement("button");
        downloadButton.innerHTML = "Download";
        downloadButton.onclick = () => {
          downloadAudio(ride.fileName);
        };
        div.appendChild(downloadButton);
      }
      const playButton = document.createElement("button");
      playButton.innerHTML = "Play";
      playButton.onclick = () => {
        playAudio(ride.fileName);
      };
      div.appendChild(playButton);
      const img = new Image();
      img.src = `./images/icons/${ride.fileName}.png`;
      img.alt = `${ride.name} Image`;

      img.onload = () => {
        div.appendChild(img);
      };
      img.onerror = () => {
        img.src = "./images/icons/undefined.png";
      };
      container.appendChild(div);
      div.appendChild(img);
    });
    return container;
  } catch (error) {
    console.log("Error fetching ride data:", error);
  }
}

// Play the audio file
function playAudio(fileName) {
  console.log("Playing audio file:", fileName);
  if (audioPlaying) {
    audio.pause();
    audioPlaying = false;
  }
  audio = new Audio(`./audio/${language}/${fileName}.wav`);
  audio.play();
  audioPlaying = true;
}
// Download the audio file
function downloadAudio(fileName) {
  console.log("Downloading audio file:", fileName);
  const tempAudio = new Audio(`./audio/${language}/${fileName}.wav`);
  successAudio.play();
}
