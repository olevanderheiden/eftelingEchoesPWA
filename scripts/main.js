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

      // Determine languege spe
      let rideName =
        ride[`name${capitalizeFirstLetter(language)}`] || ride.name;
      let rideDescription =
        ride[`description${capitalizeFirstLetter(language)}`] ||
        ride.description;
      let rideType =
        ride[`rideType${capitalizeFirstLetter(language)}`] || ride.rideType;

      div.innerHTML = `
          <div>ID: ${ride.id}</div>
          <div>Name: ${rideName}</div>
          <div>Ride Type: ${rideType}</div>
          <div>Description: ${rideDescription}</div>
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

// Function to calculate distance between two coordinates
function calculateDistance(userCoords, rideCoords) {
  const R = 6371e3; // metres
  const userLatRadians = (userCoords[0] * Math.PI) / 180; // φ, λ in radians
  const rideLatRadians = (rideCoords[0] * Math.PI) / 180;
  const userLongRadians = (userCoords[1] * Math.PI) / 180;
  const rideLongRadians = (rideCoords[1] * Math.PI) / 180;
  const deltaLatitude = rideLatRadians - userLatRadians;
  const deltaLongitude = rideLongRadians - userLongRadians;

  const a =
    Math.sin(deltaLatitude / 2) * Math.sin(deltaLatitude / 2) +
    Math.cos(userLatRadians) *
      Math.cos(rideLatRadians) *
      Math.sin(deltaLongitude / 2) *
      Math.sin(deltaLongitude / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = R * c; // in metres
  return distance;
  console.log("Distance in meters:", distance);
}

// Function to check if user is within 10 meters of any ride
function isNearAnyRide(userCoords) {
  for (let ride of rides) {
    const rideCoords = ride.coordinates.split(", ").map(Number);
    if (calculateDistance(userCoords, rideCoords) <= 10) {
      playAudio(ride.fileName);
      console.log(`You are near ${ride.name}!`);
      return true;
    }
  }
  return false;
}

// Placeholder for user's last known coordinates
let lastKnownCoords = null;

// Watcher for user's geolocation
navigator.geolocation.watchPosition(
  (position) => {
    const newCoords = [position.coords.latitude, position.coords.longitude];
    if (
      lastKnownCoords === null ||
      calculateDistance(lastKnownCoords, newCoords) >= 10
    ) {
      lastKnownCoords = newCoords;
      if (isNearAnyRide(newCoords)) {
        console.log("You are near a ride!");
      }
    }
  },
  (error) => {
    console.error(error);
  },
  {
    enableHighAccuracy: true,
    maximumAge: 0,
    distanceFilter: 10,
  }
);

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
