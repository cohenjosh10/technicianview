import React, { useRef, useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import {toast} from 'react-toastify';
import haversine from 'haversine-distance';
import 'react-toastify/dist/ReactToastify.css';

import mapboxgl from 'mapbox-gl/dist/mapbox-gl-csp';
import MapboxWorker from 'worker-loader!mapbox-gl/dist/mapbox-gl-csp-worker';

mapboxgl.workerClass = MapboxWorker;
mapboxgl.accessToken = 'pk.eyJ1IjoiY29oZW5qb3NoMTAiLCJhIjoiY2tvODM3cHViMWh5MDJ3bWxlODR5OHJwbyJ9.OsP4XQxhznEl3LkexbZyNg';
const GREENTOWN_LABS_LNG = -71.102768;
const GREENTOWN_LABS_LAT = 42.381729;
const SERVER_REFRESH_MS = 1000;
const CLOSE_PROXIMITY_M = 304.8

const TECHNICIANS_API = 'http://127.0.0.1:5000/api/v1/solar_farms/abc123/technicians';
const APPLICATION_START_TIME_MS = new Date().getTime();
const MOCK_DATA_START_TIME_S = 1592078400;
const MOCK_DATA_SIMULATION_SPEED = 20;
const MS_IN_S = 1000;

const mTechnicianData = {};
const mMarkers = {};
var mMap;
const mCloseTechnicianPairs = new Set();

toast.configure();

const getMockedTime = () => {
  return MOCK_DATA_START_TIME_S + Math.round((new Date().getTime() - APPLICATION_START_TIME_MS) / MS_IN_S) * MOCK_DATA_SIMULATION_SPEED;
}

const Map = () => {
  const mapContainer = useRef();
  const [tsecs, setTsecs] = useState(0);

  // Technician Fetching
  const fetchTechnicianLocation = () => {
    var mockedTime = getMockedTime();
    return fetch(TECHNICIANS_API + "/" + mockedTime)
      .then((response) => response.json())
      .then((json) => {
        parseTechnicianData(json);
      })
      .catch((error) => {
        console.error(error);
      });
    };

  const parseTechnicianData = (json) => {
    var tsecs;
    for (const tech of json.features) {
      const name = tech.properties.name;
      if (mTechnicianData[name] == null) {
        tech.properties.color = "#" + Math.floor(Math.random()*16777215).toString(16);
        mTechnicianData[name] = tech;
      } else {
        tech.properties.color = mTechnicianData[name].properties.color;
        mTechnicianData[name] = tech;
      }
      tsecs = tech.properties.tsecs;
    }
    setTsecs(tsecs);
    notifyIfTechniciansAreClose(tsecs);
    scheduleTechnicianFetch();
  }

  const scheduleTechnicianFetch = () => {
    setTimeout(() => {
      fetchTechnicianLocation();
    }, SERVER_REFRESH_MS);
  }

  const notifyIfTechniciansAreClose = (tsecs) => {
    const technicianPairs = generateTechnicianPairs();
    for (const technicianPair of technicianPairs) {
      const id = getTechnicianPairUniqueId(technicianPair);
      const technicianOne = technicianPair[0];
      const technicianTwo = technicianPair[1];
      const technicianOneCoords = { 'latitude' : technicianOne.geometry.coordinates[1], 'longitude' : technicianOne.geometry.coordinates[0] }
      const technicianTwoCoords = { 'latitude' : technicianTwo.geometry.coordinates[1], 'longitude' : technicianTwo.geometry.coordinates[0] }

      if (haversine(technicianOneCoords, technicianTwoCoords) < CLOSE_PROXIMITY_M) {
        if (!mCloseTechnicianPairs.has(id)) {
          toast('[ALERT] ' + technicianOne.properties.name + ' is within 1000 feet of ' + technicianTwo.properties.name + '!');
          mCloseTechnicianPairs.add(id);
        } 
      } else {
        if (mCloseTechnicianPairs.has(id)) {
          mCloseTechnicianPairs.add(id);
        }
      }
    }
  }

  const generateTechnicianPairs = () => {
    const technicians = Object.values(mTechnicianData);
    const technicianPairs = [];
    for (var i = 0; i < technicians.length; i++) {
      for (var j = i+1; j < technicians.length; j++) {
        technicianPairs.push([technicians[i], technicians[j]]);
      }
    }
    return technicianPairs;
  }

  const getTechnicianPairUniqueId = (technicianPair) => {
    return technicianPair[0].properties.name + technicianPair[1].properties.name;
  }

  fetchTechnicianLocation();


  useEffect(() => {
    const techs = Object.values(mTechnicianData);

    // Calculate a screen center to be the average of the existing technicians. 
    // If no technicians are provided, set screen center to the Greentown Labs
    var latSum = 0;
    var lngSum = 0;
    for (const tech of techs) {
      lngSum += tech.geometry.coordinates[0];
      latSum += tech.geometry.coordinates[1];
    }
    const centerLng = techs.length > 0 ? lngSum / techs.length : GREENTOWN_LABS_LNG;
    const centerLat = techs.length > 0 ? latSum / techs.length : GREENTOWN_LABS_LAT;

    // Render the map
    if (mMap == null) {
      mMap = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [centerLng, centerLat],
        zoom: 12
      });
    } else {
      mMap.setCenter([centerLng, centerLat]);
    }

    // Render the map markers
    for (const tech of techs) {
      var name = tech.properties.name;
      if (mMarkers[name] == null) {
        mMarkers[name] = new mapboxgl.Marker({color: tech.properties.color})
          .setLngLat([tech.geometry.coordinates[0], tech.geometry.coordinates[1]])
          .setPopup(new mapboxgl.Popup().setText(tech.properties.name))
          .setRotation(tech.properties.bearing)
          .addTo(mMap);
      } else {
        mMarkers[name]
          .setLngLat([tech.geometry.coordinates[0], tech.geometry.coordinates[1]])
          .setPopup(new mapboxgl.Popup().setText(tech.properties.name))
          .setRotation(tech.properties.bearing)
          .addTo(mMap);
      }   
    }
  }, [tsecs]);

  return (
    <div>
      <div className="map-container" ref={mapContainer} />
    </div>
  );
};

ReactDOM.render(<Map />, document.getElementById('app'));
