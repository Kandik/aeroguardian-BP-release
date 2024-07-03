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
Súbor: ProcessData.jsx
Funkcie na spracovávanie a komunikáciu s back-endom
 */

import {BackendIP, VerticalOverhead} from "./StaticSettings.jsx"; // Importuje BackendID a VerticalOverhead z modulu StaticSettings

// Funkcia na získanie dát o lietadlách
export const getAircraftData = async () => {
    try {
        const response = await fetch(`${BackendIP}/data`); // Vykonanie HTTP GET požiadavky na získanie dát o lietadlách
        if (!response.ok) {
            console.error(`HTTP error! Status: ${response.status}`);
            return []; // Vrátenie prázdneho poľa v prípade chyby
        }
        const data = await response.json(); // Parsovanie odpovede ako JSON
        return data.aircraft || []; // Vrátenie dát lietadiel alebo prázdneho poľa, ak sú dáta nedefinované
    } catch (error) {
        console.error('Error during aircraft data fetch:', error); // Výpis chyby do konzoly
        return []; // Vrátenie prázdneho poľa v prípade chyby
    }
}

// Funkcia na získanie dát o dronu
export const getDroneData = async () => {
    try {
        const response = await fetch(`${BackendIP}/drone_data`); // Vykonanie HTTP GET požiadavky na získanie dát o dronu
        if (!response.ok) {
            console.error(`HTTP error! Status: ${response.status}`);
            return null; // Vrátenie null v prípade chyby
        }
        const data = await response.json(); // Parsovanie odpovede ako JSON
        if (data && data.latitude !== undefined && data.longitude !== undefined) {
            // Vrátenie dát dronu, ak odpoveď je OK a obsahuje potrebné dáta
            return { latitude: data.latitude, longitude: data.longitude, altitude: data.altitude };
        } else {
            console.error('Unexpected data format for drone:', data); // Výpis chyby do konzoly, ak je formát dát neočakávaný
            return null; // Vrátenie null, ak formát dát nie je podľa očakávania
        }
    } catch (error) {
        console.error('Error during drone data fetch:', error); // Výpis chyby do konzoly
        return null; // Vrátenie null v prípade chyby
    }
};

// Funkcia na kontrolu narušení, vracia zoznam narušení
export const checkForBreaches = async (settings, zoneData) => {
    try {
        const response = await fetch(`${BackendIP}/check_breach`, {
            method: 'POST', // HTTP POST metóda
            headers: {
                'Content-Type': 'application/json' // Hlavička určujúca typ obsahu
            },
            body: JSON.stringify({
                settings: settings, // Dáta nastavení ako JSON
                zoneData: zoneData // Dáta zóny ako JSON
            })
        });

        if (!response.ok) {
            console.error(`HTTP error! Status: ${response.status}`);
            return []; // Vrátenie prázdneho poľa v prípade chyby
        }

        return await response.json(); // Vrátenie dát o narušení
    } catch (error) {
        console.error('Failed to check for breaches:', error); // Výpis chyby do konzoly
        return []; // Vrátenie prázdneho poľa v prípade chyby
    }
};

// Funkcia na kontrolu blízkosti dronu k narušeniu
export const checkDroneProximityToBreach = (breaches, droneAltitude) => {
    const warnings = breaches.filter(breach => {
        const altitudeDifference = Number(breach[2]) - Number(droneAltitude);
        //console.log(altitudeDifference)
        return altitudeDifference <= VerticalOverhead; // Bezpečný vertikálny odstup
    });

    return warnings.map(warning => ({
        message: `WARNING: ${warning[1]} IN ${Math.round(warning[3])} SECONDS 
        AT ALTITUDE ${Math.round(warning[2])} m WITHIN ${Math.round(warning[2] - droneAltitude)} m 
        OF YOUR DRONE. DESCEND ASAP.`,
        timeToBreach: warning.timeToBreach
    }));
};
