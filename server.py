from flask import Flask, escape, request, Response
import psycopg2

app = Flask(__name__)

@app.route('/')
def hello():
    name = request.args.get("name", "World")
    return f'Hello, {escape(name)}!'

@app.route("/openweathermap") 
def openweathermap():
  lat= 55.742091 
  lon = 12.476778
  lat = 55.729817
  lng = 12.4615



  #owmAddress = requests.get("https://api.openrouteservice.org/v2/directions/driving-car?api_key=5b3ce3597851110001cf62480bce1c9f6f5041d0ae79d1a8847f8b98&start="+lon+","+lat+"&end="+lon2+","+lat2)

  #print(owmAddress)

  #return Response(owmAddress, content_type=’application/json; charset=UTF-8’)

#openweathermap()