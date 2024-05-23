import { downloadAllAudio, playAudio, errorAudio } from "./audioManagement.js";
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
        "./serviceWorker.js",
        { scope: "./" }
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
    container.className = "rides-grid";

    rides.forEach((ride) => {
      const div = document.createElement("div");
      div.className = "ride";

      const img = new Image();
      img.src = `./images/icons/${ride.fileName}.png`;
      img.alt = `${ride.name} Image`;
      img.onload = () => {
        div.appendChild(img);
      };
      img.onerror = () => {
        img.src = "./images/icons/undefined.png";
      };

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

      const infoDiv = document.createElement("div");
      infoDiv.className = "text"; // add a class to the info div
      infoDiv.innerHTML = `
          <div>Name: ${rideName}</div>
          <div>Ride Type: ${rideType}</div>
          <div>Description: ${rideDescription}</div>
          <div>Dub Type: ${
            ride.dubType === 0 ? "preshow only" : "Complete experience"
          }</div>`;
      div.appendChild(infoDiv);

      const buttonsDiv = document.createElement("div");
      buttonsDiv.className = "buttons"; // add a class to the buttons div

      for (let coordinate of ride.coordinates) {
        const playButton = document.createElement("button");
        playButton.innerHTML = `Play ${coordinate.name}`;
        playButton.onclick = () => {
          playAudio(ride.fileName, coordinate.name);
        };
        buttonsDiv.appendChild(playButton); // append the button to the buttons div
      }

      div.appendChild(buttonsDiv); // append the buttons div to the ride div
      container.appendChild(div);
    });

    if (navigator.onLine) {
      const downloadButton = document.createElement("button");
      downloadButton.id = "downloadAllButton";
      const cache = await caches.open("eftelingEchoesAudio");
      let allCached = true;

      for (let ride of rides) {
        for (let coordinate of ride.coordinates) {
          let filePath = `./audio/${language}/${ride.fileName}/${coordinate.name}.wav`;
          let cacheResponse = await cache.match(filePath);
          if (!cacheResponse) {
            allCached = false;
            break;
          }
        }
        if (!allCached) {
          break;
        }
      }

      if (!allCached) {
        const img = document.createElement("img");
        img.src = "./images/uiElements/download.png";
        img.alt = "Download";
        img.className = "downloadButtonImage"; // add a class to the image

        downloadButton.innerHTML = "Download to use offline"; // append the text first
        downloadButton.appendChild(img); // append the image after the text
        downloadButton.onclick = async () => {
          await downloadAllAudio(rides);
          downloadButton.style.display = "none"; // hide the button after all files are downloaded
        };
        const titleCard = document.getElementById("titleCard");
        titleCard.appendChild(downloadButton);
      }
    }

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
      if (isNearAnyRide(newCoords, rides)) {
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
