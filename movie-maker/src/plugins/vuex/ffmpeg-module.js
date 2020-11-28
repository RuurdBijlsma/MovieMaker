import ffbinaries from "ffbinaries";
import path from "path";
import EventEmitter from 'events'

export default {
    state: {
        paths: false,
        downloadEvent: new EventEmitter(),
        downloading: false,
    },
    mutations: {},
    getters: {},
    actions: {
        async initializeFfmpeg({dispatch}) {
            console.log("Getting ffmpeg and ffprobe...")
            await dispatch('getPaths');
            console.log("ffmpeg and ffprobe have been retrieved")
        },
        async getPaths({state}) {
            const downloadDirectory = './';
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