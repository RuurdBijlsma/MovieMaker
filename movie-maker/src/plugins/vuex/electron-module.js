import electron, {remote} from 'electron'
import path from 'path';
import ofs from 'fs';
import Directories from "@/js/Directories";

const fs = ofs.promises;
const currentWindow = remote.getCurrentWindow();

export default {
    state: {
        prompt: {
            show: false,
            title: '',
            subtitle: '',
            cancelText: '',
            confirmText: '',
            onConfirm: () => 0,
            onCancel: () => 0,
        },
    },
    mutations: {
        hidePrompt: state => state.prompt.show = false,
        showPrompt: (state, {
            title = 'Are you sure?',
            subtitle = 'There may be unsaved changes',
            cancelText = 'Cancel',
            confirmText = 'Confirm',
            onConfirm = () => 0,
            onCancel = () => 0,
        }) => {
            state.prompt.show = true;
            state.prompt.title = title;
            state.prompt.subtitle = subtitle;
            state.prompt.cancelText = cancelText;
            state.prompt.confirmText = confirmText;
            state.prompt.onConfirm = onConfirm;
            state.prompt.onCancel = onCancel;
        },
    },
    getters: {
        systemProgress: (state, getters, rootState) => {
            let status = rootState.exportStatus;
            if (getters.isExporting) {
                currentWindow.setProgressBar(getters.exportProgress, {mode: 'normal'});
            } else if (status.error !== '') {
                currentWindow.setProgressBar(1, {mode: 'error'});
            } else {
                currentWindow.setProgressBar(-1, {mode: 'normal'});
            }
        }
    },
    actions: {
        updateSystemProgress({getters}) {
            currentWindow.setProgressBar(...getters.systemProgress);
        },
        async showPrompt({commit}, {
            title = 'Are you sure?',
            subtitle = 'This will discard all unsaved changes',
            cancelText = 'Cancel',
            confirmText = 'Confirm',
        }) {
            return new Promise((resolve => {
                commit('showPrompt', {
                    title,
                    subtitle,
                    cancelText,
                    confirmText,
                    onConfirm: () => resolve(true),
                    onCancel: () => resolve(false),
                })
            }));
        },
        previousPath({}, {key = '', defaultPath = Directories.videos}) {
            return localStorage.getItem('previousPath' + key) ?? defaultPath;
        },
        usePath({}, {key = '', usedPath}) {
            localStorage['previousPath' + key] = path.basename(usedPath);
        },
        async promptVideoExport({dispatch, commit}) {
            let formats = await dispatch('getFormats');

            let {canceled, filePath} = await remote.dialog.showSaveDialog(remote.getCurrentWindow(), {
                title: "Export video",
                defaultPath: await dispatch('previousPath', {key: 'videoExport'}),
                buttonLabel: 'Export video',
                filters: formats,
            });

            if (!canceled) {
                commit('exportOutputPath', filePath);
                dispatch('usePath', {key: 'videoExport', usedPath: filePath})
            }
            return {canceled, filePath};
        },
        async exportVideoAs({dispatch, getters}) {
            if (!getters.hasProject)
                return;
            let {canceled, filePath} = await dispatch('promptVideoExport');
            if (!canceled) {
                console.log("EXPORT", filePath);
                await dispatch('exportVideo', filePath);
            }
        },
        async promptVideoInput({dispatch, commit}) {
            let {canceled, filePaths} = await remote.dialog.showOpenDialog(remote.getCurrentWindow(), {
                title: "Import video",
                defaultPath: await dispatch('previousPath', {key: 'video'}),
                filters: [
                    {name: "Videos", extensions: ['mp4', 'ogg', 'webm']},
                    {name: "All Files", extensions: ['*']},
                ],
                properties: ['openFile', 'multiSelections'],
            });
            if (!canceled) {
                dispatch('usePath', {key: 'video', usedPath: filePaths[0]})
                commit('importVideoLoading', true);
                await Promise.all(filePaths.map(f => dispatch('importVideo', f)));
                commit('importVideoLoading', false);
            }
        },
        async importProjectByPath({dispatch, commit}, filePath) {
            try {
                let data = await fs.readFile(filePath);
                commit('projectFilePath', filePath);
                dispatch('importProject', data);
            } catch (e) {
                dispatch("addSnack", {text: "Could not open project"});
            }
        },
        async promptProjectInput({dispatch}) {
            if (!(await dispatch('discardChangesPrompt')))
                return;
            let {canceled, filePaths} = await remote.dialog.showOpenDialog(remote.getCurrentWindow(), {
                title: "Open project",
                defaultPath: await dispatch('previousPath', {key: 'project'}),
                filters: [{name: "Ruurd Movie Maker Project", extensions: ["rmm"]}],
                properties: ["openFile"],
            });
            if (!canceled) {
                dispatch('usePath', {key: 'project', usedPath: filePaths[0]})
                dispatch('importProjectByPath', filePaths[0]);
            }
        },
        async saveProjectToFile({getters, dispatch, commit}, filePath) {
            if (!getters.hasProject)
                return;
            console.log("Saving project to file", filePath);
            let project = JSON.stringify(getters.project)
            try {
                await fs.writeFile(filePath, project);
                commit('projectFilePath', filePath);
                commit('hasUnsavedAction', false);
                dispatch("addSnack", {text: "Project saved!"}).then();
            } catch (e) {
                console.warn("save file err", e);
                dispatch("addSnack", {text: "Could not save project"}).then();
            }
        },
        async saveProject({rootState, dispatch}) {
            if (rootState.projectFilePath !== '') {
                await dispatch('saveProjectToFile', rootState.projectFilePath);
            } else {
                await dispatch('saveProjectAs');
            }
        },
        async saveProjectAs({dispatch, getters}) {
            if (!getters.hasProject)
                return;
            let {canceled, filePath} = await remote.dialog.showSaveDialog(remote.getCurrentWindow(), {
                title: "Save project as...",
                defaultPath: await dispatch('previousPath', {key: 'project'}),
                filters: [{name: "Ruurd Movie Maker Project", extensions: ["rmm"]}],
            });
            if (!canceled) {
                dispatch('usePath', {key: 'project', usedPath: filePath})
                await dispatch('saveProjectToFile', filePath);
            }
        },
        async clearDirectory({dispatch}, directory) {
            try {
                let files = await fs.readdir(directory);
                await Promise.all(
                    files.map(f => fs.unlink(path.join(directory, f)))
                );
            } catch (e) {
            }
        },
        async secureClose({commit, rootState, dispatch}) {
            if (rootState.command.hasUnsavedAction) {
                currentWindow.focus();
                commit('showPrompt', {
                    title: 'Are you sure you want to close?',
                    subtitle: 'You may have unsaved changes',
                    confirmText: 'Close',
                    onConfirm: () => dispatch('closeWindow'),
                });
            } else {
                dispatch('closeWindow');
            }
        },
        async openFile({}, filePath) {
            await electron.shell.openExternal(filePath);
        },
        async openFolder({}, filePath) {
            if (process.platform === 'win32') {
                require('child_process').exec('explorer /e,/select,"' + filePath + '"');
            } else {
                let folder = path.dirname(filePath);
                require('child_process').exec('start "" "' + folder + '"');
            }
        },
        async openDevTools({}) {
            currentWindow.openDevTools();
        },
        async closeWindow({dispatch}) {
            await dispatch('clearDirectory', Directories.temp);
            console.log("Sent quit event");
            electron.ipcRenderer.send('quit');
        },
        minimizeWindow: async ({}) => {
            currentWindow.minimize();
        },
    },
}