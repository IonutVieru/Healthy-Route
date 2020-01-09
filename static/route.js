//Defines the basemap
var map = L.map('map',{
  center: [55.676111, 12.568333],
  zoom:15,
  basePath: osm
});
var osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  minZoom:10,
  maxZoom: 18,
  attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
    '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' 
}).addTo( map );

//Adding the Here.com Traffic layer
var hereTrafficayer = new L.TileLayer('https://tiles.traffic.api.here.com/traffic/6.0/tiles/{z}/{x}/{y}/256/png32?app_id=67Jad2HjPh8wXb3Eau3A&app_code=3hlMkBLEzMRbJp-Aondktw', 
    { attribution: '&copy; Any Attribution', 
    minZoom: 1, 
    maxZoom: 20, 
    opacity:0.5,
        }
    );
//Global variables
var lat;
var lon;
var lat2;
var lon2;
var Marker = {};
var Marker2 = {};
var profile;
var clicks = 0; //click counter
//Requesting routes 
map.on('click',clickME);
    function clickME(e) {
      
    	if (clicks == 0){
        //Storring the click coordinates into lat and lon variables
    		lat = e.latlng.lat;
    		lon = e.latlng.lng;

    		//Add a marker to show where you clicked.
    		Marker = L.marker([lat,lon]).bindPopup('Start');
            Marker.addTo(map);
    		console.log("First click:You clicked the map at LAT: "+ lat+" and LONG: "+lon );
        //Getting the travelling mode(checkbox values)
        //Cycling
        if ($('#routeCycle').is(':checked')) {
          //Setting the traveling mode to cycling
          profile = 'cycling-regular';
         
          console.log(profile);
        //Walking
        }else if ($('#routeWalking').is(':checked')){
          //Setting the traveling mode to walking
          profile = 'foot-walking';
          console.log(profile);
         
        }else{
          //Setting the traveling mode to driving - checked by default
          profile ='driving-car'
          console.log(profile);
         
}
        //Incrementing the click counter
    		clicks += 1;
    	}else if(clicks == 1){
        //Storring the click coordinates into lat2 and lon2 variables on the second click
    		lat2 = e.latlng.lat;
    		lon2 = e.latlng.lng;

        
    		//Add a marker to show where you clicked.
    		Marker2 = L.marker([lat2,lon2]).bindPopup('End');
            Marker2.addTo(map);
            
    		console.log("Second click:You clicked the map at LAT: "+ lat2+"and LONG: "+lon2+"Profile="+profile );
        //Regular route request to the server
        routeRequest(lon, lat, lon2, lat2, profile);
        
        //Avoid polygons route request to the server
        avoidPolygonsRequest(lon,lat,lon2,lat2,profile);
        
        //Incrementing the click counter
    		clicks +=1;
    	} else if(clicks >= 2){
            if (Marker && Marker2) { // check if there are any markers
                map.removeLayer(Marker); // removes Marker
                map.removeLayer(Marker2); // removes Marker
    }
        //Resets the click counter
    	   clicks =0;
        //Removes the routes
    	  removeRoute();
    	
 		}
}
 //Makes a request for the shortest path to the Flask server
function routeRequest(lon,lat,lon2,lat2,profile){
  //Defines the request URL
  var routeReq = '/request-route&start='+lon+','+lat+';'+'&end='+lon2+','+lat2+';'+'&profile='+profile;
  //Making an AJAX request
  var route1 = $.ajax({
  url: routeReq,
  dataType: "json",
  success: console.log("Data successfully loaded." + routeReq),
    error: function(xhr) {
              alert(`Route: ${xhr.statusText}`);
            }
    });
   // when().done() add the route on the map
  $.when(route1).done(function() {
  var shortestPath = L.geoJSON(route1.responseJSON, {
    onEachFeature: function (feature, layer) {
        layer.myTag = "myGeoJSON",
        layer.bindPopup('<div><p>Distance: '+feature.properties.summary.distance/1000+'</p>'+'<p>Time: '+feature.properties.summary.duration/60+'</p></div>')
        
    },
    opacity: 0.5,
    color: 'blue',
    weight: 7,
    zoomAnimated: true
    }).addTo(map);
});
}

console.log(profile);
 //Makes a request for the alternative route to the Flask server
function avoidPolygonsRequest(lon,lat,lon2,lat2,profile){
  //Request URL
 var req = '/avoid-route&start='+lon+','+lat+';'+'&end='+lon2+','+lat2+';'+'&profile='+profile;
  
 console.log(req);
 ////Making an AJAX request
 var route = $.ajax({
 url: req,
 dataType: "json",
 success: console.log("Data successfully loaded."),
 error: function(xhr) {
   alert(`Route: ${xhr.statusText}`);
 }
 });

// when().done() add the route on the map
 $.when(route).done(function() {
 // Add requested external GeoJSON to map
 var alternativeRoute = L.geoJSON(route.responseJSON, {
   onEachFeature: function (feature, layer) {
       layer.myTag = "myGeoJSON",
       layer.bindPopup('<div><p>Distance: '+feature.properties.summary.distance/1000+'</p>'+'<p>Time: '+feature.properties.summary.duration/60+'</p></div>')
   },
   opacity: 0.5,
   color: 'black',
   weight: 7,
   zoomAnimated: true
   }).addTo(map);
});
 }
//Makes a request to add polygon buffers on the map
 function getBuffer(){
  //Request URL
 var req = '/avoid-polygons'
  
 //AJAX request to the Flask server to get the polygon bufers
 var polygon = $.ajax({
 url: req,
 dataType: "json",
 success: console.log("Traffic polygon buffers successfully loaded."),
 error: function(xhr) {
   alert(`Route: ${xhr.statusText}`);
 }
 });

//Adds the polygons on the map
 $.when(polygon).done(function() {
 // Add requested external GeoJSON to map
 var polygonBuffers = L.geoJSON(polygon.responseJSON, {
   onEachFeature: function (feature, layer) {
       layer.myTag = "Traffic polygon buffers"
   },
   opacity: 0.5,
   color: 'red',
   weight: 1,
   zoomAnimated: true
   }).addTo(map);
});
 }
//Initialise the function
getBuffer();

//Removes the old route
var removeRoute = function() {
    map.eachLayer( function(layer) {
        if ( layer.myTag &&  layer.myTag === "myGeoJSON") {
        map.removeLayer(layer)
          }

    });
}

//Setting the layers
let layerControl = {
  //Here.com Traffic Layer
  "Here.com Traffic ": hereTrafficayer
  
}
   
//Ads layer control
var baseMaps = {
 "OSM": map
 };
//Adding the polylines on the map
 $(document).ready(function(){
  var traffic1 = $.ajax({
  url: '/traffic-information',
  dataType: "json",
  success: function(response){
    geojsonLayer = L.geoJson(response).addTo(map);
  },
  error: function(xhr) {
    alert(`Route: ${xhr.statusText}`);
  }
  })
});

L.control.layers( baseMaps, layerControl ).addTo( map )


