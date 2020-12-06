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
                softForeground: '#d6d6d6',
                softBackground: '#212122',
                secondary: '#5f46ff',
            },
            light: {
                primary: '#ed4b83',
                foreground: '#17181a',
                softForeground: '#353535',
                softBackground: '#f1efef',
                secondary: '#7e6de5',
            },
        },
    }
});
