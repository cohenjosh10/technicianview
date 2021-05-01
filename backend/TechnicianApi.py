from flask import Flask
app = Flask(__name__)
 
# Test Routing Page
@app.route('/')
def index():
  return 'Index Page'

@app.route('/api/v1/solar_farms/<solar_farm_id>/technicians',
        methods=['GET'])
def technician_location(solar_farm_id):
  return 'Received request for farm with id ' + solar_farm_id
