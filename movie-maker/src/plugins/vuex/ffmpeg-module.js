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
        availableFormats: [],
    },
    mutations: {
        availableFormats: (state, formats) => state.availableFormats = formats,
        videoFileCache: (state, {path, file}) => Vue.set(state.videoFileCache, path, file),
    },
    getters: {
        complexFilter: (state, getters, rootState) => {
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
            return filter;
        }
    },
    actions: {
        async exportVideo({dispatch, state, rootState, getters, commit}, filePath) {
            if (getters.isExporting) {
                return dispatch('addSnack', {text: "A video is already exporting, abort it before trying again"})
            }
            commit('statusDone', false);
            commit('statusProgress', 0);
            commit('statusOutput', []);
            commit('statusError', '');
            commit('showExportStatus', true);
            commit('showExportStatus', true);

            let command = ffmpeg();
            commit('statusCommand', command);

            for (let video of rootState.videoFiles)
                command = command.input(Utils.fixPath(video.filePath))
            command = command.complexFilter(getters.complexFilter, 'out')
                .on('start', commandLine => {
                    console.log("Spawned ffmepg with command", commandLine)
                    commit('addStatusOutput', commandLine);
                })
                .on('stderr', line => commit('addStatusOutput', line))
                .on('progress', progress => commit('statusProgress', progress))
                .on('error', (err, stdout, stderr) => {
                    commit('statusCommand', null);
                    commit('statusError', err)
                })
                .on('end', (stdout, stderr) => {
                    commit('statusDone', true);
                    commit('statusCommand', null);
                })
                .saveToFile(filePath);

            console.log({ffmpeg, command});
            // todo: set to desired fps from export options
            // .fps(60)
            // .size('2560x1440')
            // .autopad('black')
        },
        async getLoudness({}, {filePath, loudness = {}}) {
            return new Promise(((resolve, reject) => {
                let min = Infinity, max = -Infinity;
                loudness.dbMin = -45;
                loudness.dbMax = 0;
                loudness.absLoudness = 0.8;
                loudness.data = [];
                let filter = [
                    {
                        filter: 'ebur128',
                        inputs: '[0:a]',
                        options: 'peak=true',
                        outputs: 'out',
                    }
                ];
                ffmpeg()
                    .input(Utils.fixPath(filePath))
                    .complexFilter(filter, 'out')
                    .on('error', (err, stdout, stderr) => reject({err, stdout, stderr}))
                    .on('stderr', line => {
                        line = line.trim();
                        if (line.startsWith('LRA low:'))
                            loudness.low = +line.split(' ').filter(n => n !== '')[2];
                        if (line.startsWith('LRA high:'))
                            loudness.high = +line.split(' ').filter(n => n !== '')[2];
                        if (line.startsWith('I:'))
                            loudness.integrated = +line.split(' ').filter(n => n !== '')[1];
                        // console.log(line);
                        if (!line.startsWith('[Parsed_ebur128'))
                            return;
                        let time = line.split('t:')[1]?.trim()?.split(' ')?.[0];
                        let m = line.split('M:')[1]?.trim()?.split(' ')?.[0];
                        // let s = line.split('S:')[1]?.trim()?.split(' ')?.[0];
                        // let i = line.split('I:')[1]?.trim()?.split(' ')?.[0];
                        // let lra = line.split('LRA:')[1]?.trim()?.split(' ')?.[0];
                        // let ftpk = line.split('FTPK:')[1]?.trim()?.split(' ')?.[0];
                        let tpk = line.split('TPK:')[1]?.trim()?.split(' ')?.[0];
                        if (time !== undefined && m !== undefined) {
                            let db = +tpk;
                            loudness.data.push({
                                time: +time,
                                volume: Math.exp(db),
                                db: db,
                            });
                            if (db < min)
                                min = db;
                            if (db > max)
                                max = db;
                        }
                    })
                    .on('end', () => {
                        let absMin = -45;
                        let absMax = 0;
                        loudness.absLoudness = (loudness.integrated - absMin) / (absMax - absMin)
                        loudness.dbMin = min;
                        loudness.dbMax = max;
                        resolve(loudness);
                    })
                    .format('null')
                    .saveToFile('-')
            }))
        },
        async getFormats({}) {
            return new Promise(((resolve, reject) => {
                ffmpeg.getAvailableFormats((err, result) => {
                    if (err)
                        return reject(err);
                    let formats = [];
                    for (let extension in result) {
                        if (!result.hasOwnProperty(extension))
                            continue;
                        let {description, canMux, canDemux} = result[extension];
                        if (canMux && canDemux)
                            formats.push({extension, description});
                    }

                    let mp4 = formats.splice(formats.findIndex(f => f.extension === 'mp4'), 1);
                    formats.unshift(mp4[0]);
                    formats = formats
                        .map(format => ({
                            name: format.description,
                            extensions: [format.extension],
                        }));

                    resolve(formats);
                });
            }))
        },
        async initializeFfmpeg({dispatch, state, commit}) {
            console.log("Getting ffmpeg and ffprobe...");
            await dispatch('getPaths');
            VideoFile.ffmpegPath = state.paths.ffmpeg;
            ffmpeg.setFfmpegPath(state.paths.ffmpeg);
            ffmpeg.setFfprobePath(state.paths.ffprobe);
            console.log("ffmpeg and ffprobe have been retrieved", {ffmpeg});
            setTimeout(() => {
                state.ffmpegReady = true;
                state.downloadEvent.emit('ffmpegReady');
            }, 800);
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

                let loudness = {};
                let videoFile = new VideoFile(result, screenshots, loudness);
                dispatch('getLoudness', {
                    filePath: file,
                    loudness,
                }).then(() => console.log(videoFile))
                commit('videoFileCache', {path: file, file: videoFile});
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