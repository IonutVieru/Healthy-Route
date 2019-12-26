from flask import Flask, escape, request, Response,  render_template, jsonify, redirect, url_for, session, flash
import psycopg2
import os
import json
import requests
import shapely
import folium
from openrouteservice import client
from shapely.geometry import LineString, Polygon, mapping, shape
from shapely.ops import cascaded_union
import geopandas as gpd
from geojson import Point, Feature, FeatureCollection, dump, MultiPolygon
import numpy as np
import logging
logging.basicConfig(level=logging.DEBUG)

app = Flask(__name__, template_folder='templates')


#print(data)
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


@app.route('/traffic-information')
def requestTraffic():
	
	URL = "https://traffic.cit.api.here.com/traffic/6.2/flow.json?app_id=67Jad2HjPh8wXb3Eau3A&app_code=3hlMkBLEzMRbJp-Aondktw&bbox=55.824430445857764,12.119293212890625;55.552718667216595,12.712554931640625&responseattributes=sh"
	r = requests.get(url = URL) 
	data = r.json() 
	dta = data['RWS']
	URL = "https://traffic.cit.api.here.com/traffic/6.2/flow.json?app_id=67Jad2HjPh8wXb3Eau3A&app_code=3hlMkBLEzMRbJp-Aondktw&bbox=55.824430445857764,12.119293212890625;55.552718667216595,12.712554931640625&responseattributes=sh"
	r = requests.get(url = URL) 
	data = r.json() 
	dta = data['RWS']
	#print(data)
	jam = []
	lat_point = []
	lon_point = []
	features = []
	buffer = []
	for rws in data['RWS']:
		#print(rws)
		
		for rw in rws['RW']:
			#print(rw)
			
			for fis in rw['FIS']:
				#print(fis)
				
				for fi in fis['FI']:
					#print(fi)
					#########################   
					#Getting the coordonates#
					#########################
					#for shp in fi['SHP']:
						#print(shp)
						#for key, value in shp.items():
							#print(value)
							
					##########################    
					#Getting the current flow#
					##########################
					for cf in fi['CF']:
						#print(cf)
						
						for key, value in cf.items():
							#print(key)
							#print(value)
							####################################################################    
							#Getting the JamFactor, SpeedUncut and FreeFlow in the current flow#
							####################################################################
							if key=='SU':
								speedUncut = value
								#print("Speed Uncut: "+str(speedUncut))
							if key=='JF':
								jamFactor = value
								#print("Jam Factor: "+str(jamFactor))
								if jamFactor > 5:
									for shp in fi['SHP']:
										#print(jamFactor)
										
										for key, value in shp.items():
											#Fixing the parsing
											if key == 'value':
												#print(key)
												coordset = value
												#print (coordset)
												for line in coordset:
													#print(line)
													fields=line[0:-1].replace(' ', '],[').replace(',',', ')

													ccc=('[['+fields+']]')
													#print(ccc)

													lines = LineString(json.loads(ccc))
													#print (lines)

													# add more features...
													# features.append(...)
													features.append(Feature(geometry=lines))
													#Creates a FeatureCollection
													feature_collection = FeatureCollection(features)
							if key=='FF':
								freeFlow = value
								#print("Free Flow: "+str(freeFlow))
								
							#Getting SS values
							if key == 'SSS':
								#print(value)
								ssValue = value
								
								for key, value in ssValue.items():
									#print(key)
									#print(value)
									ssValueList = value
								   
									for value in ssValueList:
										#print(value)
										ssValueListDict = value
										
										#########################################################    
										#Getting Jam Factor, Free Flow and Speed Uncut inside SS#
										#########################################################
										for key, value in ssValueListDict.items():
											#print(key)
											#print(value)
											ssFinalValues = value
											if key == 'SU':                          
												ssSpeedUncut = ssFinalValues
												#print("SS Speed Uncut: "+str(ssSpeedUncut))
											if key == 'JF':
												
												ssJamFactor = ssFinalValues
												#print(ssJamFactor)
												#If the Jam Factor == 10 give me the coordonates
												if ssJamFactor > 5:
													jammm = ssJamFactor
													#print (jammm)
													#print("SS Jam Factor: "+str(ssJamFactor))
													for shp in fi['SHP']:
														#print(shp)
													
														for key, value in shp.items():
															#Fixing the parsing
															if key == 'value':
																#print(key)
																coordset = value
																#print (coordset)
																for line in coordset:
																	#print(line)
																	fields=line[0:-1].replace(' ', '],[').replace(',',', ')

																	ccc=('[['+fields+']]')
																	#print(ccc)

																	lines = LineString(json.loads(ccc))
																
																	
																	# add more features...
																	# features.append(...)
																	features.append(Feature(geometry=lines))
																	
																	#Creates a FeatureCollection
																	feature_collection = FeatureCollection(features)
																	#print(feature_collection)																   

													
												if key == 'FF':
													ssFreeFlow = ssFinalValues
													#print("SS Free Flow: "+str(ssFreeFlow))

	

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
	# #Adding buffers
	# for geom in feature_collection['features']:
	# 	route_buffer = LineString(geom['geometry']['coordinates']).buffer(0.0005) # Create geometry buffer
	# 	simp_geom = route_buffer.simplify(0.0000005) # Simplify geometry for better handling
	# 	buffer.append(simp_geom)
	# union_buffer = cascaded_union(buffer)
	# road_buffer = Feature(geometry=union_buffer)

	return (feature_collection)
	
