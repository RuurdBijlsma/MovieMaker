import ffbinaries from "ffbinaries";
import EventEmitter from 'events'
import ffmpeg from '../../js/promise-ffmpeg'
import Directories from "../../js/Directories";
import VideoFile from "../../js/VideoFile";
import Vue from 'vue'
import path from 'path';


export default {
    state: {
        paths: false,
        downloadEvent: new EventEmitter(),
        downloading: false,
        videoFileCache: {},
    },
    mutations: {
        videoFileCache: (state, {path, file}) => Vue.set(state.videoFileCache, path, file),
    },
    getters: {},
    actions: {
        async initializeFfmpeg({dispatch, state}) {
            console.log("Getting ffmpeg and ffprobe...");
            await dispatch('getPaths');
            VideoFile.ffmpegPath = state.paths.ffmpeg;
            ffmpeg.setFfmpegPath(state.paths.ffmpeg);
            ffmpeg.setFfprobePath(state.paths.ffprobe);
            console.log("ffmpeg and ffprobe have been retrieved", {ffmpeg});
        },
        getImageFromUrl({}, url) {
            return new Promise(((resolve, reject) => {
                let image = new Image();
                image.src = url;
                image.onload = () => resolve(image);
                image.onerror = reject;
            }));
        },
        async mergeScreenshots({dispatch}, paths) {
            if (paths.length === 0)
                return null;
            let canvas = document.createElement('canvas');
            let context = canvas.getContext('2d');
            let images = await Promise.all(paths.map(p => dispatch('getImageFromUrl', p)));
            canvas.width = images.reduce((a, b) => a + b.width, 0);
            canvas.height = images[0].height;
            let x = 0;
            for (let image of images) {
                context.drawImage(image, x, 0);
                x += image.width;
            }

            return new Promise(((resolve, reject) => {
                canvas.toBlob(b => resolve(URL.createObjectURL(b)), 'image/jpg');
            }))
        },
        async loadMetadata({state, commit, dispatch}, file) {
            if (!state.videoFileCache.hasOwnProperty(file)) {
                let result = await ffmpeg.ffprobe(file);
                let duration = result.format.duration;

                // 1 screenshot per minute
                let ssCount = Math.ceil(duration / 60);
                let promises = [];
                for (let i = 0; i < ssCount; i++) {
                    let timeStamp = duration / ssCount * i;
                    promises.push(ffmpeg.screenshot(file, Directories.temp, timeStamp));
                }
                let screenshots = {all: [], merged: ''};
                Promise.all(promises).then(async ss => {
                    screenshots.all.push(...ss);
                    screenshots.merged = await dispatch('mergeScreenshots', ss);
                });
                commit('videoFileCache', {path: file, file: new VideoFile(result, screenshots)});
            }
            return state.videoFileCache[file];
        },
        async getPaths({state}) {
            const downloadDirectory = Directories.files;
            return new Promise(async (resolve) => {
                if (state.paths)
                    return resolve(state.paths);
                if (state.downloading)
                    return state.downloadEvent.once('downloaded', resolve);

                state.downloading = true;
                ffbinaries.downloadBinaries(['ffmpeg', 'ffprobe'], {destination: downloadDirectory}, () => {
                    state.paths = {
                        ffmpeg: path.join(downloadDirectory, ffbinaries.getBinaryFilename('ffmpeg', ffbinaries.detectPlatform())),
                        ffprobe: path.join(downloadDirectory, ffbinaries.getBinaryFilename('ffprobe', ffbinaries.detectPlatform())),
                    }
                    resolve(state.paths);
                    state.downloadEvent.emit('downloaded');
                    state.downloading = false;
                });
            });
        }
    },
}