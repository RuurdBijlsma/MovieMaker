import Vue from 'vue'
import Vuex from 'vuex'

import electron from './electron-module'
import ffmpeg from './ffmpeg-module'

Vue.use(Vuex)

export default new Vuex.Store({
    state: {
        snackbars: [],
    },
    mutations: {
        addSnackObject: (state, snack) => state.snackbars.push(snack),
        removeSnack: (state, snack) => state.snackbars.splice(state.snackbars.indexOf(snack), 1),
    },
    getters: {},
    actions: {
        async initialize({dispatch}) {
            await dispatch("initializeFfmpeg");
        },
        addSnack: async ({state, commit}, {text, timeout = 3000}) => {
            let snack = {text, open: true, timeout};
            commit('addSnackObject', snack);
            return new Promise(resolve => {
                setTimeout(() => {
                    commit('removeSnack', snack);
                    resolve();
                }, timeout + 500);
            });
        },
    },
    modules: {electron, ffmpeg}
})
