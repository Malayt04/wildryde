/*global WildRydes _config*/
var WildRydes = window.WildRydes || {};
WildRydes.map = WildRydes.map || {}; // Ensure the map object is initialized

require([
    "esri/Map",
    "esri/views/MapView",
    "esri/Graphic",
    "esri/geometry/Point",
    "esri/symbols/TextSymbol",
    "esri/symbols/PictureMarkerSymbol",
    "esri/geometry/support/webMercatorUtils"
], (Map, MapView, Graphic, Point, TextSymbol, PictureMarkerSymbol, webMercatorUtils) => {
    
    // Custom event handling setup
    WildRydes.map.events = {};
    WildRydes.map.dispatchEvent = function(eventName) {
        if (this.events[eventName]) {
            this.events[eventName].forEach(callback => callback());
        }
    };
    WildRydes.map.on = function(eventName, callback) {
        if (!this.events[eventName]) {
            this.events[eventName] = [];
        }
        this.events[eventName].push(callback);
    };

    // Use navigator.geolocation to get user location and initialize map
    function initMapWithLocation(latitude, longitude) {
        const map = new Map({ basemap: "gray-vector" });

        const view = new MapView({
            container: "map",
            map: map,
            zoom: 14,
            center: [longitude, latitude]
        });

        const pinSymbol = new TextSymbol({
            color: '#f50856',
            text: '\ue61d',
            font: {
                size: 20,
                family: 'CalciteWebCoreIcons'
            }
        });

        var unicornSymbol = {
            type: "picture-marker",
            url: "images/taxi.png",
            width: "64px",
            height: "64px"
        };

        var originalLocationGraphic, pinGraphic, unicornGraphic;

        function updateCenter(newValue) {
            WildRydes.map.center = {
                latitude: newValue.latitude,
                longitude: newValue.longitude
            };
        }

        function updateExtent(newValue) {
            var min = webMercatorUtils.xyToLngLat(newValue.xmin, newValue.ymin);
            var max = webMercatorUtils.xyToLngLat(newValue.xmax, newValue.ymax);
            WildRydes.map.extent = {
                minLng: min[0],
                minLat: min[1],
                maxLng: max[0],
                maxLat: max[1]
            };
        }

        view.watch('extent', updateExtent);
        view.watch('center', updateCenter);

        view.when(() => {
            updateExtent(view.extent);
            updateCenter(view.center);

            // Animation function for movement
            WildRydes.map.animate = function animate(origin, dest, callback) {
                let startTime;
                const step = function animateFrame(timestamp) {
                    let progress, progressPct, point, deltaLat, deltaLon;
                    if (!startTime) startTime = timestamp;
                    progress = timestamp - startTime;
                    progressPct = Math.min(progress / 2000, 1); // Duration of 2 seconds

                    deltaLat = (dest.latitude - origin.latitude) * progressPct;
                    deltaLon = (dest.longitude - origin.longitude) * progressPct;

                    point = new Point({
                        longitude: origin.longitude + deltaLon,
                        latitude: origin.latitude + deltaLat
                    });

                    if (unicornGraphic) {
                        view.graphics.remove(unicornGraphic); // Remove previous graphic
                    }

                    unicornGraphic = new Graphic({
                        geometry: point,
                        symbol: unicornSymbol
                    });

                    view.graphics.add(unicornGraphic); // Add updated graphic

                    if (progressPct < 1) {
                        requestAnimationFrame(step); // Continue animation
                    } else {
                        callback(); // Call the callback when done
                    }
                };

                requestAnimationFrame(step); // Start the animation
            };

            WildRydes.map.unsetLocation = function unsetLocation() {
                if (pinGraphic) {
                    view.graphics.remove(pinGraphic); // Remove pin graphic if it exists
                }
            };

            view.on('click', function handleViewClick(event) {
                WildRydes.map.selectedPoint = event.mapPoint; // Store selected point
                if (pinGraphic) {
                    view.graphics.remove(pinGraphic); // Remove existing pin graphic
                }
            
                pinGraphic = new Graphic({
                    symbol: pinSymbol,
                    geometry: WildRydes.map.selectedPoint
                });
            
                view.graphics.add(pinGraphic); // Add new pin graphic
                WildRydes.map.dispatchEvent('pickupChange'); // Dispatch custom event
            });
        }).catch(err => {
            console.error("Error loading the map view:", err);
        });

        function markOriginalLocation() {
            originalLocationGraphic = new Graphic({
                symbol: pinSymbol,
                geometry: new Point({
                    longitude: longitude,
                    latitude: latitude
                })
            });
            view.graphics.add(originalLocationGraphic);
        }

        // Mark original location
        markOriginalLocation();
    }

    // Get location and initialize map
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                initMapWithLocation(position.coords.latitude, position.coords.longitude);
            },
            (error) => {
                console.error("Error getting location:", error);
                // Optionally: Initialize with default location if error
                initMapWithLocation(0, 0); // Default to (0,0) or another fallback location
            }
        );
    } else {
        console.error("Geolocation is not supported by this browser.");
        initMapWithLocation(0, 0); // Default to (0,0) or another fallback location
    }
});
