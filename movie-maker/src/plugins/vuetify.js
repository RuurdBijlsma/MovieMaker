import Vue from 'vue';
import Vuetify from 'vuetify/lib';

let dark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
if (localStorage.getItem('darkTheme') !== null)
    dark = localStorage.darkTheme === 'true';

Vue.use(Vuetify);

export default new Vuetify({
    theme: {
        dark,
        themes: {
            dark: {
                primary: localStorage.getItem('primaryColor') ?? '#ed4b83',
                foreground: '#ffffff',
                softForeground: '#d6d6d6',
                softBackground: '#212122',
                softerBackground: '#393939',
                secondary: localStorage.getItem('secondaryColor') ?? '#5f46ff',
            },
            light: {
                primary: localStorage.getItem('primaryColor') ?? '#ed4b83',
                foreground: '#17181a',
                softForeground: '#353535',
                softBackground: '#f1efef',
                softerBackground: '#cdcdcd',
                secondary: localStorage.getItem('secondaryColor') ?? '#7e6de5',
            },
        },
    }
});
