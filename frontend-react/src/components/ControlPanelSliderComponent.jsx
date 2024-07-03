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
Súbor: ControlPanelSliderComponent.jsx
Komponent na nastavovanie číselných parametrov pomocou slideru a TextFieldu
 */

import Typography from "@mui/material/Typography"; // Importovanie Typography komponentu z '@mui/material' knižnice, ktorý sa používa na zobrazovanie textu s Material-UI štýlom
import TextField from "@mui/material/TextField"; // Importovanie TextField komponentu z '@mui/material' knižnice, ktorý sa používa na zobrazovanie vstupného poľa
import Slider from "@mui/material/Slider"; // Importovanie Slider komponentu z '@mui/material' knižnice, ktorý sa používa na zobrazovanie posuvníka
import Box from "@mui/material/Box"; // Importovanie Box komponentu z '@mui/material' knižnice, ktorý sa používa na vytváranie layoutov
import PropTypes from 'prop-types'; // Importovanie PropTypes knižnice na validáciu typov properties v React komponentoch
import { ControlPanelBounds } from "./StaticSettings.jsx"; // Importovanie StaticSettings z lokálneho súboru, predpokladáme, že cesta je správna

// Definícia a export komponentu ControlPanelSliderComponent
export const ControlPanelSliderComponent = ({
                                                name,      // názov parametra
                                                prompt,    // textový prompt
                                                value,     // aktuálna hodnota
                                                onChange   // funkcia na zmenu hodnoty
                                            }) => {
    // Získanie limitov pre posuvník zo StaticSettings podľa názvu parametra
    const bounds = ControlPanelBounds[name + 'Bounds'];

    // Funkcia na spracovanie zmeny hodnoty posuvníka
    const handleSliderChange = (event, newValue) => {
        onChange(name, newValue);
    };

    // Funkcia na spracovanie zmeny hodnoty vstupného poľa
    const handleInputChange = (event) => {
        onChange(name, event.target.value === '' ? '' : Number(event.target.value));
    };

    // Funkcia na kontrolu a úpravu hodnoty pri opustení vstupného poľa
    const handleBlur = () => {
        // Korekcia hodnoty, ak je mimo povolených limitov
        const boundedValue = Math.max(bounds[0], Math.min(bounds[1], Number(value)));
        if (boundedValue !== value) {
            onChange(name, boundedValue);
        }
    };

    return (
        // Hlavný kontajner komponentu s marginLeft pre odsadenie
        <Box marginLeft>
            {/* Vnorený kontajner pre TextField a Typography s flex displejom na zarovnanie do riadku */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, marginBottom: 2, marginLeft: 5 }}>
                {/* Typography komponent na zobrazenie prompt textu */}
                <Typography component="span" sx={{ whiteSpace: 'nowrap', marginRight: 2 }}>
                    {prompt}
                </Typography>
                {/* TextField komponent na vstup čísla */}
                <TextField
                    value={value} // Aktuálna hodnota vstupu
                    onChange={handleInputChange} // Funkcia na spracovanie zmeny vstupu
                    onBlur={handleBlur} // Funkcia na spracovanie udalosti pri opustení vstupu
                    inputProps={{ min: bounds[0], max: bounds[1], type: 'number' }} // Atribúty vstupu (min, max, typ číslo)
                    size="small" // Veľkosť vstupu
                    margin="dense" // Margin pre hustotu rozloženia
                    sx={{ flexGrow: 1 }} // Flexibilný rast pre zarovnanie v riadku
                />
            </Box>
            {/* Vnorený kontajner pre Slider s paddingom vľavo a vpravo */}
            <Box paddingLeft={2} paddingRight={2}>
                {/* Slider komponent na výber hodnoty pomocou posuvníka */}
                <Slider
                    value={typeof value === 'number' ? value : 0} // Zabezpečuje, že hodnota je ošetrená ako číslo
                    onChange={handleSliderChange} // Funkcia na spracovanie zmeny hodnoty posuvníka
                    min={bounds[0]} // Minimálna hodnota posuvníka
                    max={bounds[1]} // Maximálna hodnota posuvníka
                    step={bounds[2]} // Krok posuvníka
                />
            </Box>
        </Box>
    );
};

// Definícia typov pre props
ControlPanelSliderComponent.propTypes = {
    name: PropTypes.string.isRequired,   // názov musí byť reťazec a je povinný
    prompt: PropTypes.string.isRequired, // prompt musí byť reťazec a je povinný
    value: PropTypes.oneOfType([         // hodnota môže byť číslo alebo prázdny reťazec
        PropTypes.number,
        PropTypes.string
    ]).isRequired,
    onChange: PropTypes.func.isRequired  // onChange musí byť funkcia a je povinný
};
