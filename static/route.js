//Defines the basemap
var osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  minZoom:10,
  maxZoom: 18,
  attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
    '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' 
});

var map = L.map('map',{
  center: [55.676111, 12.568333],
  zoom:15,
  layers: [osm],
  key: 'GwGviqOg5HsrJIvHdRAAGcHTs6IruFWE', 
  basePath: 'sdk', 
  //traffic: true, 
   //trafficFlow: true
});

var hereTrafficayer = new L.TileLayer('https://tiles.traffic.api.here.com/traffic/6.0/tiles/{z}/{x}/{y}/256/png32?app_id=67Jad2HjPh8wXb3Eau3A&app_code=3hlMkBLEzMRbJp-Aondktw', 
    { attribution: '&copy; Any Attribution', 
    minZoom: 1, 
    maxZoom: 20, 
    opacity:0.5,
        }
    );
//Ads marker and gets the coordonates on click
var lat;
var lon;
var lat2;
var lon2;
var Marker = {};
var Marker2 = {};
var profile;
var clicks = 0; //click counter
map.on('click',clickME);
    function clickME(e) {
      
    	if (clicks == 0){
    		lat = e.latlng.lat;
    		lon = e.latlng.lng;


    		//Add a marker to show where you clicked.
    		Marker = L.marker([lat,lon]).bindPopup('Start');
            Marker.addTo(map);
    		console.log("First click:You clicked the map at LAT: "+ lat+" and LONG: "+lon );
        //Getting the checkbox values
        if ($('#routeCycle').is(':checked')) {
          profile = 'cycling-regular';
         
          console.log(profile);
        }else if ($('#routeWalking').is(':checked')){
          profile = 'foot-walking';
          console.log(profile);
         
        }else{
          profile ='driving-car'
          console.log(profile);
         
}
    		clicks += 1;
    	}else if(clicks == 1){
    		lat2 = e.latlng.lat;
    		lon2 = e.latlng.lng;

        
    		//Add a marker to show where you clicked.
    		Marker2 = L.marker([lat2,lon2]).bindPopup('End');
            Marker2.addTo(map);
            
    		console.log("Second click:You clicked the map at LAT: "+ lat2+"and LONG: "+lon2+"Profile="+profile );
        //Simple route request to the server
        routeRequest(lon, lat, lon2, lat2, profile);
        
        //Avoid polygons route request to the server
        avoidPolygonsRequest(lon,lat,lon2,lat2,profile);
        
    		clicks +=1;
    	} else if(clicks >= 2){
            if (Marker && Marker2) { // check
                map.removeLayer(Marker); // removes Marker
                map.removeLayer(Marker2); // removes Marker
    }
    	   clicks =0;
    	  removeRoute();
    	
 		}
}
 //Flask route request
