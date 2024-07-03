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
Súbor: AircraftMarkers.jsx
Komponent na pridávanie získaných dát o lietadlách do mapy
 */

import L from 'leaflet'; // Importovanie knižnice Leaflet pre mapové funkcionality
import '../leaflet/leaflet.css'; // Importovanie CSS súboru Leaflet pre štýlovanie máp
import '../leaflet.rotatedmarker/leaflet.rotatedMarker.js'; // Importujte plugin pre rotáciu markerov v Leaflet

// Definícia funkcie na vytváranie štítku pri ikone lietadla
const createLabelIcon = (labelClass, labelText) => {
    return L.divIcon({
        className: labelClass, // Uistite sa, že táto trieda má viditeľné štýlovanie v CSS
        html: labelText,
        iconSize: [null, null], // Veľkosť je určená obsahom, uistite sa, že je dostatočná na zobrazenie textu
        iconAnchor: [-5, -5] // Upraviť podľa potreby na správne umiestnenie štítkov
    });
};

// Funkcia na vytvorenie ikony šípky predstavujúcej smer lietadla
const getArrowIcon = (color) => {
    const svgData = `
    <svg xmlns="http://www.w3.org/2000/svg" width="30px" height="30px" viewBox="0 0 128 128">
        <path d="M64 1L17.9 127 64 99.8l46.1 27.2L64 1zm0 20.4l32.6 89.2L64 91.3V21.4z"
            fill="${color}"
            stroke="black"
            stroke-width="5"
            stroke-linecap="round"
            stroke-linejoin="round"
        />
    </svg>`;
    return L.icon({
        iconUrl: `data:image/svg+xml,${encodeURIComponent(svgData)}`,
        iconSize: [30, 30],
        iconAnchor: [15, 15] // Týmto sa ikona centrovaná na pozícii markera
    });
};

// Funkcia na vytvorenie markera pre lietadlo na mape
const createAircraftMarker = (lat, lon, altitude, heading, speed, map, altitudeThreshold) => {
    if (!map) {
        console.error('Map instance is not available.'); // Chybové hlásenie, ak mapa nie je dostupná
        return null;
    }

    const color = determineAircraftColor(altitude, altitudeThreshold); // Určite farbu podľa nadmorskej výšky
    const arrowIcon = getArrowIcon(color);

    const labelText = `${altitude.toFixed(1)}m<br>${speed.toFixed(1)}km/h`; // Text štítku zobrazujúci nadmorskú výšku a rýchlosť

    // Vytvorte šípkový marker
    let arrowMarker = L.marker([lat, lon], {
        icon: arrowIcon,
        rotationAngle: heading,
        zIndexOffset: 300  // Vyšší index, šípky nad štítkami
    }).addTo(map);

    // Vytvorte štítkový marker
    let labelMarker = L.marker([lat, lon], {
        icon: createLabelIcon('label-icon', labelText),
        zIndexOffset: 200  // Nižší index, štítky pod šípkami
    }).addTo(map);

    return { arrow: arrowMarker, label: labelMarker }; // Vráťte oba markery ako objekt
};

// Funkcia na určenie farby markera lietadla podľa nadmorskej výšky
const determineAircraftColor = (altitude, altitudeThreshold) => {
    const maxAltitude = altitudeThreshold + 2000;
    let red, green; // Uistite sa, že obidve sú inicializované na 0

    if (altitude < altitudeThreshold) {
        red = 255; // Pod prahom - červená
        green = 0;
    } else if (altitude > maxAltitude) {
        green = 255; // Nad maxAltitude - zelená
        red = 0;
    } else {
        // Lineárna interpolácia medzi prahmi
        const ratio = (altitude - altitudeThreshold) / (2000); // Zjednodušené
        red = Math.round(255 * (1 - ratio));
        green = Math.round(255 * ratio);
    }

    // Konvertovať hodnoty RGB na hexadecimálny reťazec
    const redHex = red.toString(16).padStart(2, '0');
    const greenHex = green.toString(16).padStart(2, '0');
    return `#${redHex}${greenHex}00`; // Vráťte farbu v hex formáte
};

export const addAircraftMarkers = (aircraftData, markersRef, mapInstance, altitude, showLabels) => {
    // Najprv odstráňte existujúce markery
    markersRef.current.forEach(marker => {
        mapInstance.current.removeLayer(marker.arrow);
        if (marker.label) {
            mapInstance.current.removeLayer(marker.label);
        }
    });
    markersRef.current = []; // Vyčistite ref pole po odstránení markerov

    // Pridajte nové markery
    aircraftData.forEach(aircraft => {
        if (aircraft.lat && aircraft.lon) {
            const marker = createAircraftMarker(
                aircraft.lat,
                aircraft.lon,
                (Number(aircraft.alt_geom) || Number(aircraft.alt_baro) || 0) * 0.3048, // Prepočítanie výšky na m
                aircraft.track || aircraft.nav_heading || aircraft.mag_heading || 0,
                (Number(aircraft.gs) || 0) * 1.852, // Prepočítanie rýchlosti na km/h
                mapInstance.current,
                altitude
            );
            if (marker) {
                markersRef.current.push(marker); // Vždy uložiť celý objekt markera
            }
        }
    });

    updateLabelVisibility(markersRef, mapInstance, showLabels); // Aktualizovať viditeľnosť štítkov podľa nastavení
};

// Funkcia na aktualizáciu viditeľnosti štítkov podľa používateľských nastavení
const updateLabelVisibility = (markersRef, mapInstance, showLabels) => {
    markersRef.current.forEach(marker => {
        if (showLabels) {
            marker.label.addTo(mapInstance.current); // Zobraziť štítok, ak je nastavenie povolené
        } else {
            mapInstance.current.removeLayer(marker.label); // Skryť štítok, ak je nastavenie zakázané
        }
    });
};
