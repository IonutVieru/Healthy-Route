from flask import Flask, escape, request, Response,  render_template, jsonify, redirect, url_for, session, flash
import os
import json
import requests
import shapely
import folium
from openrouteservice import client
from shapely.geometry import LineString, Polygon, mapping, shape
from shapely.ops import cascaded_union
from geojson import Point, Feature, FeatureCollection, dump, MultiPolygon
import numpy as np
import logging
logging.basicConfig(level=logging.DEBUG)

app = Flask(__name__)

@app.route('/')
def index():
	buffer = []
	api_key = '5b3ce3597851110001cf62480bce1c9f6f5041d0ae79d1a8847f8b98' #https://openrouteservice.org/sign-up
	clnt = client.Client(key=api_key)
	map = folium.Map(tiles='https://maps.heigit.org/openmapsurfer/tiles/roads/webmercator/{z}/{x}/{y}.png', 
							attr='Map data (c) OpenStreetMap, Tiles (c) <a href="https://heigit.org">GIScience Heidelberg</a>', 
							location=([55.71459, 12.577]), 
							zoom_start=7) # Create map

	#Adding traffic information
	trafficUrl = "http://127.0.0.1:5000/traffic-information"
	req = requests.get(url = trafficUrl) 
	traffic = req.json() 

	#Styles the traffic information layer
	style_function = lambda x: {
		'color' : 'red',
	}
	
	#Adds geoJson to the map
	folium.GeoJson(traffic,style_function=style_function).add_to(map)

	#Add route to the map
	routeUrl = "http://127.0.0.1:5000/request-route&start=12.624406814575197,55.664079718036724;&end=12.458496093750002,55.69422894298507;&profile=driving-car"
	routeReq = requests.get(url = routeUrl) 
	route = routeReq.json() 

	#Styles route
	style_route = lambda x: {
		'color' : 'green',
	}
	map.add_child(folium.map.LayerControl())
	
	return map._repr_html_()

if __name__ == '__main__':
	app.run(debug=True)

#Defining the route
@app.route('/traffic-information')
def requestTraffic():
	#Output format
	format = 'flow.json'
	#API Credentials
	apiCredentials = "app_id=67Jad2HjPh8wXb3Eau3A&app_code=3hlMkBLEzMRbJp-Aondktw"
	#Response attributes
	responseAttributes = "responseattributes=sh"
	#Defining a bounding box for Copenhagen area
	bbox = "bbox=55.824430445857764,12.119293212890625;55.552718667216595,12.712554931640625"
	#URL request
	URL = "https://traffic.cit.api.here.com/traffic/6.2/"+ format+"?"+apiCredentials+"&"+bbox+"&"+responseAttributes
	r = requests.get(url = URL)
	#Reading the json data 
	data = r.json() 
	dta = data['RWS']
	#Empty list that will store the linestrings we make from the coordinates
	features = []
	#Parsing the data
	for rws in data['RWS']:
		for rw in rws['RW']:
			for fis in rw['FIS']:
				for fi in fis['FI']:
					##########################    
					#Getting the current flow#
					##########################
					for cf in fi['CF']:
						for key, value in cf.items():
							####################################################################    
							#Getting the JamFactor, SpeedUncut and FreeFlow in the current flow#
							####################################################################
							if key=='SU':
								speedUncut = value
							if key=='JF':
								jamFactor = value
								#If the Jam Factor > 8 returns the coordonates
								if jamFactor > 8:
									for shp in fi['SHP']:
										for key, value in shp.items():
											#Fixing the parsing
											if key == 'value':
												coordset = value
												for line in coordset:
													#Preparing the coordinates set to create line strings
													fields=line[0:-1].replace(' ', '],[').replace(',',', ')
													ccc=('[['+fields+']]')
													#Creates line strings for all the coordinates set
													lines = LineString(json.loads(ccc))
													#Appending the line sting to the feature list 
													features.append(Feature(geometry=lines))
													#Creates a FeatureCollection from the features
													feature_collection = FeatureCollection(features)
							if key=='FF':
								freeFlow = value
							#Getting SSS values
							if key == 'SSS':
								ssValue = value
								for key, value in ssValue.items():
									ssValueList = value
									for value in ssValueList:
										ssValueListDict = value
										#########################################################    
										#Getting Jam Factor, Free Flow and Speed Uncut inside SSS#
										#########################################################
										for key, value in ssValueListDict.items():
											ssFinalValues = value
											if key == 'SU':                          
												ssSpeedUncut = ssFinalValues
											if key == 'JF':
												ssJamFactor = ssFinalValues
												#If the Jam Factor > 8 return the coordonates
												if ssJamFactor > 8:
													jammm = ssJamFactor
													for shp in fi['SHP']:
														for key, value in shp.items():
															#Fixing the parsing
															if key == 'value':
																coordset = value
																for line in coordset:
																	#Preparing the coordinates set to create line strings
																	fields=line[0:-1].replace(' ', '],[').replace(',',', ')
																	ccc=('[['+fields+']]')
																	#Creates line strings for all the coordinates set
																	lines = LineString(json.loads(ccc))
																	#Appending the line sting to the feature list 
																	features.append(Feature(geometry=lines))
																	#Creates a FeatureCollection from the features
																	feature_collection = FeatureCollection(features)

												if key == 'FF':
													ssFreeFlow = ssFinalValues

	#Flipping the coordinates in the GeoJson Featured Collection
	def flip_geojson_coordinates(geo):
		if isinstance(geo, dict):
			for k, v in geo.items():
				if k == "coordinates":
					z = np.asarray(geo[k])
					f = z.flatten()
					geo[k] = np.dstack((f[1::2], f[::2])).reshape(z.shape).tolist()
				else:
					flip_geojson_coordinates(v)
		elif isinstance(geo, list):
			for k in geo:
				flip_geojson_coordinates(k)

	flip_coordinates = feature_collection
	flip_geojson_coordinates(flip_coordinates)
	
	return (feature_collection)
	
