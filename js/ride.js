
/*global WildRydes _config*/
var WildRydes = window.WildRydes || {};
WildRydes.map = WildRydes.map || {};

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

(function rideScopeWrapper($) {
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
        $.ajax({
            method: 'POST',
            url: _config.api.invokeUrl + '/ride',
            headers: {
                Authorization: authToken
            },
            data: JSON.stringify({
                PickupLocation: {
                    Latitude: pickupLocation.latitude,
                    Longitude: pickupLocation.longitude
                }
            }),
            contentType: 'application/json',
            success: completeRequest,
            error: function ajaxError(jqXHR, textStatus, errorThrown) {
                console.error('Error requesting ride: ', textStatus, ', Details: ', errorThrown);
                console.error('Response: ', jqXHR.responseText);
                alert('An error occurred when requesting your taxi:\n' + jqXHR.responseText);
            }
        });
    }

    function completeRequest(result) {
        var unicorn = result.Unicorn;
        displayUpdate(unicorn.Name + ', your ' + unicorn.Color + ' taxi, is on its way.');
        animateArrival(function animateCallback() {
            displayUpdate(unicorn.Name + ' is arriving');
            displayUpdate(unicorn.Driver.Name + ' is your dirver')
            displayUpdate('Contact him on ' + unicorn.Driver.PhoneNumber);
            console.log(WildRydes.map.selectedPoint.latitude);
            console.log(userLocation.latitude)
            displayUpdate('Your total cost is  Rs '  + Math.abs(Math.round((WildRydes.map.selectedPoint.latitude - userLocation.latitude) *  1000000)));
            WildRydes.map.unsetLocation();
            $('#request').prop('disabled', true);
            $('#request').text('Set Pickup');
        });
    }

    $(function onDocReady() {
        $('#request').click(handleRequestClick);
        $('#signOut').click(function() {
            WildRydes.signOut();
            alert("You have been signed out.");
            window.location = "signin.html";
        });
        
        $(WildRydes.map).on('pickupChange', handlePickupChanged);

        WildRydes.authToken.then(function updateAuthMessage(token) {
            if (token) {
                displayUpdate('You are authenticated. Click to see your <a href="#authTokenModal" data-toggle="modal">auth token</a>.');
                $('.authToken').text(token);
            }
        });

        if (!_config.api.invokeUrl) {
            $('#noApiMessage').show();
        }
    });

    function handlePickupChanged() {
        var requestButton = $('#request');
        requestButton.text('Request Unicorn');
        requestButton.prop('disabled', false);
    }

    function handleRequestClick(event) {
        var pickupLocation = WildRydes.map.selectedPoint;
        event.preventDefault();
        requestUnicorn(pickupLocation);
    }

    function animateArrival(callback) {
        var dest = WildRydes.map.selectedPoint;
        var origin = {};

        origin.latitude = dest.latitude > WildRydes.map.center.latitude ? 
                         WildRydes.map.extent.minLat : 
                         WildRydes.map.extent.maxLat;

        origin.longitude = dest.longitude > WildRydes.map.center.longitude ? 
                          WildRydes.map.extent.minLng : 
                          WildRydes.map.extent.maxLng;

        WildRydes.map.animate(origin, dest, callback);
    }

    function displayUpdate(text) {
        $('#updates').append($('<li>' + text + '</li>'));
    }
}(jQuery));