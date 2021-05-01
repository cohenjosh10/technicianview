from flask import Flask, abort
import json
import time

app = Flask(__name__)

# Read in mocked data from provided json file. Note that this code
# makes strict assumptions about the mock data input:
#   1. Json data contains a list of time snapshots, each with a 
#      list of three technicians. 
#   2. Snapshots are listed in ascending order.
#   3. Each technician contains a type, a properties dict, and a geometry dict. 
#   4. The properties dict contains an "id" corresponding to the snapshot id,
#      a "name" corresponding to the technician's name, a timestamp "tsecs"
#      corresponding to the current epoch seconds, and a bearing. In a given
#      snapshot, each technician has the same timestamp. 
#   5. The geometry dict contains a "type" and a "coordinates" array.
#
# Additional engineering work is required to make mock data parsing more
# flexible to support various json inputs.
with open('./api_technician_response_data.json') as f:
    mocked_technician_snapshots = json.load(f)
    mocked_technician_snapshots_by_ts = {}
    mocked_ts_list = []
    for snapshot in mocked_technician_snapshots:
      ts = snapshot['features'][0]['properties']['tsecs']
      mocked_technician_snapshots_by_ts[ts] = snapshot
      mocked_ts_list.append(ts)

# Helper function to provide the most recent ts for which we have 
# a technician snapshot, relative to the time provided.
# Currently, this function relies on mocked data.
def get_most_recent_snapshot_ts(curr_ts):
    most_recent_snapshot_ts = None
    for mocked_ts in mocked_ts_list:
        if curr_ts < mocked_ts:
            return most_recent_snapshot_ts
        most_recent_snapshot_ts  = mocked_ts
    return most_recent_snapshot_ts

 
# Test Routing Page
@app.route('/')
def index():
  return 'Index Page'

# Provides technician location at the time closest to the current time. 
@app.route('/api/v1/solar_farms/<solar_farm_id>/technicians',
        methods=['GET'])
def get_technician_location(solar_farm_id):
    ts = get_most_recent_snapshot_ts(time.time())
    if ts is None:
        abort(400)
    return mocked_technician_snapshots_by_ts[ts]

# Provides technician location at the time closest to the time provided by
# the client
@app.route('/api/v1/solar_farms/<solar_farm_id>/technicians/<timestamp>',
        methods=['GET'])
def get_technician_location_at_time(solar_farm_id, timestamp):
    ts = get_most_recent_snapshot_ts(int(timestamp))
    if ts is None:
        abort(400)
    return mocked_technician_snapshots_by_ts[ts]
