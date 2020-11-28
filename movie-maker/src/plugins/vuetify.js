import Vue from 'vue';
import Vuetify from 'vuetify/lib';

Vue.use(Vuetify);

export default new Vuetify({
    theme: {
        dark: localStorage.darkTheme === 'true',
        themes: {
            dark: {
                primary: '#ed4b83',
                foreground: '#ffffff',
                primaryLight: '#2a2a2b',
                secondary: '#5e50bd',
            },
            light: {
                primary: '#ed4b83',
                foreground: '#17181a',
                primaryLight: '#f1efef',
                secondary: '#a99eef',
            },
        },
    }
});
