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
Súbor: Drone.jsx
Komponent na zobrazenie dronu na mape
 */

import L from 'leaflet'; // Importuje knižnicu Leaflet pre mapové funkcionality

// Funkcia na vytvorenie ikony dronu pomocou SVG
const getDroneIcon = () => {
    const svgData = `
    <svg xmlns="http://www.w3.org/2000/svg" width="32px" height="32px" viewBox="0 0 32 32">
        <g id="surface1">
            <rect x="0" y="0" width="32" height="32" style="fill:rgb(100%,100%,100%);fill-opacity:0.0117647;stroke:none;"/>
            <path style="fill:none;stroke-width:4;stroke-linecap:round;stroke-linejoin:round;stroke:rgb(0%,0%,0%);stroke-opacity:1;stroke-miterlimit:4;" d="M 10.998047 10.998047 L 19.001953 19.001953 M 37.001953 37.001953 L 28.998047 28.998047 " transform="matrix(0.666667,0,0,0.666667,0,0)"/>
            <path style="fill:none;stroke-width:4;stroke-linecap:round;stroke-linejoin:round;stroke:rgb(0%,0%,0%);stroke-opacity:1;stroke-miterlimit:4;" d="M 37.001953 10.998047 L 28.998047 19.001953 M 10.998047 37.001953 L 19.001953 28.998047 " transform="matrix(0.666667,0,0,0.666667,0,0)"/>
            <path style="fill-rule:nonzero;fill:rgb(18.431373%,53.333333%,100%);fill-opacity:1;stroke-width:4;stroke-linecap:round;stroke-linejoin:round;stroke:rgb(0%,0%,0%);stroke-opacity:1;stroke-miterlimit:4;" d="M 19.001953 19.001953 L 28.998047 19.001953 L 28.998047 28.998047 L 19.001953 28.998047 Z M 19.001953 19.001953 " transform="matrix(0.666667,0,0,0.666667,0,0)"/>
            <path style="fill:none;stroke-width:4;stroke-linecap:round;stroke-linejoin:round;stroke:rgb(0%,0%,0%);stroke-opacity:1;stroke-miterlimit:4;" d="M 37.001953 18 C 38.384766 18 39.738281 17.589844 40.886719 16.822266 C 42.041016 16.048828 42.9375 14.958984 43.464844 13.681641 C 43.998047 12.398438 44.132812 10.992188 43.863281 9.632812 C 43.59375 8.279297 42.925781 7.03125 41.947266 6.052734 C 40.96875 5.074219 39.720703 4.40625 38.367188 4.136719 C 37.007812 3.867188 35.601562 4.001953 34.318359 4.535156 C 33.041016 5.0625 31.951172 5.958984 31.177734 7.113281 C 30.410156 8.261719 30 9.615234 30 10.998047 M 37.001953 30 C 38.384766 30 39.738281 30.410156 40.886719 31.177734 C 42.041016 31.951172 42.9375 33.041016 43.464844 34.318359 C 43.998047 35.601562 44.132812 37.007812 43.863281 38.367188 C 43.59375 39.720703 42.925781 40.96875 41.947266 41.947266 C 40.96875 42.925781 39.720703 43.59375 38.367188 43.863281 C 37.007812 44.132812 35.601562 43.998047 34.318359 43.464844 C 33.041016 42.9375 31.951172 42.041016 31.177734 40.886719 C 30.410156 39.738281 30 38.384766 30 37.001953 M 10.998047 18 C 9.615234 18 8.261719 17.589844 7.113281 16.822266 C 5.958984 16.048828 5.0625 14.958984 4.535156 13.681641 C 4.001953 12.398438 3.867188 10.992188 4.136719 9.632812 C 4.40625 8.279297 5.074219 7.03125 6.052734 6.052734 C 7.03125 5.074219 8.279297 4.40625 9.632812 4.136719 C 10.992188 3.867188 12.398438 4.001953 13.681641 4.535156 C 14.958984 5.0625 16.048828 5.958984 16.822266 7.113281 C 17.589844 8.261719 18 9.615234 18 10.998047 M 10.998047 30 C 9.615234 30 8.261719 30.410156 7.113281 31.177734 C 5.958984 31.951172 5.0625 33.041016 4.535156 34.318359 C 4.001953 35.601562 3.867188 37.007812 4.136719 38.367188 C 4.40625 39.720703 5.074219 40.96875 6.052734 41.947266 C 7.03125 42.925781 8.279297 43.59375 9.632812 43.863281 C 10.992188 44.132812 12.398438 43.998047 13.681641 43.464844 C 14.958984 42.9375 16.048828 42.041016 16.822266 40.886719 C 17.589844 39.738281 18 38.384766 18 37.001953 " transform="matrix(0.666667,0,0,0.666667,0,0)"/>
        </g>
    </svg>`;
    return L.icon({
        iconUrl: `data:image/svg+xml,${encodeURIComponent(svgData)}`, // URL pre SVG ikonu
        iconSize: [32, 32], // Veľkosť ikony
        iconAnchor: [16, 16] // Kotviaci bod ikony, centrovaný
    });
}

// Funkcia na vytvorenie štítku dronu s nadmorskou výškou
const createDroneLabelIcon = (altitude) => {
    return L.divIcon({
        className: 'label-icon', // Vlastná CSS trieda pre štýlovanie štítku
        html: `<span>Altitude: ${altitude}m</span>`, // HTML obsah štítku zobrazujúci nadmorskú výšku
        iconSize: [null, null], // Dynamická veľkosť na základe obsahu
        iconAnchor: [25, -18] // Pozícia relatívne k ikone dronu
    });
};

// Funkcia na aktualizáciu markera dronu na mape
export const updateDroneMarker = (droneData, droneMarkerRef, mapInstance) => {
    const droneIcon = getDroneIcon(); // Získajte ikonu dronu
    const altitude = (typeof droneData.altitude !== 'undefined'
        && droneData.altitude !== null) ? droneData.altitude : 0; // Určte nadmorskú výšku

    if (droneMarkerRef.current) {
        // Aktualizujte pozíciu dronu
        droneMarkerRef.current.setLatLng([droneData.latitude, droneData.longitude]);
        // Aktualizujte ikonu dronu, ak ide len o aktualizáciu pozície
        droneMarkerRef.current.setIcon(droneIcon);

        const newLabelIcon = createDroneLabelIcon(altitude); // Vytvorte novú ikonu štítku
        if (droneMarkerRef.label) {
            // Aktualizujte pozíciu a ikonu štítku, ak už existuje
            droneMarkerRef.label.setLatLng([droneData.latitude, droneData.longitude]);
            droneMarkerRef.label.setIcon(newLabelIcon);
        } else {
            // Vytvorte nový marker štítku, ak neexistuje
            droneMarkerRef.label = L.marker([droneData.latitude, droneData.longitude], {icon: newLabelIcon}).addTo(mapInstance.current);
        }
    } else {
        // Vytvorte marker dronu a pridajte ho na mapu so štítkom
        droneMarkerRef.current = L.marker([droneData.latitude, droneData.longitude], {icon: droneIcon}).addTo(mapInstance.current);

        const labelIcon = createDroneLabelIcon(altitude); // Vytvorte ikonu štítku
        droneMarkerRef.label = L.marker([droneData.latitude, droneData.longitude], {icon: labelIcon}).addTo(mapInstance.current);
    }
};