function routeRequest(lon,lat,lon2,lat2,profile){
          
  var routeReq = '/request-route&start='+lon+','+lat+';'+'&end='+lon2+','+lat2+';'+'&profile='+profile;
  var route1 = $.ajax({
  url: routeReq,
  dataType: "json",
  success: console.log("Data successfully loaded." + routeReq),
    error: function(xhr) {
              alert(`Route: ${xhr.statusText}`);
            }
    });
   // when().done() SECTION
  // Add the variable for each of your AJAX requests to $.when()
  $.when(route1).done(function() {
  // Add requested external GeoJSON to map
  var kyCounties = L.geoJSON(route1.responseJSON, {
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

function avoidPolygonsRequest(lon,lat,lon2,lat2,profile){
  //Request URL
 var req = '/avoid-route&start='+lon+','+lat+';'+'&end='+lon2+','+lat2+';'+'&profile='+profile;
  
 console.log(req);
 //Get request to OpenRouteService to get the route 
 var route = $.ajax({
 url: req,
 dataType: "json",
 success: console.log("Data successfully loaded."),
 error: function(xhr) {
   alert(`Route: ${xhr.statusText}`);
 }
 });

  // when().done() SECTION
 // Add the variable for each of your AJAX requests to $.when()
 $.when(route).done(function() {
 // Add requested external GeoJSON to map
 var kyCounties = L.geoJSON(route.responseJSON, {
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

 function getBuffer(){
  //Request URL
 var req = '/avoid-polygons'
  
 //Get request to OpenRouteService to get the route 
 var polygon = $.ajax({
 url: req,
 dataType: "json",
 success: console.log("Traffic polygon buffers successfully loaded."),
 error: function(xhr) {
   alert(`Route: ${xhr.statusText}`);
 }
 });

  // when().done() SECTION
 // Add the variable for each of your AJAX requests to $.when()
 $.when(polygon).done(function() {
 // Add requested external GeoJSON to map
 var kyCounties = L.geoJSON(polygon.responseJSON, {
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
//getBuffer();

//Removes the old route
var removeRoute = function() {
    map.eachLayer( function(layer) {
        if ( layer.myTag &&  layer.myTag === "myGeoJSON") {
        map.removeLayer(layer)
          }

    });
}

var hereTrafficayer = new L.TileLayer('https://tiles.traffic.api.here.com/traffic/6.0/tiles/{z}/{x}/{y}/256/png32?app_id=67Jad2HjPh8wXb3Eau3A&app_code=3hlMkBLEzMRbJp-Aondktw', 
    { attribution: '&copy; Any Attribution', 
    minZoom: 1, 
    maxZoom: 20, 
    opacity:0.5,
        }
    );

var trafficFlowLayer = new tomtom.L.TomTomTrafficFlowLayer(); 
let layerControl = {
  //Here.com Traffic Layer
  "Here.com Traffic ": hereTrafficayer,
  //TomTom traffic layer
  "TomTom Traffic":trafficFlowLayer,
}
   
//Ads layer control
var baseMaps = {
 "OSM": osm
 };
//Traffic line strings
//  $(document).ready(function(){
//   var traffic1 = $.ajax({
//   url: '/traffic-information',
//   dataType: "json",
//   success: function(response){
//     geojsonLayer = L.geoJson(response).addTo(map);
//   },
//   error: function(xhr) {
//     alert(`Route: ${xhr.statusText}`);
//   }
//   })
// });


//Traffic line strings
function getLineStrings(){
  //Request URL
 var req = '/traffic-information'
  
 //Get request to OpenRouteService to get the route 
 var line = $.ajax({
 url: req,
 dataType: "json",
 success: console.log("Traffic polygon buffers successfully loaded."),
 error: function(xhr) {
   alert(`Route: ${xhr.statusText}`);
 }
 });

  // when().done() SECTION
 // Add the variable for each of your AJAX requests to $.when()
 $.when(line).done(function() {
 // Add requested external GeoJSON to map
 var kyCounties = L.geoJSON(line.responseJSON, {
   onEachFeature: function (feature, layer) {
       layer.myTag = "Traffic lines"
   },
   
   opacity: 0.5,
   color: 'green',
   weight: 10,
   zoomAnimated: true
   }).addTo(map);
});
 }
 //Initialise the function
 getLineStrings()

L.control.layers( baseMaps, layerControl ).addTo( map )


//Jam factor line strings
//To be deleted
function getLineStrings(){
  //Request URL
 var req = '/jam-factor'
  
 //Get request to OpenRouteService to get the route 
 var line = $.ajax({
 url: req,
 dataType: "json",
 success: console.log("Traffic polygon buffers successfully loaded."),
 error: function(xhr) {
   alert(`Route: ${xhr.statusText}`);
 }
 });

  // when().done() SECTION
 // Add the variable for each of your AJAX requests to $.when()
 $.when(line).done(function() {
 // Add requested external GeoJSON to map
 var kyCounties = L.geoJSON(line.responseJSON, {
   onEachFeature: function (feature, layer) {
       layer.myTag = "Traffic lines",
       layer.bindPopup(feature.properties.JF.toString())
   },
   
   opacity: 0.5,
   color: 'red',
   weight: 5,
   zoomAnimated: true
   }).addTo(map);
});
 }
 //Initialise the function
 getLineStrings()
