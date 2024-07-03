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
Súbor: StaticSettings.jsx
Statické nastavenia upraviteľné v kóde
 */

// Funkcia na získanie IP adresy backendu servera
// Vložte IP Flask backend servera
// Pre fungovanie mimo localhost musí byť vložená IP verejná! (IP musí byť dostupná z prehliadača)
export const BackendIP = "http://localhost:4000"
//export const BackendIP = "http://your_backend_IP";

// Funkcia na získanie IP adresy Icecast servera
// Vložte IP Icecast servera
// Pre fungovanie mimo localhost musí byť vložená IP verejná! (IP musí byť dostupná z prehliadača)
export const IcecastIP = "http://your_Icecast_IP.mp3"

// Nastavenia hraníc a kroku ovládacieho panelu [dolná hranica, horná hranica, krok]
export const ControlPanelBounds = {
    flightRangeBounds: [25, 5000, 25], // Letová zóna v m
    warningOverheadBounds: [5, 20, 1], // Varovná zóna v km
    altitudeBounds: [30, 2000, 10], // Výška zóny v m
    durationBounds: [15, 120, 5], // Predikčná doba v minútach
    heatmapOpacityBounds: [0, 1, 0.05] // Priehľadnosť mapy výskytu prevádzky
};

// Bezpečný vertikálny odstup v metroch
export const VerticalOverhead = 500;

// Pôvodné nastavenia mapy
export const DefaultMapSettings = {
    center: [48.72026, 21.25821], // Súradnice stredu - vzťažný bod Košíc
    zoom: 13 // Predvolený zoom level
}