@app.route('/request-route&start=<lon>,<lat>;&end=<lon2>,<lat2>;&profile=<profile>')
def requestRoute(lon, lat, lon2, lat2, profile):
	api_key = '5b3ce3597851110001cf62480bce1c9f6f5041d0ae79d1a8847f8b98' #https://openrouteservice.org/sign-up
	clnt = client.Client(key=api_key)
	 #Request route
	coordinates = [[lon, lat], [lon2, lat2]]
	
	direction_params = {'coordinates': coordinates,
						'profile': profile, 
						'format_out': 'geojson',
						
                		'instructions': False,
						'geometry': 'true'}

	regular_route = clnt.directions(**direction_params) # Direction request

	return regular_route

@app.route('/avoid-route&start=<lon>,<lat>;&end=<lon2>,<lat2>;&profile=<profile>')
def avoidRoute(lon, lat, lon2, lat2, profile):
	coordinates = [[lon, lat], [lon2, lat2]]
	buffer =[]
	api_key = '5b3ce3597851110001cf62480bce1c9f6f5041d0ae79d1a8847f8b98' #https://openrouteservice.org/sign-up
	clnt = client.Client(key=api_key)
	get_feature_collection= "http://127.0.0.1:5000/traffic-information"
	feature_collection_req = requests.get(url = get_feature_collection) 
	feature_collection = feature_collection_req.json() 
	#Adding buffers
	for geom in feature_collection['features']:
		route_buffer = LineString(geom['geometry']['coordinates']).buffer(0.0005) # Create geometry buffer
		simp_geom = route_buffer.simplify(0.0000005) # Simplify geometry for better handling
		buffer.append(simp_geom)
	union_buffer = cascaded_union(buffer)
	
	
	avoid_request = {'coordinates': coordinates, 
                'format_out': 'geojson',
                'profile': profile,
                
                'instructions': False,
                 'options': {'avoid_polygons': mapping(union_buffer)}} 
	avoid_route = clnt.directions(**avoid_request)

	return avoid_route


@app.route('/avoid-polygons')
def avoidPolygons():
	buffer=[]
	get_feature_collection= "http://127.0.0.1:5000/traffic-information"
	feature_collection_req = requests.get(url = get_feature_collection) 
	feature_collection = feature_collection_req.json() 
	#Adding buffers
	for geom in feature_collection['features']:
		route_buffer = LineString(geom['geometry']['coordinates']).buffer(0.0005) # Create geometry buffer
		simp_geom = route_buffer.simplify(0.0000005) # Simplify geometry for better handling
		buffer.append(simp_geom)
	union_buffer = cascaded_union(buffer)
	json_buffer = Feature(geometry=union_buffer)

	return json_buffer