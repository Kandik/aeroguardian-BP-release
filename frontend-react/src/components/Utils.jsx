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
Súbor: Utils.jsx
Ostatné pomocné funkcie front-endu
 */

// Pomocná funkcia na výpočet vzdialenosti medzi dvoma bodmi
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
    var R = 6371e3; // metres
    var φ1 = lat1 * Math.PI/180; // φ, λ v radiánoch
    var φ2 = lat2 * Math.PI/180;
    var Δφ = (lat2-lat1) * Math.PI/180;
    var Δλ = (lon2-lon1) * Math.PI/180;

    var a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ/2) * Math.sin(Δλ/2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // v metroch
};
