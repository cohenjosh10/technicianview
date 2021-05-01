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
## Test behavior of api '/api/v1/solar_farms/1/technicians',    ##
## assuming this api is returning snapshots based on mocked     ##
## data from doc api_technician_response_data.json              ##
##################################################################

# Test that if the current time is exactly equal to the time of our first snapshot, 
# we return the first snapshot
@mock.patch('time.time', mock.MagicMock(return_value=1592078400))
def test_snapshot_1_exact(client):
    data = json.loads(client.get('/api/v1/solar_farms/1/technicians').get_data(as_text=True))
    assert data['features'][0]['properties']['tsecs'] == 1592078400

# Test that if the current time is slightly greater than the time of our first
# snapshot, we return the first snapshot
@mock.patch('time.time', mock.MagicMock(return_value=1592078401))
def test_snapshot_1_past(client):
    data = json.loads(client.get('/api/v1/solar_farms/1/technicians').get_data(as_text=True))
    assert data['features'][0]['properties']['tsecs'] == 1592078400

# Test that if the current time is just before the time of our second snapshot, 
# we return the first snapshot.
@mock.patch('time.time', mock.MagicMock(return_value=1592078459))
def test_snapshot_1_far_past(client):
    data = json.loads(client.get('/api/v1/solar_farms/1/technicians').get_data(as_text=True))
    assert data['features'][0]['properties']['tsecs'] == 1592078400

# Test that if the current time is exactly equal to our second snapshot, 
# we return the second snapshot.
@mock.patch('time.time', mock.MagicMock(return_value=1592078460))
def test_snapshot_2_exact(client):
    data = json.loads(client.get('/api/v1/solar_farms/1/technicians').get_data(as_text=True))
    assert data['features'][0]['properties']['tsecs'] == 1592078460

# Test that if the current time is exactly equal to our fifth snapshot, 
# we return the fifth snapshot.
@mock.patch('time.time', mock.MagicMock(return_value=1592078640))
def test_snapshot_5_exact(client):
    data = json.loads(client.get('/api/v1/solar_farms/1/technicians').get_data(as_text=True))
    assert data['features'][0]['properties']['tsecs'] == 1592078640

# Test that if the current time is far past our last snapshot, we return 
# the last snapshot
@mock.patch('time.time', mock.MagicMock(return_value=1599078460))
def test_far_future(client):
    data = json.loads(client.get('/api/v1/solar_farms/1/technicians').get_data(as_text=True))
    assert data['features'][0]['properties']['tsecs'] == 1592079360

# Test that if the current time is before our earliest snapshot, we return
# a 400.
@mock.patch('time.time', mock.MagicMock(return_value=555))
def test_far_past(client):
    response = client.get('/api/v1/solar_farms/1/technicians')
    assert response.status_code == 400
