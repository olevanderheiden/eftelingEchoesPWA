import { language } from "./main.js";
export let audio = new Audio();

export let audioPlaying = false;
export let errorAudio = new Audio("./audio/sounds/error.wav");
export let successAudio = new Audio("./audio/sounds/succes.wav");

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

  let titleCard = document.getElementById("titleCard");
  if (titleCard) {
    titleCard.appendChild(card);
  } else {
    console.error("titleCard not found");
  }
}

//play audio file defined in the ride object
export async function playAudio(folderName, fileName) {
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
    audioPlaying = true;

    // Create a new card and add it to the DOM
    createCard(folderName, fileName);
  } catch (error) {
    console.log("There has been a problem with your fetch operation: ", error);
    errorAudio.play();
  }
}

// Delete all audio files
export async function deleteAllAudio(rides) {
  console.log("Deleting all audio files");

  const cache = await caches.open("eftelingEchoesAudio");

  // Calculate total number of files
  let totalFiles = 0;
  for (let ride of rides) {
    totalFiles += ride.coordinates.length;
  }

  // Create and display progress bar
  let progressBar = createProgressBar(totalFiles);

  let deletedFiles = 0;

  for (let ride of rides) {
    console.log("Deleting audio files for ride:", ride.name);
    for (let coordinate of ride.coordinates) {
      let filePath = `./audio/${language}/${ride.fileName}/${coordinate.name}.wav`;
      if (await cache.match(filePath)) {
        await cache.delete(filePath);
        deletedFiles++;
        updateProgressBar(progressBar, deletedFiles);
      }
    }
  }

  // Remove progress bar
  removeProgressBar(progressBar);

  console.log("All audio files deleted");
}

// Create and manage progress bar
function createProgressBar(totalFiles) {
  let progressBar = document.createElement("progress");
  progressBar.className;
  progressBar.max = totalFiles;
  progressBar.value = 0;
  document.body.appendChild(progressBar);
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
