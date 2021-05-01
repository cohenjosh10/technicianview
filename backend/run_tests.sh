# Script to run tests for the TechnicianView flask application
. venv/bin/activate
export FLASK_APP=TechnicianApi.py FLASK_ENV=development
pytest
