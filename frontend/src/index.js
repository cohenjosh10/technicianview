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
const SERVER_REFRESH_MS = 500;
const CLOSE_PROXIMITY_M = 304.8

const TECHNICIANS_API = 'http://127.0.0.1:5000/api/v1/solar_farms/abc123/technicians';
const APPLICATION_START_TIME_MS = new Date().getTime();
const MOCK_DATA_START_TIME_S = 1592078400;
const MOCK_DATA_SIMULATION_SPEED = 60;
const MS_IN_S = 1000;

toast.configure();

const getMockedTime = () => {
  return MOCK_DATA_START_TIME_S + Math.round((new Date().getTime() - APPLICATION_START_TIME_MS) / MS_IN_S) * MOCK_DATA_SIMULATION_SPEED;
}

const Map = () => {
  const mapContainer = useRef();

  const [tsecs, setTsecs] = useState(0);
  const [technicianData, setTechnicianData] = useState({});
  const [markers, setMarkers] = useState({});
  const [map, setMap] = useState(null);
  const [closeTechnicianPairs, setCloseTechnicianPairs] = useState(new Set());

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
      if (technicianData[name] == null) {
        tech.properties.color = "#" + Math.floor(Math.random()*16777215).toString(16);
        technicianData[name] = tech;
      } else {
        tech.properties.color = technicianData[name].properties.color;
        technicianData[name] = tech;
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
        if (!closeTechnicianPairs.has(id)) {
          toast('[ALERT] ' + technicianOne.properties.name + ' is within 1000 feet of ' + technicianTwo.properties.name + '!');
          closeTechnicianPairs.add(id);
        } 
      } else {
        if (closeTechnicianPairs.has(id)) {
          closeTechnicianPairs.add(id);
        }
      }
    }
  }

  const generateTechnicianPairs = () => {
    const technicians = Object.values(technicianData);
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
    const techs = Object.values(technicianData);

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
    if (map == null) {
      setMap(new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [centerLng, centerLat],
        zoom: 12
      }));
    } else {
      map.setCenter([centerLng, centerLat]);
    }

    // Render the map markers
    for (const tech of techs) {
      var name = tech.properties.name;
      if (markers[name] == null) {
        markers[name] = new mapboxgl.Marker({color: tech.properties.color})
          .setLngLat([tech.geometry.coordinates[0], tech.geometry.coordinates[1]])
          .setPopup(new mapboxgl.Popup().setText(tech.properties.name))
          .setRotation(tech.properties.bearing)
          .addTo(map);
      } else {
        markers[name]
          .setLngLat([tech.geometry.coordinates[0], tech.geometry.coordinates[1]])
          .setPopup(new mapboxgl.Popup().setText(tech.properties.name))
          .setRotation(tech.properties.bearing)
          .addTo(map);
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
