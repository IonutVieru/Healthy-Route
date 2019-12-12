 


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
 // traffic: true, 
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
            
    		console.log("Second click:You clicked the map at LAT: "+ lat2+" and LONG: "+lon2 );
    		makeRequest();
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



console.log(profile);
//Makes a request to the OpenRoute API to get the route
function makeRequest(){
 	//Request URL
	var req = "https://api.openrouteservice.org/v2/directions/"+profile+"?api_key=5b3ce3597851110001cf62480bce1c9f6f5041d0ae79d1a8847f8b98&start="+lon+","+lat+"&end="+lon2+","+lat2
 	
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
        layer.myTag = "myGeoJSON"
    },
    opacity: 0.5,
    color: 'blue',
    weight: 7,
    zoomAnimated: true
    }).addTo(map);
});

 }
//Removes the old route
var removeRoute = function() {
    map.eachLayer( function(layer) {
        if ( layer.myTag &&  layer.myTag === "myGeoJSON") {
        map.removeLayer(layer)
          }

    });
}

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

L.control.layers( baseMaps, layerControl ).addTo( map )


