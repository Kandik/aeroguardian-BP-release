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
Súbor: BreachStatusComponent.jsx
Komponent na zobrazenie najkritickejšieho varovania o narušení zóny pre pilota dronu
 */

import { Typography } from '@mui/material'; // Importovanie Typography komponentu z '@mui/material' knižnice, ktorý sa používa na zobrazovanie textu s Material-UI štýlom
import PropTypes from 'prop-types'; // Importovanie PropTypes knižnice na validáciu typov properties v React komponentoch

// Komponent BreachStatus zobrazuje stav narušenia bezpečnostnej zóny
const BreachStatus = ({ breaches }) => {
    // Ak neexistujú žiadne narušenia alebo je ich počet nulový, zobrazí sa správa "No breach detected"
    if (!breaches || breaches.length === 0) {
        return (
            <Typography style={{ color: 'green', position: 'absolute', top: 0, left: 0, padding: '10px' }}>
                No breach detected
            </Typography>
        );
    }

    // Zoradenie narušení najprv podľa typu (narušenia letovej zóny ako prvé) a potom podľa času (vzostupne)
    const sortedBreaches = breaches.sort((a, b) => {
        if (a[1] === b[1]) {
            return a[3] - b[3]; // Ak sú typy rovnaké, zoradí podľa času
        }
        return a[1] === 'Flight zone breach' ? -1 : 1; // Narušenia letovej zóny sú prvé
    });

    // Získa najkritickejšie narušenie (prvá položka po zoradení)
    const mostCriticalBreach = sortedBreaches[0];

    return (
        <div style={{ position: 'absolute', top: 0, left: 0, padding: '10px' }}>
            <Typography align="center" style={{ marginTop: 20, color: mostCriticalBreach[1] === 'Flight zone breach' ? 'red' : 'yellow' }}>
                {`${mostCriticalBreach[1]} in ${Math.round(mostCriticalBreach[3])} seconds (altitude: ${Math.round(mostCriticalBreach[2])} m)`}
            </Typography>
        </div>
    );
};

// Definícia typov pre prop 'breaches'
BreachStatus.propTypes = {
    breaches: PropTypes.arrayOf(
        PropTypes.arrayOf(
            PropTypes.oneOfType([
                PropTypes.string, // Typ narušenia (napr. 'Flight zone breach')
                PropTypes.number, // Hodnoty ako čas a výška
            ])
        )
    ),
};

export default BreachStatus;
