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
Súbor: Home.jsx
Hlavný komponent obsahujúci hlavnú mapu, ovládací panel, koncový bod Icecastu a varovný systém
 */

import { useEffect, useRef, useState, useCallback } from 'react'; // Importuje hooky z Reactu
import MapComponent from './MapComponent'; // Importuje komponent MapComponent
import MapControlPanel from './MapControlPanel.jsx'; // Importuje komponent MapControlPanel
import '../styles/Home.css'; // Importuje štýly pre Home komponent
import Typography from '@mui/material/Typography'; // Importuje komponent Typography z Material-UI
import Zone from "./Zone.jsx"; // Importuje komponent Zone
import Heatmap from "./Heatmap.jsx"; // Importuje komponent Heatmap
import { checkForBreaches, getAircraftData, getDroneData, checkDroneProximityToBreach } from "./ProcessData.jsx"; // Importuje funkcie na spracovanie dát
import BreachStatusComponent from "./BreachStatusComponent.jsx"; // Importuje komponent BreachStatusComponent
import IcecastPlayer from "./IcecastPlayer.jsx"; // Importuje komponent IcecastPlayer
import { calculateDistance } from "./Utils.jsx"; // Importuje funkciu calculateDistance
import { ControlPanelBounds } from "./StaticSettings.jsx"; // Importuje nastavenia Bounds
import PropTypes from 'prop-types'; // Importuje PropTypes pre validáciu typov props

