import electron, {remote} from 'electron'
import path from 'path';

const currentWindow = remote.getCurrentWindow();

export default {
    state: {
        type: 'electron',
        showClosePrompt: false,
    },
    mutations: {
        showClosePrompt: (state, value) => state.showClosePrompt = value,
    },
    getters: {},
    actions: {
        secureClose({commit, rootState, dispatch}) {
            if (rootState.timeline.length > 0) {
                currentWindow.focus();
                commit('showClosePrompt', true);
            } else {
                dispatch('closeWindow');
            }
        },
        async openFolder({}, filePath) {
            if (process.platform === 'win32') {
                require('child_process').exec('explorer /e,/select,"' + filePath + '"');
            } else {
                let folder = path.dirname(filePath);
                require('child_process').exec('start "" "' + folder + '"');
            }
        },
        openDevTools: async ({}) => {
            currentWindow.openDevTools();
        },
        closeWindow: async ({}) => {
            console.log("Sent quit event");
            electron.ipcRenderer.send('quit');
        },
        minimizeWindow: async ({}) => {
            currentWindow.minimize();
        },
    },
}