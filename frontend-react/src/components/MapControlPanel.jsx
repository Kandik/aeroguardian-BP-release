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
Súbor: MapControlPanel.jsx
Kontajner pre ovládací panel mapy hlavnej stránky
 */

import { ControlPanelSliderComponent } from './ControlPanelSliderComponent'; // Importuje komponent ControlPanelSliderComponent
import { ThemeProvider, styled } from "@mui/material"; // Importuje ThemeProvider a styled z Material-UI pre tému a štýlovanie
import { ControlPanelTheme } from "../themes/ControlPanelTheme.jsx"; // Importuje tému pre Control Panel z lokálneho súboru
import Box from '@mui/material/Box'; // Importuje Box komponent z Material-UI
import Grid from '@mui/material/Grid'; // Importuje Grid komponent z Material-UI
import Button from '@mui/material/Button'; // Importuje Button komponent z Material-UI
import FormControl from '@mui/material/FormControl'; // Importuje FormControl komponent z Material-UI
import InputLabel from '@mui/material/InputLabel'; // Importuje InputLabel komponent z Material-UI
import Select from '@mui/material/Select'; // Importuje Select komponent z Material-UI
import MenuItem from '@mui/material/MenuItem'; // Importuje MenuItem komponent z Material-UI
import PropTypes from 'prop-types'; // Importuje PropTypes pre validáciu typov props

// Definícia štýlov pre InputLabel s bielou farbou textu
const WhiteInputLabel = styled(InputLabel)({
    color: 'white',
});

// Definícia štýlov pre Select s bielou farbou textu a okrajov
const WhiteSelect = styled(Select)({
    color: 'white',
    '& .MuiOutlinedInput-notchedOutline': {
        borderColor: 'white',
    },
    '& .MuiSvgIcon-root': {
        color: 'white',
    }
});