@app.route('/request-route&start=<lon>,<lat>;&end=<lon2>,<lat2>;&profile=<profile>')
def requestRoute(lon, lat, lon2, lat2, profile):
	#Open Route Service credentials
	api_key = '5b3ce3597851110001cf62480bce1c9f6f5041d0ae79d1a8847f8b98' 
	clnt = client.Client(key=api_key)
	#Seting the route coordinates
	coordinates = [[lon, lat], [lon2, lat2]]
	#Defines the route parameters
	direction_params = {'coordinates': coordinates,
						'profile': profile, 
						'format_out': 'geojson',
						'preference': 'shortest',
                		'instructions': False,
						'geometry': 'true'}
	#Makes a request to Open Route Service to get the route					
	regular_route = clnt.directions(**direction_params) 

	return regular_route

#Avoid polygons route request
@app.route('/avoid-route&start=<lon>,<lat>;&end=<lon2>,<lat2>;&profile=<profile>')
def avoidRoute(lon, lat, lon2, lat2, profile):
	buffer =[]
	#Seting the route coordinates
	coordinates = [[lon, lat], [lon2, lat2]]
	#Open Route Service credentials
	api_key = '5b3ce3597851110001cf62480bce1c9f6f5041d0ae79d1a8847f8b98' 
	clnt = client.Client(key=api_key)
	#Makes a request to get the traffic information
	get_feature_collection= "http://127.0.0.1:5000/traffic-information"
	feature_collection_req = requests.get(url = get_feature_collection) 
	feature_collection = feature_collection_req.json() 
	#Adding buffers
	for geom in feature_collection['features']:
		route_buffer = LineString(geom['geometry']['coordinates']).buffer(0.0005) # Create geometry buffer
		#simp_geom = route_buffer.simplify(0.00005) # Simplify geometry 
		buffer.append(route_buffer)
	#Merging the buffer geometries in case there are 2 or more polygons next to each other
	union_buffer = cascaded_union(buffer)
	
	
	avoid_request = {'coordinates': coordinates, 
                'format_out': 'geojson',
                'profile': profile,
                'preference': 'shortest',
                'instructions': False,
                 'options': {'avoid_polygons': mapping(union_buffer)}} 
	avoid_route = clnt.directions(**avoid_request)

	return avoid_route


@app.route('/avoid-polygons')
def avoidPolygons():
	#Initialising an empty list to store the buffers
	buffer=[]
	#Makes a request to get Feature Collection
	get_feature_collection= "http://127.0.0.1:5000/traffic-information"
	feature_collection_req = requests.get(url = get_feature_collection) 
	feature_collection = feature_collection_req.json() 
	#Adding buffers
	for geom in feature_collection['features']:
		# Create geometry buffer
		route_buffer = LineString(geom['geometry']['coordinates']).buffer(0.0005)
		# Simplify buffer geometry 
		#simp_geom = route_buffer.simplify(0.0000005)
		#Append geometries to the buffer list 
		buffer.append(route_buffer)
	#Merging the buffer geometries in case there are 2 or more polygons next to eachother
	union_buffer = cascaded_union(buffer)
	json_buffer = Feature(geometry=union_buffer)

	return json_buffer