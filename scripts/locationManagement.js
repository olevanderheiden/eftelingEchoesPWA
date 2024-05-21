// Function to calculate distance between two coordinates
export function calculateDistance(userCoords, rideCoords) {
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
export function isNearAnyRide(userCoords, rides) {
  for (let ride of rides) {
    for (let coordinate of ride.coordinates) {
      let rideCoords = coordinate.coordinates.split(", ").map(Number);
      if (calculateDistance(userCoords, rideCoords) <= 20) {
        playAudio(ride.fileName, coordinate.name);
        console.log(`You are near ${ride.name}!`);
        return true;
      }
    }
    return false;
  }
}

// Placeholder for user's last known coordinates
export let lastKnownCoords = null;

export function setLastKnownCoords(coords) {
  lastKnownCoords = coords;
}
