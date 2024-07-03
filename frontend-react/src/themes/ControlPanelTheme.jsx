import { createTheme } from '@mui/material/styles';

export const ControlPanelTheme = createTheme({
    components: {
        MuiTextField: {
            defaultProps: {
                size: 'small',      // Default to 'small' size for all TextField components
                type: 'number',     // Default to 'number' type for all TextField components
                InputProps: {       // Apply default inputProps
                    inputProps: {
                        min: 0,    // Default minimum value
                        max: 5000  // Default maximum value for most fields
                    }
                }
            },
            styleOverrides: {
                root: {
                    display: 'flex', // Ensures flex layout
                    alignItems: 'center', // Align items vertically
                    '& input': {
                        color: '#ffffff', // White text color for all TextField inputs
                        textAlign: 'center' // Center align the text within the input
                    },
                    width: 80,           // Set a default width for all TextField components
                    marginLeft: 20,      // Default margin left
                    marginRight: 20      // Default margin right
                }
            }
        },
        MuiSlider: {
            styleOverrides: {
                root: {
                    marginLeft: 20,  // Margin left for all Slider components
                    marginRight: 20  // Margin right for all Slider components
                },
                valueLabel: {
                    '& span': {
                        color: '#ffffff',  // White text color for the value label
                    }
                }
            }
        }
    }
});
