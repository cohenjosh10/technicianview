# TechnicianView

TechnicianView is a webp-app to display realtime data on technician location on
a solar farm.

## Setup Instructions

### Run Webserver Locally
1. Navigate to directory /backend
2. Execute command ./run.sh
3. Test the webserver in a browser by entering the following url in a browser:
   "http://127.0.0.1:5000/api/v1/solar_farms/abc123/technicians"

### Run Webapp Locally
1. Navigate to directory /frontend
2. Execute command npm start
3. Observe that a browser opens with title "Technician View Demo" and displays 
   technicians moving on a grid.

### Test Endpoints
1. Navigate to directory /backend
2. Execute command ./run_tests.sh

### Deploy
1. Follow instructions at https://flask.palletsprojects.com/en/0.12.x/deploying/#deployment to run flask in
   production with a service of your choice.
2. Follow instructions at https://create-react-app.dev/docs/deployment/ to
   deploy your react application with a service of your choice.
