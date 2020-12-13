import electron, {remote} from 'electron'
import path from 'path';
import fs from "fs";

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
        async promptVideoInput({dispatch, commit}) {
            let defaultPath = remote.app.getPath('videos');
            let {canceled, filePaths} = await remote.dialog.showOpenDialog(remote.getCurrentWindow(), {
                title: "Import video",
                defaultPath,
                filters: [
                    {name: "Videos", extensions: ['mp4', 'ogg', 'webm']},
                    {name: "All Files", extensions: ['*']},
                ],
                properties: ['openFile', 'multiSelections'],
            });
            if (!canceled) {
                commit('importVideoLoading', true);
                await Promise.all(filePaths.map(f => dispatch('importVideo', f)));
                commit('importVideoLoading', false);
            }
        },
        async importProjectByPath({dispatch, commit}, filePath) {
            fs.readFile(filePath, (err, data) => {
                if (err) {
                    dispatch("addSnack", {text: "Could not open project"});
                    return;
                }
                commit('projectFilePath', filePath);
                dispatch('importProject', data);
            });
        },
        async promptProjectInput({dispatch}) {
            let defaultPath = remote.app.getPath('videos');
            let {canceled, filePaths} = await remote.dialog.showOpenDialog(remote.getCurrentWindow(), {
                title: "Open project",
                defaultPath,
                filters: [{name: "Ruurd Movie Maker Project", extensions: ["rmm"]}],
                properties: ["openFile"],
            });
            if (!canceled) {
                dispatch('importProjectByPath', filePaths[0]);
            }
        },
        async saveProjectToFile({getters, dispatch, commit}, filePath) {
            if (!getters.hasProject)
                return;
            console.log("Saving project to file", filePath);
            let project = await dispatch('exportProject');
            fs.writeFile(filePath, project, err => {
                if (err) {
                    console.warn("save file err", err);
                    dispatch("addSnack", {text: "Could not save project"}).then();
                    return;
                }
                commit('projectFilePath', filePath);
                dispatch("addSnack", {text: "Project saved!"}).then();
            });
        },
        async saveProject({rootState, dispatch}) {
            if (rootState.projectFilePath !== '') {
                await dispatch('saveProjectToFile', rootState.projectFilePath);
            } else {
                await dispatch('saveProjectAs');
            }
        },
        async saveProjectAs({dispatch}) {
            let defaultPath = remote.app.getPath('videos');
            let {canceled, filePath} = await remote.dialog.showSaveDialog(remote.getCurrentWindow(), {
                title: "Save project as...",
                defaultPath,
                filters: [{name: "Ruurd Movie Maker Project", extensions: ["rmm"]}],
            });
            if (!canceled) {
                await dispatch('saveProjectToFile', filePath);
            }
        },
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