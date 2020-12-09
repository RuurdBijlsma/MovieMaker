import Vue from 'vue';
import Vuetify from 'vuetify/lib';

Vue.use(Vuetify);

export default new Vuetify({
    theme: {
        dark: localStorage.darkTheme === 'true',
        themes: {
            dark: {
                primary: localStorage.getItem('primaryColor') ?? '#ed4b83',
                foreground: '#ffffff',
                softForeground: '#d6d6d6',
                softBackground: '#212122',
                secondary: localStorage.getItem('secondaryColor') ?? '#5f46ff',
            },
            light: {
                primary: localStorage.getItem('primaryColor') ?? '#ed4b83',
                foreground: '#17181a',
                softForeground: '#353535',
                softBackground: '#f1efef',
                secondary: localStorage.getItem('secondaryColor') ?? '#7e6de5',
            },
        },
    }
});
