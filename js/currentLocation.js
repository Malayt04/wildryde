
    var latitude = 0
    var longitude = 0

    if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
        (position) => {
             latitude = position.coords.latitude;
             longitude = position.coords.longitude;
        },
        (error) => {
            console.error("Error getting location:", error);
        }
    );
} else {
    console.error("Geolocation is not supported by this browser.");
}

const userLocation = {
    latitude: latitude,
    longitude: longitude
}

export default userLocation
