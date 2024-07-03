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
Súbor: App.jsx
Hlavný router front-end aplikácie
*/

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'; // Importuje komponenty z react-router-dom pre smerovanie
import Home from './components/Home.jsx'; // Importuje hlavný komponent Home
import TestPage from './test/TestPage.jsx'; // Importuje testovací komponent TestPage

const App = () => {
    return (
        // Obklopuje celú aplikáciu Routerom pre spravovanie smerovania
        <Router>
            <Routes>
                {/* Definuje trasu pre hlavný komponent Home */}
                <Route path="/" element={<Home />} />
                {/* Definuje trasu pre testovací komponent TestPage */}
                <Route path="/test" element={<TestPage />} />
            </Routes>
        </Router>
    );
};

export default App; // Exportuje komponent App ako predvolený export
