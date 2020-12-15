import VideoFragment from "@/js/VideoFragment";
import objToCommand from "@/js/commands/objToCommand";

export default {
    state: {
        //Stack index always points to index of command that would be undone
        stackIndex: -1,
        undoStack: [],
        hasUnsavedAction: false,
    },
    mutations: {
        hasUnsavedAction: (state, value) => state.hasUnsavedAction = value,
        stackIndex: (state, index) => state.stackIndex = index,
        undoStack: (state, commands) => state.undoStack = commands,
        resetCommands: state => {
            state.stackIndex = -1;
            state.undoStack.splice(0, state.undoStack.length);
        },
        addCommand: (state, command) => {
            // console.log("Command added to stack", command);
            // Erase stack after stackIndex
            state.undoStack.splice(++state.stackIndex);
            state.undoStack.push(command);
        },
        undoCommand: state => {
            while (state.stackIndex > -1) {
                let toUndo = state.undoStack[state.stackIndex--];
                toUndo.undo();
                let nextToUndo = state.undoStack[state.stackIndex];
                if (toUndo.batchOn === false ||
                    toUndo.batchOn !== nextToUndo?.batchOn ||
                    toUndo.constructor.name !== nextToUndo.constructor.name)
                    break;
            }
        },
        redoCommand: state => {
            // When redoing a command, we pick the one to the right of the stackIndex
            while (state.stackIndex < state.undoStack.length - 1) {
                let toRedo = state.undoStack[++state.stackIndex];
                toRedo.execute();
                let nextToRedo = state.undoStack[state.stackIndex + 1];
                if (toRedo.batchOn === false ||
                    toRedo.batchOn !== nextToRedo?.batchOn ||
                    toRedo.constructor.name !== nextToRedo.constructor.name)
                    break;
            }
        },
    },
    getters: {
        canUndo: state => state.stackIndex > -1,
        canRedo: state => state.stackIndex < state.undoStack.length - 1,
        hasProject: (state, getters, rootState) => rootState.activeFragment !== null,
        project: state=>{
            let commands = JSON.parse(JSON.stringify(state.undoStack));
            commands.forEach(c => delete c.batchOn);
            let addFragmentObjects = commands.filter(c => c.name === 'Add fragment').map(c => c.fragment);
            let videos = [...new Set(addFragmentObjects.map(c => c.video))];
            let fragments = {};
            for (let command of commands) {
                if (command.name === 'Add fragment')
                    fragments[command.fragment.id] = command.fragment;
                if (command.name === 'Split fragment') {
                    fragments[command.newFragment.id] = command.newFragment;
                    command.newFragment = command.newFragment.id;
                }
                command.fragment = command.fragment.id;
            }
            return {
                videos,
                fragments,
                index: state.stackIndex,
                commands,
            };
        }
    },
    actions: {
        async discardChangesPrompt({dispatch, state}) {
            if (state.hasUnsavedAction) {
                return await dispatch('showPrompt', {
                    confirmText: 'Discard'
                });
            }
            return true;
        },
        async newProject({commit, state, dispatch}, overwriteFilePath = true) {
            if (await dispatch('discardChangesPrompt'))
                dispatch('clearProject', overwriteFilePath);
        },
        clearProject({commit, state}, overwriteFilePath = true) {
            commit('activeFragment', null);
            commit('resetCommands');
            commit('timeline', []);
            commit('progress', 0);
            commit('hasUnsavedAction', false);
            if (overwriteFilePath)
                commit('projectFilePath', '');
            commit('videosContainer', null);
        },
        async importProject({dispatch, commit, state}, projectString) {
            commit('importProjectLoading', true);
            await dispatch('clearProject', false);
            let {videos, fragments, index, commands} = JSON.parse(projectString);
            let videoFiles = await Promise.all(videos.map(v => dispatch('loadMetadata', v)));
            const recreateFragment = f => VideoFragment.fromObject(
                videoFiles.find(v => v.filePath === f.video),
                f,
            );
            for (let id in fragments) {
                if (fragments.hasOwnProperty(id))
                    fragments[id] = recreateFragment(fragments[id]);
            }
            for (let i = 0; i < commands.length; i++) {
                let command = commands[i];
                command.fragment = fragments[command.fragment]
                if (command.name === 'Split fragment')
                    command.newFragment = fragments[command.newFragment]
            }

            commit('undoStack', commands.map(objToCommand));
            while (state.stackIndex < index) {
                dispatch('redo');
            }
            commit('importProjectLoading', false);
            commit('hasUnsavedAction', false);
        },
        executeCommand({commit, dispatch}, command) {
            commit('hasUnsavedAction', true);
            commit('addCommand', command);
            command.execute();
            dispatch('printUndoStack');
        },
        printUndoStack({state}) {
            let result = '';
            for (let i = 0; i < state.undoStack.length; i++) {
                let batch = state.undoStack[i].batchOn;
                result += batch !== false ? '| ' : '- ';
                result += state.undoStack[i].constructor.name;
                if (i === state.stackIndex) {
                    result += ' <-- Would be undone';
                }
                if (batch !== false)
                    result += ' : ' + batch;
                result += '\n';
            }
        },
    },
}