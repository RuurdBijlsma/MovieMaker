export default {
    state: {
        //Stack index always points to index of command that would be undone
        stackIndex: -1,
        undoStack: [],
    },
    mutations: {
        addCommand: (state, command) => {
            console.log("Command added to stack", command);
            // Erase stack after stackIndex
            state.undoStack.splice(++state.stackIndex);
            state.undoStack.push(command);
        },
        undoCommand: state => {
            while (state.stackIndex > -1) {
                let toUndo = state.undoStack[state.stackIndex--];
                toUndo.undo();
                let nextToUndo = state.undoStack[state.stackIndex];
                if (toUndo.batchOn === false || toUndo.batchOn !== nextToUndo?.batchOn)
                    break;
            }
        },
        redoCommand: state => {
            // When redoing a command, we pick the one to the right of the stackIndex
            while (state.stackIndex < state.undoStack.length - 1) {
                let toRedo = state.undoStack[++state.stackIndex];
                toRedo.execute();
                let nextToRedo = state.undoStack[state.stackIndex + 1];
                if (toRedo.batchOn === false || toRedo.batchOn !== nextToRedo?.batchOn)
                    break;
            }
        },
    },
    getters: {
        canUndo: state => state.stackIndex > -1,
        canRedo: state => state.stackIndex < state.undoStack.length - 1,
    },
    actions: {
        executeCommand({commit, dispatch}, command) {
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
            console.log(result, 'stackIndex: ' + state.stackIndex);
        },
    },
}