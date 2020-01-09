#Greencycle
======

Our project aims to create a routing app that finds an alternative route to avoid polluted areas in the city of Copenhagen using live traffic flow data. 

The application is based on data provided by the HERE Traffic API, where the actual congestion information is collected in an indicator named Jam factor. With this indicator, the polluted areas are marked by identifying congested areas with a Jam Factor superior to 8. 

When the user identifies the waypoints, a route with the shortest path will appear, but also an alternative route that avoids these congested areas. Since it is based on real time data, it provides a more accurate location of the polluted areas to avoid.

The application also provides an overview of the congested areas in the city, including the ones that the alternative route is avoiding. One of the limitations of basing the pollution in only a parameter as traffic flow is the fact that the data does not translate real pollution levels. 

However, given the high correlation between traffic congestion and Black Carbon, the application provides a healthier route for the user, avoiding the sour spots in heavily trafficked roads, and with the potential to expand its features and functionalities.

##Instalation instructions

- clone the github repository

- install the following dependencies on your python environment:

	=>flask

	=>requests

	=>shapely

	=>folium

	=>openrouteservice

	=>geojson

	=>numpy

	=>logging

- start the web server running the following commands:
	
	On Windows: set FLASK_APP=server.py flask run

	On Mac: env FLASK_APP=server.py flask run

- open the application on the following URL:

	http://127.0.0.1:5000/static/index.html

	




