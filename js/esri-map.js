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

    var wrMap = WildRydes.map; // Reference to the initialized map object

    // Custom event handling
    wrMap.events = {};

    wrMap.dispatchEvent = function(eventName) {
        if (this.events[eventName]) {
            this.events[eventName].forEach(callback => callback());
        }
    };

    wrMap.on = function(eventName, callback) {
        if (!this.events[eventName]) {
            this.events[eventName] = [];
        }
        this.events[eventName].push(callback);
    };

    const map = new Map({
        basemap: "gray-vector"
    });

    const view = new MapView({
        container: "map", 
        map: map, 
        zoom: 14, 
        center: [79.14, 12.93]
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
        url: "images/unicorn-icon.png",
        width: "64px",
        height: "64px"
    };

    var pinGraphic;
    var unicornGraphic;

    function updateCenter(newValue) {
        wrMap.center = {
            latitude: newValue.latitude,
            longitude: newValue.longitude
        };
    }

    function updateExtent(newValue) {
        var min = webMercatorUtils.xyToLngLat(newValue.xmin, newValue.ymin);
        var max = webMercatorUtils.xyToLngLat(newValue.xmax, newValue.ymax);
        wrMap.extent = {
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

        // Initialize the animate function
        wrMap.animate = function animate(origin, dest, callback) {
            let startTime;
            const step = function animateFrame(timestamp) {
                let progress;
                let progressPct;
                let point;
                let deltaLat;
                let deltaLon;

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

        wrMap.unsetLocation = function unsetLocation() {
            if (pinGraphic) {
                view.graphics.remove(pinGraphic); // Remove pin graphic if it exists
            }
        };

        view.on('click', function handleViewClick(event) {
            wrMap.selectedPoint = event.mapPoint; // Store selected point
            if (pinGraphic) {
                view.graphics.remove(pinGraphic); // Remove existing pin graphic
            }
        
            pinGraphic = new Graphic({
                symbol: pinSymbol,
                geometry: wrMap.selectedPoint
            });
        
            view.graphics.add(pinGraphic); // Add new pin graphic
        
            // Dispatch custom event
            wrMap.dispatchEvent('pickupChange'); // Ensure this line is executed
        });
    }).catch(err => {
        console.error("Error loading the map view:", err);
    });
});