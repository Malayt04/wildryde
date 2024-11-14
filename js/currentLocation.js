let userLocation = {
    latitude: null,
    longitude: null
};

if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
        (position) => {
            userLocation.latitude = position.coords.latitude;
            userLocation.longitude = position.coords.longitude;
            console.log("User Location:", userLocation);
        },
        (error) => {
            console.error("Error getting location:", error);
        }
    );
} else {
    console.error("Geolocation is not supported by this browser.");
}

export default userLocation;