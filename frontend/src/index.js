import React, { useRef, useEffect, useState } from 'react';
import ReactDOM from 'react-dom';

import mapboxgl from 'mapbox-gl/dist/mapbox-gl-csp';
import MapboxWorker from 'worker-loader!mapbox-gl/dist/mapbox-gl-csp-worker';

mapboxgl.workerClass = MapboxWorker;
mapboxgl.accessToken = 'pk.eyJ1IjoiY29oZW5qb3NoMTAiLCJhIjoiY2tvODM3cHViMWh5MDJ3bWxlODR5OHJwbyJ9.OsP4XQxhznEl3LkexbZyNg';
const TECHNICIANS_API = 'http://127.0.0.1:5000/api/v1/solar_farms/abc123/technicians';
const GREENTOWN_LABS_LNG = -71.102768;
const GREENTOWN_LABS_LAT = 42.381729;

const Map = () => {
  const mapContainer = useRef();
  const [techDict, setTechDict] = useState(null);

  // Technician Fetching
  const fetchTechnicianLocation = () => {
    return fetch(TECHNICIANS_API)
      .then((response) => response.json())
      .then((json) => {
        const newTechDict = {};
        var isNewSnapshot = false;
        for (const tech of json.features) {
          const name = tech.properties.name;
          if (techDict === null || techDict[name] === null) {
            isNewSnapshot = true;
            tech.properties.color = "#" + Math.floor(Math.random()*16777215).toString(16);
          } else {
            if (tech.properties.tsecs != techDict[name].properties.tsecs) {
              isNewSnapshot = true;
            }
            tech.properties.color = techDict[name].properties.color;
          }
          newTechDict[name] = tech;
        }
        if (isNewSnapshot) {
          setTechDict(newTechDict);
        }
      })
      .catch((error) => {
        console.error(error);
      });
    };

  useEffect(() => {
    fetchTechnicianLocation();

    const techs = techDict != null ? Object.values(techDict) : [];

    // Set screen center to the average of the existing technicians. If no
    // technicians are provided, set screen center to the Greentown Labs
    var latSum = 0;
    var lngSum = 0;
    for (const tech of techs) {
      lngSum += tech.geometry.coordinates[0];
      latSum += tech.geometry.coordinates[1];
    }
    const centerLng = techs.length > 0 ? lngSum / techs.length : GREENTOWN_LABS_LNG;
    const centerLat = techs.length > 0 ? latSum / techs.length : GREENTOWN_LABS_LAT;

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [centerLng, centerLat],
      zoom: 12
    });

    for (const tech of techs) {
      const marker = new mapboxgl.Marker({color: tech.properties.color})
        .setLngLat([tech.geometry.coordinates[0], tech.geometry.coordinates[1]])
        .setPopup(new mapboxgl.Popup().setText(tech.properties.name))
        .setRotation(tech.properties.bearing)
        .addTo(map);
    }

    return () => map.remove();
  });

  return (
    <div>
      <div className="map-container" ref={mapContainer} />
    </div>
  );
};

ReactDOM.render(<Map />, document.getElementById('app'));
