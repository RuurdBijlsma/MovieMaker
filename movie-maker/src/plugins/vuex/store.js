import Vue from 'vue'
import Vuex from 'vuex'
import Vuetify from '../vuetify'

import electron from './electron-module'
import ffmpeg from './ffmpeg-module'
import VideoFragment from "@/js/VideoFragment";
import SetStartPoint from "@/js/Commands/SetStartPoint";
import SetEndPoint from "@/js/Commands/SetEndPoint";
import SplitFragment from "@/js/Commands/SplitFragment";
import AddFragment from "@/js/Commands/AddFragment";
import DeleteFragment from "@/js/Commands/DeleteFragment";
import MoveFragment from "@/js/Commands/MoveFragment";
import SetPlaybackRate from "@/js/Commands/SetPlaybackRate";
import SetVolume from "@/js/Commands/SetVolume";
import Command from "@/js/Commands/Command";

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
        moveFragment: (state, {fragment, newIndex}) => {
            let index = state.timeline.indexOf(fragment);
            if (index === -1)
                return;
            state.timeline.splice(index, 1);
            state.timeline.splice(newIndex, 0, fragment);
        },
        removeFromTimeline: (state, removedFragment) => {
            let index = state.timeline.indexOf(removedFragment);
            if (index === -1)
                return;
            state.timeline.splice(index, 1);
            let keepVideo = false;
            for (let fragment of state.timeline) {
                if (fragment.video === removedFragment.video) {
                    keepVideo = true;
                    break;
                }
            }
            if (!keepVideo) {
                state.videoFiles.splice(state.videoFiles.indexOf(removedFragment.video), 1);
            }
        },
        addToTimeline: (state, {fragment, index}) => {
            if (!state.videoFiles.includes(fragment.video)) {
                fragment.video.container = state.videosContainer;
                state.videoFiles.push(fragment.video);
            }
            if (index === undefined)
                state.timeline.push(fragment)
            else
                state.timeline.splice(index, 0, fragment);
        },
        activeFragment: (state, fragment) => state.activeFragment = fragment,
        progress: (state, progress) => state.player.progress = progress,
        playing: (state, playing) => state.player.playing = playing,
    },
    getters: {
        themeColors() {
            return Vuetify.framework.theme.themes[Vuetify.framework.theme.isDark ? 'dark' : 'light'];
        },
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
                if (beforeParts + fragmentPart >= progress - 0.0001) {
                    let fragmentProgress = (progress - beforeParts) / fragmentPart;
                    let fragmentCut = fragment.end - fragment.start;
                    return {fragment, videoProgress: fragment.start + fragmentProgress * fragmentCut};
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
            let hms = new Date(seconds * 1000).toISOString().substr(11, 11)
            if (hms.startsWith('00'))
                return hms.substr(3);
            return hms;
        }
    },
    actions: {
        undo({}) {
            Command.undo();
        },
        redo({}) {
            Command.redo();
        },
        setVolume({state}, {fragment, volume}) {
            fragment ??= state.activeFragment;
            new SetVolume(fragment, volume).execute();
        },
        setPlaybackRate({state}, {fragment, playbackRate}) {
            fragment ??= state.activeFragment;
            new SetPlaybackRate(fragment, playbackRate).execute();
        },
        setStartPoint({state, getters}, {fragment, start}) {
            fragment ??= state.activeFragment;
            start ??= getters.fragmentAtProgress(state.player.progress).videoProgress;
            new SetStartPoint(fragment, start).execute();
        },
        setEndPoint({state, getters}, {fragment, end}) {
            fragment ??= state.activeFragment;
            end ??= getters.fragmentAtProgress(state.player.progress).videoProgress;
            new SetEndPoint(fragment, end).execute();
        },
        split(store, {fragment, split}) {
            fragment ??= store.state.activeFragment;
            split ??= store.getters.fragmentAtProgress(store.state.player.progress).videoProgress;
            new SplitFragment(store, fragment, split).execute();
        },
        async importVideo(store, path) {
            let videoFile = await store.dispatch('loadMetadata', path);
            let fragment = new VideoFragment(videoFile);
            new AddFragment(store, fragment).execute();
        },
        removeFragment(store, fragment) {
            fragment ??= store.state.activeFragment;
            new DeleteFragment(store, fragment).execute();
        },
        shiftFragment(store, {fragment, shift = 1}) {
            fragment ??= store.state.activeFragment;
            let newIndex = store.state.timeline.indexOf(fragment) + shift;
            if (newIndex < 0 || newIndex >= store.state.timeline.length)
                return;
            new MoveFragment(store, fragment, newIndex).execute();
        },
        addAudioTrack({}) {

        },
        removeAudioTrack({}) {

        },
        async seek({state, commit, getters}, progress) {
            let {fragment, videoProgress} = getters.fragmentAtProgress(progress);
            console.log(videoProgress);
            state.timeline.filter(f => f !== fragment).forEach(f => f.reset());
            fragment.video.element.currentTime = videoProgress * fragment.video.duration;
            commit('activeFragment', fragment);
            if (state.player.playing && fragment.video.element.paused)
                fragment.video.element.play();
        },
        async playNextFragment({state, commit}) {
            let currentIndex = state.timeline.indexOf(state.activeFragment);
            if (currentIndex >= state.timeline.length - 1)
                return;
            let nextFragment = state.timeline[currentIndex + 1];
            let element = nextFragment.video.element;
            element.currentTime = nextFragment.start * nextFragment.video.duration;
            if (!state.activeFragment.video.element.paused)
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
        promptVideoInput({dispatch}) {
            let element = document.createElement('input');
            element.setAttribute('type', 'file');
            element.setAttribute('accept', 'video/*');
            element.setAttribute('multiple', '');
            element.click();
            element.onchange = () => {
                for (let file of element.files)
                    dispatch('importVideo', file.path);
            }
        },
        exportVideo({}) {

        },
        exportToYouTube({}) {

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
