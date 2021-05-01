from flask import Flask
import json

app = Flask(__name__)

with open('./api_technician_response_data.json') as f:
    data = json.load(f)
 
# Test Routing Page
@app.route('/')
def index():
  return 'Index Page'

@app.route('/api/v1/solar_farms/<solar_farm_id>/technicians',
        methods=['GET'])
def technician_location(solar_farm_id):
    return json.dumps(data) + '\nSolar Farm ID: ' + solar_farm_id
