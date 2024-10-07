var WildRydes = window.WildRydes || {};
WildRydes.map = WildRydes.map || {};

(function rideScopeWrapper() {
    var authToken;
    WildRydes.authToken.then(function setAuthToken(token) {
        if (token) {
            authToken = token;
        } else {
            window.location.href = '/signin.html';
        }
    }).catch(function handleTokenError(error) {
        alert(error);
        window.location.href = '/signin.html';
    });

    function requestUnicorn(pickupLocation) {
        fetch(_config.api.invokeUrl + '/ride', {
            method: 'POST',
            headers: {
                'Authorization': authToken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                PickupLocation: {
                    Latitude: pickupLocation.latitude,
                    Longitude: pickupLocation.longitude
                }
            })
        })
        .then(response => response.json())
        .then(completeRequest)
        .catch(function ajaxError(error) {
            console.error('Error requesting ride: ', error);
            alert('An error occurred when requesting your unicorn:\n' + error);
        });
    }

    function completeRequest(result) {
        var unicorn;
        var pronoun;
        console.log('Response received from API: ', result);
        unicorn = result.Unicorn;
        pronoun = unicorn.Gender === 'Male' ? 'his' : 'her';
        displayUpdate(unicorn.Name + ', your ' + unicorn.Color + ' unicorn, is on ' + pronoun + ' way.');
        animateArrival(function animateCallback() {
            displayUpdate(unicorn.Name + ' has arrived. Giddy up!');
            WildRydes.map.unsetLocation();
            document.getElementById('request').disabled = true; // Disable button after request
            document.getElementById('request').innerText = 'Set Pickup';
        });
    }

    // Register click handler for #request button
    document.addEventListener('DOMContentLoaded', function onDocReady() {
        document.getElementById('request').addEventListener('click', handleRequestClick);
        document.getElementById('signOut').addEventListener('click', function() {
            WildRydes.signOut();
            alert("You have been signed out.");
            window.location = "signin.html";
        });

        WildRydes.map.addEventListener('pickupChange', handlePickupChanged);

        WildRydes.authToken.then(function updateAuthMessage(token) {
            if (token) {
                displayUpdate('You are authenticated. Click to see your <a href="#authTokenModal">auth token</a>.');
                document.querySelector('.authToken').innerText = token;
            }
        });

        if (!_config.api.invokeUrl) {
            document.getElementById('noApiMessage').style.display = 'block';
        }
    });

    function handlePickupChanged() {
        var requestButton = document.getElementById('request');
        requestButton.innerText = 'Request Unicorn'; // Change button text
        requestButton.disabled = false; // Enable button when pickup is set

        // Optional: Log to confirm this function is called
        console.log("Pickup changed! Button enabled.");
    }

    function handleRequestClick(event) {
        var pickupLocation = WildRydes.map.selectedPoint;
        event.preventDefault();

        if (pickupLocation) { // Ensure a valid pickup location
            requestUnicorn(pickupLocation); // Send data to rides API
        } else {
            alert("Please select a pickup location on the map.");
        }
    }

    function animateArrival(callback) {
        var dest = WildRydes.map.selectedPoint;
        var origin = {};

        if (dest.latitude > WildRydes.map.center.latitude) {
            origin.latitude = WildRydes.map.extent.minLat;
        } else {
            origin.latitude = WildRydes.map.extent.maxLat;
        }

        if (dest.longitude > WildRydes.map.center.longitude) {
            origin.longitude = WildRydes.map.extent.minLng;
        } else {
            origin.longitude = WildRydes.map.extent.maxLng;
        }

        WildRydes.map.animate(origin, dest, callback);
    }

    function displayUpdate(text) {
        var updatesList = document.getElementById('updates');
        var newItem = document.createElement('li');
        newItem.innerHTML = text;
        updatesList.appendChild(newItem);
    }
})();