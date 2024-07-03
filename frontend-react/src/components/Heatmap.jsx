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
Súbor: Heatmap.jsx
Komponent na spracovanie mapy výskytu letovej prevádzky
 */

import { useEffect } from 'react'; // Importuje React a hook useEffect pre správu vedľajších efektov
import PropTypes from 'prop-types'; // Importuje PropTypes pre validáciu typov props
import L from 'leaflet'; // Importuje knižnicu Leaflet pre mapové funkcionality
import { BackendIP } from "./StaticSettings.jsx"; // Importuje BackendIP z modulu StaticSettings

// Komponent Heatmap (Mapa výskytu prevádzky)
const Heatmap = ({ mapRef, settings }) => {
    useEffect(() => {
        if (mapRef.current && settings.altitude) {
            // Vypočítať index nadmorskej výšky a zaistiť, aby nepresiahol 1500
            const altitudeIndex = Math.min(Math.floor(settings.altitude / 50) * 50, 1500);
            // Určiť, či vylúčiť letiská z mapy výskytu prevádzky
            const excludeAiport = settings.excludeAirport ? "airport_excluded" : "airport_included";

            // URL šablóna pre Leaflet
            const tileUrl = `${BackendIP}/heatmap/${excludeAiport}/res_${settings.resolution}/${altitudeIndex}/{z}/{x}/{y}.png`;

            // Odstrániť existujúcu vrstvu mapy výskytu prevádzky, ak existuje
            if (mapRef.current.heatmapLayer) {
                mapRef.current.removeLayer(mapRef.current.heatmapLayer);
            }

            // Vytvoriť novú vrstvu dlaždíc pre mapu výskytu prevádzky
            const heatmapLayer = L.tileLayer(tileUrl, {
                attribution: 'Heatmap data', // Voliteľné: Text atribúcie
                opacity: settings.heatmapOpacity, // Použiť nepriehľadnosť zo settings alebo predvolenú hodnotu
                minZoom: 7, //Minimálny zoom
                maxZoom: 16, //Maximálny zoom
                bounds: [[48.5, 21], [49, 21.5]], //Geografické hranice mapy výskytu
                tileSize: 256 //Veľkosť jednej dlaždice
            });

            // Pridať vrstvu mapy výskytu prevádzky na mapu
            heatmapLayer.addTo(mapRef.current);
            // Uložiť referenciu na vrstvu pre neskoršie odstránenie
            mapRef.current.heatmapLayer = heatmapLayer;
        }
    }, [mapRef, settings.altitude, settings.resolution, settings.excludeAirport, settings.heatmapOpacity]);

    return null; // Tento komponent sám o sebe nič nevykresľuje
};

// Definovať typy props pre komponent
Heatmap.propTypes = {
    mapRef: PropTypes.shape({
        current: PropTypes.object
    }).isRequired,
    settings: PropTypes.shape({
        altitude: PropTypes.number.isRequired,
        resolution: PropTypes.number.isRequired,
        excludeAirport: PropTypes.bool.isRequired,
        heatmapOpacity: PropTypes.number.isRequired
    }).isRequired
};

export default Heatmap;