const Home = () => {
    const [mapSettings, setMapSettings] = useState({
        flightRange: 25, // Polomer letovej zóny v metroch
        warningOverhead: 3, // Polomer prídavnej varovnej zóny v kilometroch
        altitude: 30, // Výška zóny v metroch
        duration: 15, // Predikčná doba v minútach
        showLabels: true, // Flag na vypnutie zapnutie štítkov pri lietadlách
        updateZoneCenter: false, // Flag na update stredu zóny
        centerOnDrone: false, // Flag na centrovanie mapy na dron
        resolution: 1000, // Rozlíšenie mapy výskytu prevádzky v 1/x stupňoch
        excludeAirport: true, // Flag na zahrnutie letiska do gradientu
        heatmapOpacity: 0.6 // Prehľadnosť mapy výskytu prevádzky
    }); // Definuje stavy pre nastavenia mapy

    const [aircraftData, setAircraftData] = useState([]); // Definuje stav pre dáta lietadiel
    const [droneData, setDroneData] = useState(null); // Definuje stav pre dáta dronu
    const [zoneData, setZoneData] = useState({}); // Definuje stav pre dáta zóny
    const [breachData, setBreachData] = useState([]); // Definuje stav pre dáta narušení
    const [proximityWarning, setProximityWarning] = useState(null); // Definuje stav pre varovania o blízkosti narušenia

    const mapInstance = useRef(null); // Referencia na inštanciu mapy

    // Wrapper na získanie dát o lietadlách a dronoch
    const getAircraftDataWrapper = useCallback(async () => {
        const aircraft = await getAircraftData(); // Načíta dáta lietadiel
        const drone = await getDroneData(); // Načíta dáta dronu
        if (aircraft) {
            setAircraftData(aircraft); // Nastaví stav s prijatými dátami
        }
        if (drone) {
            setDroneData(drone); // Nastaví stav s prijatými dátami dronu
        }
    }, []);

    // Wrapper na kontrolu narušení
    const checkForBreachesWrapper = useCallback(async () => {
        if (zoneData && zoneData.lat && zoneData.lng) {
            const breaches = await checkForBreaches(mapSettings, zoneData); // Načíta dáta narušení
            setBreachData(breaches); // Nastaví stav s prijatými dátami
        }
    }, [mapSettings, zoneData]);

    // Hook na inicializáciu a aktualizáciu dát lietadiel a dronov
    useEffect(() => {
        getAircraftDataWrapper();
        const intervalId = setInterval(getAircraftDataWrapper, 3000); // Nastaví interval na načítanie dát každé 3 sekundy

        return () => {
            clearInterval(intervalId); // Vyčistí interval pri unmountingu komponentu
            const mapInstanceRef = mapInstance.current;
            if (mapInstanceRef) {
                mapInstanceRef.remove(); // Odstráni mapu
            }
        };
    }, [getAircraftDataWrapper]);

    // Hook na kontrolu narušení
    useEffect(() => {
        const intervalId = setInterval(checkForBreachesWrapper, 5000); // Nastaví interval na kontrolu narušení každých 5 sekúnd

        return () => {
            clearInterval(intervalId); // Vyčistí interval pri unmountingu komponentu
        };
    }, [checkForBreachesWrapper]);

    // Hook na aktualizáciu zóny a varovaní pri zmene dát dronu
    useEffect(() => {
        if (droneData && droneData.latitude && droneData.longitude) {
            // Nastaví zónu na dron, ak nie je nastavená
            if (!zoneData.lat && !zoneData.lng) {
                setZoneData({ lat: droneData.latitude, lng: droneData.longitude });
            } else {
                const distance = calculateDistance(zoneData.lat, zoneData.lng, droneData.latitude, droneData.longitude) + 10;
                const currentRange = mapSettings.flightRange;
                const upperRangeBound = ControlPanelBounds['flightRangeBounds'][1];
                if (distance > currentRange || (distance < upperRangeBound && currentRange > upperRangeBound)) {
                    const newRange = distance < upperRangeBound ? upperRangeBound : distance;
                    setMapSettings(prevSettings => ({ ...prevSettings, flightRange: newRange }));
                }
            }

            // Aktualizuje nadmorskú výšku, ak je vyššia ako aktuálne nastavená
            if (droneData.altitude > mapSettings.altitude) {
                setMapSettings(prevSettings => ({
                    ...prevSettings,
                    altitude: droneData.altitude
                }));
            }

            // Kontrola a aktualizácia varovaní o blízkosti narušenia
            if (zoneData && droneData && breachData) {
                const proximityWarnings = checkDroneProximityToBreach(breachData, droneData.altitude);
                if (proximityWarnings.length > 0) {
                    setProximityWarning(proximityWarnings[0]); // Uloží najurgentnejšie varovanie
                } else {
                    setProximityWarning(null);
                }
            }
        }
    }, [breachData, droneData, zoneData, mapSettings.flightRange, mapSettings.altitude]);

    // Hook na aktualizáciu stredu zóny pri zmene nastavenia updateZoneCenter
    useEffect(() => {
        if (mapSettings.updateZoneCenter && droneData && droneData.latitude && droneData.longitude) {
            setZoneData({ lat: droneData.latitude, lng: droneData.longitude });
            // Resetuje flag na zamedzenie opakovaným aktualizáciám
            setMapSettings(prev => ({ ...prev, updateZoneCenter: false }));
        }
    }, [mapSettings.updateZoneCenter, droneData]);

    // Komponent na zobrazenie varovného upozornenia
    const WarningAlert = ({ warning }) => {
        if (!warning) return null;

        return (
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', backgroundColor: 'red', color: 'white', padding: '20px', zIndex: 1000 }}>
                <h2>{warning.message}</h2>
            </div>
        );
    };

    // Pridanie validácie propozícií pre WarningAlert komponent
    WarningAlert.propTypes = {
        warning: PropTypes.shape({
            message: PropTypes.string.isRequired
        })
    };

    return (
        // Hlavný kontajner pre celú komponentu Home
        <div className="home-container">
            {/* Kontajner pre hlavičku */}
            <div className="header-container">
                {/* Ľavá časť hlavičky obsahujúca BreachStatusComponent */}
                <div className="header-item left">
                    <BreachStatusComponent breaches={breachData} />
                </div>
                {/* Stredná časť hlavičky obsahujúca názov mapy */}
                <div className="header-item">
                    <Typography variant="h4" component="h4">
                        AeroGuardian Map
                    </Typography>
                </div>
                {/* Pravá časť hlavičky obsahujúca IcecastPlayer */}
                <div className="header-item right">
                    <IcecastPlayer />
                </div>
            </div>
            {/* Komponent MapComponent pre zobrazenie mapy */}
            <MapComponent
                settings={mapSettings} // Nastavenia mapy
                mapInstance={mapInstance} // Inštancia mapy
                aircraftData={aircraftData} // Dáta lietadiel
                droneData={droneData} // Dáta dronu
            />
            {/* Komponent MapControlPanel pre ovládanie mapy */}
            <MapControlPanel
                mapSettings={mapSettings} // Nastavenia mapy
                onSettingsChange={setMapSettings} // Funkcia na zmenu nastavení mapy
            />
            {/* Komponent Heatmap pre zobrazenie mapy výskytu prevádzky */}
            <Heatmap
                mapRef={mapInstance} // Referencia na mapu
                settings={mapSettings} // Nastavenia mapy
            />
            {/* Komponent Zone pre zobrazenie zóny */}
            <Zone
                mapRef={mapInstance} // Referencia na mapu
                settings={mapSettings} // Nastavenia mapy
                zoneData={zoneData} // Dáta zóny
                setZoneData={setZoneData} // Funkcia na zmenu dát zóny
            />
            {/* Komponent WarningAlert pre zobrazenie varovných upozornení */}
            <WarningAlert
                warning={proximityWarning} // Varovné upozornenie o blízkosti narušenia
            />
        </div>
    );
};

export default Home;
