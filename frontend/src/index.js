import React, { useRef, useEffect, useState } from 'react';
import ReactDOM from 'react-dom';

import mapboxgl from 'mapbox-gl/dist/mapbox-gl-csp';
import MapboxWorker from 'worker-loader!mapbox-gl/dist/mapbox-gl-csp-worker';

mapboxgl.workerClass = MapboxWorker;
mapboxgl.accessToken = 'pk.eyJ1IjoiY29oZW5qb3NoMTAiLCJhIjoiY2tvODM3cHViMWh5MDJ3bWxlODR5OHJwbyJ9.OsP4XQxhznEl3LkexbZyNg';
const TECHNICIANS_API = 'http://127.0.0.1:5000/api/v1/solar_farms/abc123/technicians';


const Map = () => {
  const mapContainer = useRef();

  // Technician Information
  const [techLng, setTechLng] = useState(0);
  const [techLat, setTechLat] = useState(0);
  const [techTitle, setTechTitle] = useState("");
  const [techRot, setTechRot] = useState(0);
  const [techColor, setTechColor] = useState("#" + Math.floor(Math.random()*16777215).toString(16));

  // Technician Fetching
  const fetchTechnicianLocation = () => {
    return fetch(TECHNICIANS_API)
      .then((response) => response.json())
      .then((json) => {
        const tech = json.features[0];
        setTechLng(tech.geometry.coordinates[0]);
        setTechLat(tech.geometry.coordinates[1]);
        setTechTitle(tech.properties.name);
        setTechRot(tech.properties.bearing);
      })
      .catch((error) => {
        console.error(error);
      });
    };

  useEffect(() => {
    fetchTechnicianLocation();

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [techLng, techLat],
      zoom: 9
    });

    var marker1 = new mapboxgl.Marker({color: techColor})
      .setLngLat([techLng, techLat])
      .setPopup(new mapboxgl.Popup().setText(techTitle))
      .setRotation(techRot)
      .addTo(map);

    return () => map.remove();
  });

  return (
    <div>
      <div className="map-container" ref={mapContainer} />
    </div>
  );
};

ReactDOM.render(<Map />, document.getElementById('app'));
