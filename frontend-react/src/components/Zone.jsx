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
Súbor: Zone.jsx
Komponent fungovania letovej a varovnej zóny
 */

import { useEffect, useState } from 'react'; // Import hookov useEffect a useState z Reactu
import L from 'leaflet'; // Import knižnice Leaflet na prácu s mapami
import PropTypes from 'prop-types'; // Import PropTypes na validáciu typov props

// Komponent Zone, ktorý spravuje zónu letu a varovnú zónu na mape
const Zone = ({ mapRef, settings, zoneData, setZoneData }) => {
    const [flightZoneCircle, setFlightZoneCircle] = useState(null); // Stav pre objekt kruhu letovej zóny
    const [warningZoneCircle, setWarningZoneCircle] = useState(null); // Stav pre objekt kruhu varovnej zóny

    // Funkcia na odstránenie zón z mapy
    const clearZones = () => {
        if (flightZoneCircle) {
            flightZoneCircle.remove(); // Odstráni letovú zónu z mapy
        }
        if (warningZoneCircle) {
            warningZoneCircle.remove(); // Odstráni varovnú zónu z mapy
        }
    };

    // Funkcia na nastavenie stredu zóny a vytvorenie kruhov na mape
    const setZoneCenter = (map, center) => {
        clearZones(); // Odstráni existujúce zóny

        // Vytvorí nový kruh varovnej zóny
        const newWarningZoneCircle = L.circle(center, {
            color: 'blue', // modrý outline
            fillColor: '#fc0', // žlté vnútro
            fillOpacity: 0.5, // priehľadnosť
            radius: 0
        }).addTo(map);

        // Vytvorí nový kruh letovej zóny
        const newFlightZoneCircle = L.circle(center, {
            color: 'blue', // modrý outline
            fillColor: '#f03', // žlté vnútro
            fillOpacity: 0.5, // priehľadnosť
            radius: 0,
            zIndexOffset: 1000 // letová zóna pred varovnou
        }).addTo(map);

        setFlightZoneCircle(newFlightZoneCircle); // Nastaví letovú zónu do stavu
        setWarningZoneCircle(newWarningZoneCircle); // Nastaví varovnú zónu do stavu

        setZoneData(center); // Aktualizuje zónu v nadradenom komponente
    };

    // Hook na inicializáciu zón a pridanie event listenera na kliknutie
    useEffect(() => {
        if (!mapRef.current) return; // Uistí sa, že referencia na mapu existuje

        const map = mapRef.current; // Získa inštanciu mapy

        // Funkcia na spracovanie kliknutia na mapu
        const onClick = (e) => {
            setZoneCenter(map, e.latlng); // Nastaví stred zóny na miesto kliknutia
        };

        // Pridá listener na kliknutie na mapu
        map.on('click', onClick);

        // Cleanup funkcia na odstránenie listenera a zón pri unmountingu komponentu
        return () => {
            map.off('click', onClick); // Odstráni listener na kliknutie
            if (flightZoneCircle) {
                flightZoneCircle.remove(); // Odstráni letovú zónu z mapy
            }
            if (warningZoneCircle) {
                warningZoneCircle.remove(); // Odstráni varovnú zónu z mapy
            }
        };
    }, [mapRef, flightZoneCircle, warningZoneCircle]); // Znovu spustí hook, keď sa zmenia závislosti

    // Hook na aktualizáciu zón pri zmene zoneData
    useEffect(() => {
        if (!mapRef.current) return; // Uistí sa, že referencia na mapu existuje
        const map = mapRef.current;
        if (zoneData && zoneData.lat && zoneData.lng) {
            setZoneCenter(map, zoneData); // Nastaví stred zóny na nové dáta
        }
    }, [zoneData]); // Znovu spustí hook, keď sa zmení zoneData

    // Hook na aktualizáciu polomerov zón pri zmene nastavení
    useEffect(() => {
        if (flightZoneCircle && settings.flightRange) {
            flightZoneCircle.setRadius(Number(settings.flightRange)); // Aktualizuje polomer letovej zóny
        }
        if (warningZoneCircle && settings.flightRange && settings.warningOverhead) {
            warningZoneCircle.setRadius(Number(settings.flightRange) + settings.warningOverhead * 2000); // Aktualizuje polomer varovnej zóny
        }
    }, [mapRef, settings.flightRange, settings.warningOverhead, flightZoneCircle, warningZoneCircle]); // Znovu spustí hook, keď sa zmenia závislosti

    return null; // Komponent nevracia žiadny JSX, len spravuje zóny na mape
};

// Definícia prop typov pre komponent Zone
Zone.propTypes = {
    mapRef: PropTypes.shape({
        current: PropTypes.object
    }).isRequired,
    settings: PropTypes.shape({
        flightRange: PropTypes.number.isRequired,
        warningOverhead: PropTypes.number.isRequired
    }).isRequired,
    zoneData: PropTypes.shape({
        lat: PropTypes.number,
        lng: PropTypes.number
    }).isRequired,
    setZoneData: PropTypes.func.isRequired
};

export default Zone;
