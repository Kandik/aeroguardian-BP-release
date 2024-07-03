/*
Technická univerzita v Košiciach
Fakulta elektrotechniky a informatiky
Katedra kybernetiky a umelej inteligencie

Zvyšovanie bezpečnosti integrácie dronov do leteckého priestoru - Bakalárska práca

Autor:
Štefan Kando

Vedúci práce:
doc. Ing. Peter Papcun, PhD.

2024
 */

/*
Súbor: MapComponent.jsx
Kontajner pre hlavnú mapu aplikácie, zobrazujúcu zachytené lietadlá a polohu dronu
 */

import { useEffect, useRef } from 'react'; // Importuje hooky z Reactu
import L from 'leaflet'; // Importuje knižnicu Leaflet pre mapové funkcionality
import 'leaflet/dist/leaflet.css'; // Importuje štýly pre Leaflet
import PropTypes from 'prop-types'; // Importuje PropTypes pre validáciu typov props
import { addAircraftMarkers } from "./AircraftMarkers.jsx"; // Importuje funkciu na pridávanie markerov lietadiel
import { updateDroneMarker } from "./Drone.jsx"; // Importuje funkciu na aktualizáciu markeru dronu
import { DefaultMapSettings } from "./StaticSettings.jsx"; // Importuje predvolené nastavenia mapy

// Komponent MapComponent
const MapComponent = ({ settings, mapInstance, aircraftData, droneData }) => {
    const mapContainerRef = useRef(null); // Referencia na kontajner mapy
    const aircraftMarkersRef = useRef([]); // Referencia na markery lietadiel
    const droneMarkerRef = useRef(null); // Referencia na marker dronu

    // Hook na inicializáciu mapy
    useEffect(() => {
        mapInstance.current = L.map(mapContainerRef.current, DefaultMapSettings);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(mapInstance.current);

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Prázdne závislostné pole, inicializuje sa len raz

    // Hook na pridávanie markerov lietadiel
    useEffect(() => {
        if (aircraftData && aircraftData.length > 0) {
            addAircraftMarkers(aircraftData, aircraftMarkersRef, mapInstance, settings.altitude, settings.showLabels);
        }
    }, [aircraftData, settings.altitude, settings.showLabels]); // Znovu spustiť len pri zmene aircraftData alebo nastavení

    // Hook na aktualizáciu markeru dronu
    useEffect(() => {
        if (droneData && droneData.latitude && droneData.longitude) {
            updateDroneMarker(droneData, droneMarkerRef, mapInstance);
        }
    }, [droneData]);

    // Hook na centrovanie mapy na dron
    useEffect(() => {
        if (settings.centerOnDrone && droneData && droneData.latitude && droneData.longitude) {
            mapInstance.current.panTo(new L.LatLng(droneData.latitude, droneData.longitude));
        }
    }, [droneData, settings.centerOnDrone]);

    return (
        // Kontajner pre mapu
        <div ref={mapContainerRef} style={{ height: '60vh', width: '100%' }} />
    );
};

// Definícia prop typov pre komponent MapComponent
MapComponent.propTypes = {
    settings: PropTypes.shape({
        showLabels: PropTypes.bool.isRequired,
        altitude: PropTypes.number.isRequired,
        centerOnDrone: PropTypes.bool.isRequired
    }).isRequired,
    mapInstance: PropTypes.shape({
        current: PropTypes.object
    }).isRequired,
    aircraftData: PropTypes.arrayOf(PropTypes.shape({
        lat: PropTypes.number,
        lon: PropTypes.number,
        alt_geom: PropTypes.number,
        alt_baro: PropTypes.number,
        track: PropTypes.number,
        nav_heading: PropTypes.number,
        mag_heading: PropTypes.number,
        gs: PropTypes.number
    })).isRequired,
    droneData: PropTypes.shape({
        latitude: PropTypes.number.isRequired,
        longitude: PropTypes.number.isRequired,
        altitude: PropTypes.number.isRequired
    })
};

export default MapComponent; // Exportuje komponent MapComponent ako predvolený export
