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
        videosContainer: null,
        videoFiles: [],
        activeFragment: null,
        configTimeline: {
            minFragmentWidth: 120,
            widthPerSecond: 2.9,
        },
        player: {
            progress: 0,
            volume: 0,
            playing: false,
        },
    },
    mutations: {
        videosContainer: (state, container) => {
            state.videosContainer = container;
            state.videoFiles.forEach(v => v.container = container);
        },
        addSnackObject: (state, snack) => state.snackbars.push(snack),
        removeSnack: (state, snack) => state.snackbars.splice(state.snackbars.indexOf(snack), 1),
        addToTimeline: (state, videoFragment) => {
            if (!state.videoFiles.includes(videoFragment.video)) {
                videoFragment.video.container = state.videosContainer;
                state.videoFiles.push(videoFragment.video);
            }
            state.timeline.push(videoFragment)
        },
        activeFragment: (state, fragment) => state.activeFragment = fragment,
        progress: (state, progress) => state.player.progress = progress,
        playing: (state, playing) => state.player.playing = playing,
    },
    getters: {
        timelineVideos: state => {
            let videos = new Set();
            for (let {video} of state.timeline)
                videos.add(video);
            return [...videos];
        },
        progressAtFragmentProgress: (state, getters) => ({fragment, progress}) => {
            let timeBefore = state.timeline.slice(0, state.timeline.indexOf(fragment)).reduce((a, b) => a + b.adjustedDuration, 0);
            let fragmentPart = fragment.adjustedDuration / getters.fullDuration;
            return timeBefore / getters.fullDuration + fragmentPart * progress;
        },
        fragmentAtProgress: (state, getters) => progress => {
            let fullDuration = getters.fullDuration;
            let beforeParts = 0;
            for (let fragment of state.timeline) {
                let fragmentPart = fragment.adjustedDuration / fullDuration;
                if (beforeParts + fragmentPart > progress) {
                    let fragmentProgress = (progress - beforeParts) / fragmentPart;
                    let fragmentCut = fragment.end - fragment.start;
                    return {fragment, videoProgress: fragmentProgress * fragmentCut};
                }
                beforeParts += fragmentPart;
            }
            return null;
        },
        fullDuration: state => {
            let d = state.timeline.reduce((a, b) => a + b.adjustedDuration, 0)
            return isNaN(d) ? 0 : d;
        },
        toHms: () => seconds => {
            if (isNaN(seconds))
                return `00:00.00`;
            let ms = Math.round((seconds % 1) * 100).toString().padStart(2, '0');
            let s = Math.round(seconds % 60).toString().padStart(2, '0');
            let m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
            let h = Math.floor(seconds / 3600).toString().padStart(2, '0');
            h = h === '00' ? '' : h + ':';
            return `${h}${m}:${s}.${ms}`;
        }
    },
    actions: {
        async seek({state, commit, getters}, progress) {
            let {fragment, videoProgress} = getters.fragmentAtProgress(progress);
            state.timeline.filter(f => f !== fragment).forEach(f => f.reset());
            fragment.video.element.currentTime = videoProgress * fragment.video.duration;
            commit('activeFragment', fragment);
            if (state.player.playing && fragment.video.element.paused)
                fragment.video.element.play();
        },
        async videoEnd({state, commit}) {
            let currentIndex = state.timeline.indexOf(state.activeFragment);
            if (currentIndex >= state.timeline.length - 1)
                return;
            let nextFragment = state.timeline[currentIndex + 1];
            let element = nextFragment.video.element;
            element.currentTime = nextFragment.start * nextFragment.video.duration;
            element.play().then();
            commit('activeFragment', nextFragment);
        },
        async play({state}) {
            await state.activeFragment.video.element.play();
        },
        pause({state}) {
            state.activeFragment.video.element.pause();
        },
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
