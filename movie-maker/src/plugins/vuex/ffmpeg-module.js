import ffbinaries from "ffbinaries";
import EventEmitter from 'events'
import ffmpeg from '../../js/promise-ffmpeg'
import Directories from "../../js/Directories";
import VideoFile from "../../js/VideoFile";
import Vue from 'vue'
import path from 'path';
import fs from "fs";
import Utils from "@/js/Utils";


export default {
    state: {
        paths: false,
        downloadEvent: new EventEmitter(),
        downloading: false,
        ffmpegReady: false,
        videoFileCache: {},
    },
    mutations: {
        videoFileCache: (state, {path, file}) => Vue.set(state.videoFileCache, path, file),
    },
    getters: {},
    actions: {
        async exportVideo({state, rootState}, filePath) {
            let command = ffmpeg();
            for (let video of rootState.videoFiles) {
                command = command
                    .input(video.filePath.replace(/\\/gi, '/'))
            }
            let fragments = rootState.timeline;
            const parseFilter = subFilters => subFilters.map(sf => `${sf[0]}=${sf[1]}`).join(',');
            let filter = [];
            for (let i = 0; i < fragments.length; i++) {
                let fragment = fragments[i];
                let videoIndex = rootState.videoFiles.indexOf(fragment.video);
                let start = fragment.start * fragment.video.duration;
                let end = fragment.end * fragment.video.duration;
                filter.push({
                    filter: parseFilter([
                        ['trim', `start=${start}:end=${end}`],
                        ['setpts', `${1 / fragment.playbackRate}*(PTS-STARTPTS)`],
                    ]),
                    inputs: `[${videoIndex}:v]`,
                    outputs: 'v' + i,
                });
                let tempoCommands = [];
                let playbackRate = fragment.playbackRate;
                let minTempo = 0.5;
                while (true) {
                    if (playbackRate < minTempo) {
                        tempoCommands.push(['atempo', `0.5`]);
                        playbackRate *= 2;
                    } else {
                        tempoCommands.push(['atempo', `${playbackRate}`]);
                        break;
                    }
                }
                console.log(tempoCommands)
                filter.push({
                    filter: parseFilter([
                        ['atrim', `start=${start}:end=${end}`],
                        ['asetpts', `PTS-STARTPTS`],
                        ...tempoCommands,
                        ['volume', `${fragment.volume}`],
                    ]),
                    inputs: `[${videoIndex}:a]`,
                    outputs: 'a' + i,
                });
            }
            filter.push({
                filter: 'concat',
                options: `n=${fragments.length}:a=1`,
                inputs: fragments.flatMap((f, i) => ['v' + i, 'a' + i]),
                outputs: 'out',
            });
            command = command.complexFilter(filter, 'out')
            command = command
                .on('start', commandLine => {
                    console.log("Spawned ffmepg with command", commandLine);
                })
                .on('progress', progress => {
                    console.log("ffmpeg progress", progress.percent);
                })
                .on('error', (err, stdout, stderr) => {
                    console.warn("ffmpeg error", err, stdout, stderr);
                })
                .on('end', (stdout, stderr) => {
                    console.log("ffmpeg DONE", stdout, stderr);
                })
                .saveToFile(filePath);

            console.log({ffmpeg, command});
            // todo: set to desired fps from export options
            // .fps(60)
            // .size('2560x1440')
            // .autopad('black')
        },
        async initializeFfmpeg({dispatch, state}) {
            console.log("Getting ffmpeg and ffprobe...");
            await dispatch('getPaths');
            VideoFile.ffmpegPath = state.paths.ffmpeg;
            ffmpeg.setFfmpegPath(state.paths.ffmpeg);
            ffmpeg.setFfprobePath(state.paths.ffprobe);
            console.log("ffmpeg and ffprobe have been retrieved", {ffmpeg});
            setTimeout(() => {
                state.ffmpegReady = true;
                state.downloadEvent.emit('ffmpegReady');
            }, 500);
        },
        async waitForFfmpeg({state}) {
            return new Promise(resolve => {
                if (state.ffmpegReady)
                    resolve();
                state.downloadEvent.once('ffmpegReady', resolve);
            });
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

            return new Promise(((resolve) => {
                canvas.toBlob(b => resolve(URL.createObjectURL(b)), 'image/jpg');
            }))
        },
        async loadMetadata({state, commit, dispatch}, file) {
            if (!state.videoFileCache.hasOwnProperty(file)) {
                // Wait for getPaths to be done
                await dispatch('waitForFfmpeg');
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
        },
        async waitForFileUnlock({dispatch}, {filePath, timeout = 10000}) {
            let startTime = performance.now();
            while (true) {
                if (performance.now() > startTime + timeout)
                    throw "Timeout waiting for file to unlock";
                let isFileLocked = await dispatch('isFileLocked', filePath);
                console.log("is file locked?", isFileLocked);
                if (!isFileLocked)
                    return true;
                await Utils.waitSleep(150);
            }
        },
        async isFileLocked({dispatch}, filePath) {
            return new Promise((resolve, reject) => {
                fs.open(filePath, 'r+', (err, fd) => {
                    console.log(err, fd);
                    if (err && err.code === 'EBUSY') {
                        resolve(true);
                    } else if (err && err.code === 'ENOENT') {
                        reject("File does not exist");
                    } else {
                        fs.close(fd, err => {
                            if (err)
                                return reject(err);
                            resolve(false);
                        })
                    }
                });
            })
        },
    },
}