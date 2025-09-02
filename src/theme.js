import {createTheme} from '@mui/material/styles';

const theme = createTheme({
    palette: {
        mode: 'light',
        primary: {main: '#25D366'},
        secondary: {main: '#128C7E'},
        background: {
            default: '#e5ddd5',
            paper: '#ffffff'
        }
    },
    shape: {borderRadius: 12}
});

export default theme;