// Komponent MapControlPanel
const MapControlPanel = ({ mapSettings, onSettingsChange }) => {
    // Funkcia na spracovanie zmien hodnôt v ControlPanelSliderComponent
    const handleChange = (name, value) => {
        onSettingsChange(prevSettings => ({
            ...prevSettings,
            [name]: Number(value)
        }));
    };

    // Funkcia na spracovanie zmeny rozlíšenia
    const handleResolutionChange = (event) => {
        onSettingsChange(prevSettings => ({
            ...prevSettings,
            resolution: event.target.value
        }));
    };

    // Funkcia na prepínanie zobrazenia štítkov
    const toggleLabels = () => {
        onSettingsChange(prevSettings => ({
            ...prevSettings,
            showLabels: !prevSettings.showLabels
        }));
    };

    // Funkcia na prepínanie vylúčenia letiska
    const toggleExcludeAirport = () => {
        onSettingsChange(prevSettings => ({
            ...prevSettings,
            excludeAirport: !prevSettings.excludeAirport
        }));
    };

    // Funkcia na nastavenie stredu zóny na pozíciu dronu
    const setZoneToDrone = () => {
        onSettingsChange(prevSettings => ({
            ...prevSettings,
            updateZoneCenter: true
        }));
    };

    // Funkcia na centrovanie mapy na dron
    const centerOnDrone = () => {
        onSettingsChange(prevSettings => ({
            ...prevSettings,
            centerOnDrone: !prevSettings.centerOnDrone
        }));
    };

    return (
        // Poskytuje tému pre komponenty v rámci ThemeProvider
        <ThemeProvider theme={ControlPanelTheme}>
            <Box sx={{ flexGrow: 1, padding: 2 }}>
                {/* Rozloženie Grid pre usporiadanie prvkov */}
                <Grid container spacing={2}>
                    {/* Prvý stĺpec Grid */}
                    <Grid item xs={6}>
                        {/* Slider komponent pre nastavenie flightRange */}
                        <ControlPanelSliderComponent
                            name="flightRange"
                            prompt="Flight Range (m)"
                            value={mapSettings.flightRange}
                            onChange={handleChange}
                        />
                        {/* Slider komponent pre nastavenie warningOverhead */}
                        <ControlPanelSliderComponent
                            name="warningOverhead"
                            prompt="Warning Overhead (km)"
                            value={mapSettings.warningOverhead}
                            onChange={handleChange}
                        />
                    </Grid>
                    {/* Druhý stĺpec Grid */}
                    <Grid item xs={6}>
                        {/* Slider komponent pre nastavenie altitude */}
                        <ControlPanelSliderComponent
                            name="altitude"
                            prompt="Altitude (m)"
                            value={mapSettings.altitude}
                            onChange={handleChange}
                        />
                        {/* Slider komponent pre nastavenie duration */}
                        <ControlPanelSliderComponent
                            name="duration"
                            prompt="Duration (min)"
                            value={mapSettings.duration}
                            onChange={handleChange}
                        />
                    </Grid>
                </Grid>

                {/* Tlačidlo na prepínanie zobrazenia štítkov */}
                <Button variant="contained" onClick={toggleLabels} sx={{ margin: 2, mt: 2 }}>
                    {mapSettings.showLabels ? "Hide Labels" : "Show Labels"}
                </Button>

                {/* Tlačidlo na nastavenie pozície dronu ako centra zóny */}
                <Button variant="contained" onClick={setZoneToDrone} sx={{ margin: 2, mt: 2 }}>
                    Set drone location as zone center
                </Button>

                {/* Tlačidlo na prepínanie centrovania na dron */}
                <Button variant="contained" onClick={centerOnDrone} sx={{ margin: 2, mt: 2 }}>
                    {mapSettings.centerOnDrone ? "Turn off centering" : "Center on drone"}
                </Button>

                {/* Tlačidlo na prepínanie vylúčenia letiska */}
                <Button variant="contained" onClick={toggleExcludeAirport} sx={{ margin: 2, mt: 2 }}>
                    {mapSettings.excludeAirport ? "Include airport" : "Exclude airport"}
                </Button>

                {/* FormControl pre výber rozlíšenia */}
                <FormControl sx={{ margin: 2, mt: 2, minWidth: 120 }}>
                    {/* Biela InputLabel pre rozlíšenie */}
                    <WhiteInputLabel id="resolution-label">Resolution</WhiteInputLabel>
                    {/* Biela Select komponent pre výber rozlíšenia */}
                    <WhiteSelect
                        labelId="resolution-label"
                        id="resolution-select"
                        value={mapSettings.resolution}
                        label="Resolution"
                        onChange={handleResolutionChange}
                    >
                        {/* MenuItem pre jednotlivé hodnoty rozlíšenia */}
                        <MenuItem value={100}>100</MenuItem>
                        <MenuItem value={250}>250</MenuItem>
                        <MenuItem value={500}>500</MenuItem>
                        <MenuItem value={1000}>1000</MenuItem>
                        <MenuItem value={2000}>2000</MenuItem>
                    </WhiteSelect>
                </FormControl>

                {/* Slider komponent pre nastavenie heatmapOpacity */}
                <ControlPanelSliderComponent
                    name="heatmapOpacity"
                    prompt="Heatmap opacity (%)"
                    value={mapSettings.heatmapOpacity}
                    onChange={handleChange}
                />
            </Box>
        </ThemeProvider>
    );
};

// Definícia prop typov pre komponent MapControlPanel
MapControlPanel.propTypes = {
    mapSettings: PropTypes.shape({
        flightRange: PropTypes.number.isRequired,
        warningOverhead: PropTypes.number.isRequired,
        altitude: PropTypes.number.isRequired,
        duration: PropTypes.number.isRequired,
        showLabels: PropTypes.bool.isRequired,
        updateZoneCenter: PropTypes.bool.isRequired,
        centerOnDrone: PropTypes.bool.isRequired,
        resolution: PropTypes.number.isRequired,
        excludeAirport: PropTypes.bool.isRequired,
        heatmapOpacity: PropTypes.number.isRequired
    }).isRequired,
    onSettingsChange: PropTypes.func.isRequired
};

export default MapControlPanel; // Exportuje komponent MapControlPanel ako predvolený export
