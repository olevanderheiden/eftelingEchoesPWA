import { language } from "./main.js";
export let audio = new Audio();
export let audioPlaying = false;
export let errorAudio = new Audio("./audio/sounds/error.wav");
export let successAudio = new Audio("./audio/sounds/succes.wav");

let previousRide = null;
let previousShow = null;

audio.muted = true;
errorAudio.muted = true;

let titleCard = document.getElementById("titleCard");

// Format the ride name for display
function formatRideName(folderName) {
  let words = folderName.split(/(?=[A-Z])/);
  for (let i = 0; i < words.length; i++) {
    words[i] = words[i][0].toUpperCase() + words[i].substr(1);
  }
  return words.join(" "); // Add a space between words
}

// Function to create a new card
function createCard(folderName, fileName) {
  let rideName = formatRideName(folderName);
  let card = document.createElement("div");
  card.className = "card";
  let imagePath = `./images/icons/${folderName}.png`;
  card.style.backgroundImage = `url(${imagePath})`;
  card.innerHTML = `
    <h2>${rideName}</h2>
    <p>${fileName}</p>
  `;

  if (titleCard) {
    titleCard.appendChild(card);
  } else {
    console.error("titleCard not found");
  }
}

//play audio file defined in the ride object
export async function playAudio(folderName, fileName, isGeolocation) {
  if (
    fileName === previousShow &&
    previousRide === folderName &&
    isGeolocation === true
  ) {
    return;
  } else {
    console.log("Playing audio file:", folderName, fileName);
    if (audioPlaying) {
      audio.pause();
      // Remove existing card
      let existingCard = document.querySelector(".card");
      if (existingCard) {
        existingCard.remove();
      }
      audioPlaying = false;
    }

    let filePath = `./audio/${language}/${folderName}/${fileName}.wav`;
    try {
      const response = await fetch(filePath);
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      console.log("Audio file found:", response);

      // Create a stream from the response body
      const stream = response.body;

      // Create a new response from the stream
      const newResponse = new Response(stream);

      // Get a blob from the new response
      const blob = await newResponse.blob();

      // Create a blob URL and use it as the source for the Audio object
      let blobURL = URL.createObjectURL(blob);
      audio = new Audio(blobURL);
      audio.play();
      previousShow = fileName;
      previousRide = folderName;
      audioPlaying = true;

      // Create a new card and add it to the DOM
      createCard(folderName, fileName);

      // Listen for the 'ended' event on the audio object
      audio.addEventListener("ended", function () {
        // When the audio is done playing, remove the card
        let existingCard = document.querySelector(".card");
        if (existingCard) {
          existingCard.remove();
        }
        audioPlaying = false;
      });
    } catch (error) {
      console.log(
        "There has been a problem with your fetch operation: ",
        error
      );
      errorAudio.play();
    }
  }
}

// Create and manage progress bar
function createProgressBar(totalFiles) {
  let progressBar = document.createElement("progress");
  progressBar.id = "progressBar";
  progressBar.max = totalFiles;
  progressBar.value = 0;
  titleCard.appendChild(progressBar);
  return progressBar;
}

// Update progress bar
function updateProgressBar(progressBar, downloadedFiles) {
  progressBar.value = downloadedFiles;
}

// Remove progress bar
function removeProgressBar(progressBar) {
  progressBar.remove();
}

// Download all audio files
export async function downloadAllAudio(rides) {
  console.log("Downloading all audio files");

  const cache = await caches.open("eftelingEchoesAudio");

  // Calculate total number of files
  let totalFiles = 0;
  for (let ride of rides) {
    totalFiles += ride.coordinates.length;
  }

  // Create and display progress bar
  let progressBar = createProgressBar(totalFiles);

  let downloadedFiles = 0;

  for (let ride of rides) {
    console.log("Downloading audio files for ride:", ride.name);

    for (let coordinate of ride.coordinates) {
      let filePath = `./audio/${language}/${ride.fileName}/${coordinate.name}.wav`;
      let response = await fetch(filePath);
      if (!response.ok) {
        filePath = `./audio/dutch/${ride.fileName}/${coordinate.name}.wav`; // switch to Dutch version
        response = await fetch(filePath);
      }
      if (response.ok) {
        cache.put(filePath, response);
        console.log("Cached audio file:", filePath);
        downloadedFiles++;
        updateProgressBar(progressBar, downloadedFiles);
      } else {
        console.log("Failed to fetch audio file:", filePath);
      }
    }
  }

  // Remove progress bar when done
  removeProgressBar(progressBar);

  if (downloadedFiles === totalFiles) {
    successAudio.play();
  }
}
