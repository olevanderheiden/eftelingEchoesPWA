import { downloadAudio, playAudio, errorAudio } from "./audioManagement.js";
import {
  calculateDistance,
  isNearAnyRide,
  lastKnownCoords,
  setLastKnownCoords,
} from "./locationManagement.js";

let rides = [];
let deviceLanguage = navigator.language.split("-")[0].toLowerCase();
export let language = ["english", "french", "german"].includes(deviceLanguage)
  ? deviceLanguage
  : "english";

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
    rides = await response.json();

    const container = document.getElementById("rides-container");

    rides.forEach((ride) => {
      console.log("Ride data:", ride);
      const div = document.createElement("div");

      let rideName =
        ride[`name${language.charAt(0).toUpperCase() + language.slice(1)}`] ||
        ride.name;

      let rideDescription =
        ride[
          `description${language.charAt(0).toUpperCase() + language.slice(1)}`
        ] || ride.description;
      let rideType =
        ride[
          `rideType${language.charAt(0).toUpperCase() + language.slice(1)}`
        ] || ride.rideType;

      const img = new Image();
      img.src = `./images/icons/${ride.fileName}.png`;
      img.alt = `${ride.name} Image`;

      img.onload = () => {
        div.appendChild(img);
      };
      img.onerror = () => {
        img.src = "./images/icons/undefined.png";
      };
      div.appendChild(img);

      div.innerHTML = `
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
          downloadAudio(ride);
        };
        div.appendChild(downloadButton);
      }
      for (let coordinate of ride.coordinates) {
        const playButton = document.createElement("button");
        playButton.innerHTML = `Play ${coordinate.name}`;
        playButton.onclick = () => {
          playAudio(ride.fileName, coordinate.name);
        };
        div.appendChild(playButton);
      }
      container.appendChild(div);
    });
    return container;
  } catch (error) {
    console.log("Error fetching ride data:", error);
  }
}

// Watcher for user's geolocation
navigator.geolocation.watchPosition(
  (position) => {
    let newCoords = [position.coords.latitude, position.coords.longitude];
    if (
      lastKnownCoords === null ||
      calculateDistance(lastKnownCoords, newCoords) >= 10
    ) {
      setLastKnownCoords(newCoords);
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
