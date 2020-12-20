import Vue from 'vue';
import Vuetify from 'vuetify/lib';
import Directories from "@/js/Directories";

Directories.importLSFile();

let dark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
if (localStorage.getItem('darkTheme') !== null)
    dark = localStorage.darkTheme === 'true';

Vue.use(Vuetify);
const primaryColor = localStorage.getItem('primaryColor') ?? '#ed4b83';

export default new Vuetify({
    theme: {
        dark,
        themes: {
            dark: {
                primary: primaryColor,
                foreground: '#ffffff',
                softForeground: '#d6d6d6',
                softBackground: '#282727',
                softerBackground: '#39393e',
                secondary: localStorage.getItem('secondaryColor') ?? '#5f46ff',
            },
            light: {
                primary: primaryColor,
                foreground: '#17181a',
                softForeground: '#353535',
                softBackground: '#f1efef',
                softerBackground: '#cdcdcd',
                secondary: localStorage.getItem('secondaryColor') ?? '#7e6de5',
            },
        },
    }
});
