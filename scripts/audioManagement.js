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

//play audio file defined in the ride object
export function playAudio(folderName, fileName) {
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
  fetch(filePath)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.blob();
    })
    .then((blob) => {
      let blobURL = URL.createObjectURL(blob);
      audio = new Audio(blobURL);
      audio.play();
      audioPlaying = true;

      // Create a new card and add it to the DOM
      let rideName = formatRideName(folderName);
      let card = document.createElement("div");
      card.className = "card";
      let imagePath = `./images/icons/${folderName}.png`;
      card.style.backgroundImage = `url(${imagePath})`;
      card.innerHTML = `
        <h2>${rideName}</h2>
        <p>${fileName}</p>
      `;
      document.body.appendChild(card);
    })
    .catch((error) => {
      console.log(
        "There has been a problem with your fetch operation: ",
        error
      );
      errorAudio.play();
    });
}

// Download all audio files for a ride
export function downloadAudio(ride) {
  console.log("Downloading audio files for ride:", ride.name);

  for (let coordinate of ride.coordinates) {
    let filePath = `./audio/${language}/${ride.fileName}/${coordinate.name}.wav`;
    let response = fetch(filePath);
    if (response.status !== 200) {
      filePath = `./audio/dutch/${ride.fileName}/${coordinate.name}.wav`; // switch to Dutch version
    }
    const tempAudio = new Audio(filePath);
    successAudio.play();
  }
}
