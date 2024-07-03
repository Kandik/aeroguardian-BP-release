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
Súbor: IcecastPlayer.jsx
Koncový bod Icecastu na odpočúvanie leteckého rádia
 */

import { IcecastIP } from "./StaticSettings.jsx"; // Importuje IcecastIP z modulu StaticSettings

// Komponent IcecastPlayer
const IcecastPlayer = () => {
    // Získanie URL pre streamovanie z funkcie getIcecastIP

    return (
        // Kontajner pre audio prehrávač s absolútnou pozíciou
        <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
            {/* HTML audio element pre prehrávanie streamu */}
            <audio controls autoPlay>
                {/* Zdroj audio streamu */}
                <source src={IcecastIP} type="audio/mpeg" />
                {/* Záložná správa, ak prehliadač nepodporuje audio element */}
                Your browser does not support the audio element.
            </audio>
        </div>
    );
};

export default IcecastPlayer; // Exportuje komponent IcecastPlayer ako predvolený export
