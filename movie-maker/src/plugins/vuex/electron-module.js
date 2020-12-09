import electron, {remote} from 'electron'
import path from 'path';
import os from 'os'

export default {
    state: {
        type: 'electron',
    },
    mutations: {},
    getters: {},
    actions: {
        async openFolder({}, filePath) {
            if (process.platform === 'win32') {
                require('child_process').exec('explorer /e,/select,"' + filePath + '"');
            } else {
                let folder = path.dirname(filePath);
                require('child_process').exec('start "" "' + folder + '"');
            }
        },
    },
}