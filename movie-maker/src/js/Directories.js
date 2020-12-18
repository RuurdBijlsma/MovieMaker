import electron from 'electron';
import fs from 'fs';
import path from 'path';

class Directories {
    constructor() {
        this.temp = this.initializeDir('temp', 'moviemaker');
        this.files = this.initializeDir('appData', 'moviemaker-files');
        this.videos = this.getDir('videos', '');
    }

    initializeDir(base, dir) {
        let fullDir = this.getDir(base, dir);
        this.createDir(fullDir);
        return fullDir;
    }

    getDir(base = 'music', dir = 'files') {
        let app = electron.app;
        if (electron.hasOwnProperty('remote'))
            app = electron.remote.app;
        return path.join(app.getPath(base), dir);
    }

    createDir(dir) {
        if (!fs.existsSync(dir))
            fs.mkdirSync(dir);
    }

    importLSFile() {
        let localStorageFile = path.join(this.files, 'ls.json');

        if (Object.keys(localStorage).length === 0 && fs.existsSync(localStorageFile)) {
            let ls = JSON.parse(fs.readFileSync(localStorageFile));
            for (let key in ls)
                if (ls.hasOwnProperty(key))
                    localStorage[key] = ls[key];
        }
    }
}

export default new Directories();