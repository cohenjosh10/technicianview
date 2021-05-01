import os
import tempfile

import pytest
import unittest
import json
import time

from TechnicianApi import app
from unittest import mock

# Initialize test client
@pytest.fixture
def client():
    db_fd, app.config['DATABASE'] = tempfile.mkstemp()
    app.config['TESTING'] = True

    with app.test_client() as client:
        yield client

    os.close(db_fd)
    os.unlink(app.config['DATABASE'])


##################################################################
## Test behavior of api                                         ##
## '/api/v1/solar_farms/<solar_farm_id>/technicians',           ##
## assuming this api is returning snapshots based on mocked     ##
## data from doc api_technician_response_data.json              ##
##################################################################

# Test that if the current time is exactly equal to the time of our first snapshot, 
# we return the first snapshot
@mock.patch('time.time', mock.MagicMock(return_value=1592078400))
def testGetTechnicianLocation_whenCurrentTimeIsSnapshot1_expectSnapshot1(client):
    data = json.loads(client.get('/api/v1/solar_farms/1/technicians').get_data(as_text=True))
    assert data['features'][0]['properties']['tsecs'] == 1592078400

# Test that if the current time is slightly greater than the time of our first
# snapshot, we return the first snapshot
@mock.patch('time.time', mock.MagicMock(return_value=1592078401))
def testGetTechnicianLocation_whenCurrentTimePastSnapshot1_expectSnapshot1(client):
    data = json.loads(client.get('/api/v1/solar_farms/1/technicians').get_data(as_text=True))
    assert data['features'][0]['properties']['tsecs'] == 1592078400

# Test that if the current time is just before the time of our second snapshot, 
# we return the first snapshot.
@mock.patch('time.time', mock.MagicMock(return_value=1592078459))
def testGetTechnicianLocation_whenCurrentTimeBeforeSnapshot2_expectSnapshot1(client):
    data = json.loads(client.get('/api/v1/solar_farms/1/technicians').get_data(as_text=True))
    assert data['features'][0]['properties']['tsecs'] == 1592078400

# Test that if the current time is exactly equal to our second snapshot, 
# we return the second snapshot.
@mock.patch('time.time', mock.MagicMock(return_value=1592078460))
def testGetTechnicianLocation_whenCurrentTimeIsSnapshot2_expectSnapshot2(client):
    data = json.loads(client.get('/api/v1/solar_farms/1/technicians').get_data(as_text=True))
    assert data['features'][0]['properties']['tsecs'] == 1592078460

# Test that if the current time is exactly equal to our fifth snapshot, 
# we return the fifth snapshot.
@mock.patch('time.time', mock.MagicMock(return_value=1592078640))
def testGetTechnicianLocation_whenCurrentTimeIsSnapshot5_expectSnapshot5(client):
    data = json.loads(client.get('/api/v1/solar_farms/1/technicians').get_data(as_text=True))
    assert data['features'][0]['properties']['tsecs'] == 1592078640

# Test that if the current time is far past our last snapshot, we return 
# the last snapshot
@mock.patch('time.time', mock.MagicMock(return_value=1599078460))
def testGetTechnicianLocation_whenCurrentTimePassedSnapshot16_expectSnapshot16(client):
    data = json.loads(client.get('/api/v1/solar_farms/1/technicians').get_data(as_text=True))
    assert data['features'][0]['properties']['tsecs'] == 1592079360

# Test that if the current time is before our earliest snapshot, we return
# a 400.
@mock.patch('time.time', mock.MagicMock(return_value=555))
def testGetTechnicianLocation_whenCurrentTimeBeforeSnapshot1_expect400(client):
    response = client.get('/api/v1/solar_farms/1/technicians')
    assert response.status_code == 400


##################################################################
## Test behavior of api                                         ##
## '/api/v1/solar_farms/<solar_farm_id>/technicians/<timestamp> ##
## assuming this api is returning snapshots based on mocked     ##
## data from doc api_technician_response_data.json              ##
##################################################################

# Test that if the time passed is exactly equal to the time of our first snapshot, 
# we return the first snapshot
def testGetTechnicianLocationAtTime_whenTimeIsSnapshot1_expectSnapshot1(client):
    data = json.loads(client.get('/api/v1/solar_farms/1/technicians/1592078400').get_data(as_text=True))
    assert data['features'][0]['properties']['tsecs'] == 1592078400

# Test that if the time passed is slightly greater than the time of our first
# snapshot, we return the first snapshot
def testGetTechnicianLocationAtTime_whenTimeAfterSnapshot1_expectSnapshot1(client):
    data = json.loads(client.get('/api/v1/solar_farms/1/technicians/1592078401').get_data(as_text=True))
    assert data['features'][0]['properties']['tsecs'] == 1592078400

# Test that if the time passed is just before the time of our second snapshot, 
# we return the first snapshot.
def testGetTechnicianLocationAtTime_whenTimeBeforeSnapshot2_expectSnapshot1(client):
    data = json.loads(client.get('/api/v1/solar_farms/1/technicians/1592078459').get_data(as_text=True))
    assert data['features'][0]['properties']['tsecs'] == 1592078400

# Test that if the time passed is exactly equal to our second snapshot, 
# we return the second snapshot.
def testGetTechnicianLocationAtTime_whenTimeIsSnapshot2_expectSnapshot2(client):
    data = json.loads(client.get('/api/v1/solar_farms/1/technicians/1592078460').get_data(as_text=True))
    assert data['features'][0]['properties']['tsecs'] == 1592078460

# Test that if the time passed is exactly equal to our fifth snapshot, 
# we return the fifth snapshot.
def testGetTechnicianLocationAtTime_whenTimeIsSnapshot5_expectSnapshot5(client):
    data = json.loads(client.get('/api/v1/solar_farms/1/technicians/1592078640').get_data(as_text=True))
    assert data['features'][0]['properties']['tsecs'] == 1592078640

# Test that if the time passed is far past our last snapshot, we return 
# the last snapshot
def testGetTechnicianLocationAtTime_whenTimeAfterSnapshot16_expectSnapshot16(client):
    data = json.loads(client.get('/api/v1/solar_farms/1/technicians/1599078460').get_data(as_text=True))
    assert data['features'][0]['properties']['tsecs'] == 1592079360

# Test that if the time passed is before our earliest snapshot, we return
# a 400.
def testGetTechnicianLocationAtTime_whenTimeBeforeSnapshot1_expect400(client):
    response = client.get('/api/v1/solar_farms/1/technicians/555')
    assert response.status_code == 400
