import Vue from 'vue'
import Vuex from 'vuex'

import electron from './electron-module'
import ffmpeg from './ffmpeg-module'
import VideoFragment from "@/js/VideoFragment";

Vue.use(Vuex)

export default new Vuex.Store({
    state: {
        snackbars: [],
        timeline: [],
        videoFiles: [],
        activeFragment: null,
        timelineConfig: {
            minFragmentWidth: 120,
            widthPerSecond: 2.9,
        },
        player: {
            progress: 0,
            volume: 0,
        },
    },
    mutations: {
        addSnackObject: (state, snack) => state.snackbars.push(snack),
        removeSnack: (state, snack) => state.snackbars.splice(state.snackbars.indexOf(snack), 1),
        addToTimeline: (state, videoFragment) => {
            if (!state.videoFiles.includes(videoFragment.video))
                state.videoFiles.push(videoFragment.video);
            state.timeline.push(videoFragment)
        },
        activeFragment: (state, fragment) => state.activeFragment = fragment,
        progress: (state, progress) => state.player.progress = progress,
    },
    getters: {
        fullDuration: state => state.timeline.reduce((a, b) => a + b.adjustedDuration, 0),
        toHms: () => seconds => {
            let ms = Math.round((seconds % 1) * 100).toString().padStart(2, '0');
            let s = Math.round(seconds % 60).toString().padStart(2, '0');
            let m = Math.round((seconds % 3600) / 60).toString().padStart(2, '0');
            let h = Math.round(seconds / 3600).toString().padStart(2, '0');
            h = h === '00' ? '' : h + ':';
            return `${h}${m}:${s}.${ms}`;
        }
    },
    actions: {
        async initialize({dispatch}) {
            await dispatch("initializeFfmpeg");
        },
        async importVideo({state, commit, dispatch}, path) {
            let videoFile = await dispatch('loadMetadata', path);
            let fragment = new VideoFragment(videoFile);
            console.log(fragment);
            if (state.activeFragment === null) {
                commit('activeFragment', fragment);
            }
            commit('addToTimeline', fragment);
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
