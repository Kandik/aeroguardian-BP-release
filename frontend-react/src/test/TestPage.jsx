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
Súbor: TestPage.jsx
Stránka na test postovania pozície a výšky dronu
 */

import { useState, useRef, useEffect } from 'react'; // Importuje hooky useState, useRef a useEffect z Reactu
import L from 'leaflet'; // Importuje knižnicu Leaflet na prácu s mapami
import 'leaflet/dist/leaflet.css'; // Importuje štýly pre Leaflet mapy
import { BackendIP } from "../components/StaticSettings.jsx"; // Importuje IP adresu backendu

const TestPage = () => {
    const [altitude, setAltitude] = useState(100); // Definuje stav pre výšku, defaultná hodnota je 100
    const mapRef = useRef(null); // Referencia na mapový kontajner

    // Hook na inicializáciu mapy
    useEffect(() => {
        // Inicializuje mapu s výhľadom na zadané súradnice a zoom level 13
        const map = L.map(mapRef.current).setView([48.72026, 21.25821], 13);

        // Pridá OpenStreetMap tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        // Pridá event listener na kliknutie na mapu
        map.on('click', function (e) {
            postDroneLocation(e.latlng, altitude); // Zavolá funkciu postDroneLocation s pozíciou kliknutia a výškou
        });

        // Cleanup funkcia na odstránenie mapy pri unmountingu komponentu
        return () => map.remove();
    }, [altitude]); // Hook sa spustí vždy, keď sa zmení výška

    // Funkcia na odoslanie pozície dronu na server
    const postDroneLocation = (latlng, altitude) => {
        fetch(`${BackendIP}/drone_location`, {
            method: 'POST', // Metóda HTTP POST
            headers: {
                'Content-Type': 'application/json' // Hlavička určujúca typ obsahu
            },
            body: JSON.stringify({
                latitude: latlng.lat, // Zabalí súradnice a výšku do JSON formátu
                longitude: latlng.lng,
                altitude: Number(altitude)
            })
        })
            .then(response => response.json()) // Parsuje odpoveď ako JSON
            .then(data => console.log(data)) // Výpis dát do konzoly
            .catch(error => console.error('Error posting drone location:', error)); // Výpis chyby do konzoly
    };

    return (
        <div>
            {/* Kontajner pre mapu */}
            <div ref={mapRef} style={{ height: '400px', width: '100%' }}></div>
            {/* Slider na nastavenie výšky */}
            <input
                type="range"
                min="0"
                max="12000"
                value={altitude}
                onChange={(e) => setAltitude(e.target.value)}
                style={{ width: '100%', marginTop: '20px' }}
            />
            {/* Zobrazenie aktuálnej výšky */}
            <div style={{ marginTop: '10px' }}>Altitude: {altitude} meters</div>
        </div>
    );
};

export default TestPage; // Exportuje komponent TestPage ako predvolený export
