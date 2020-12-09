<template>
    <v-sheet class="history-container">
        <v-divider vertical></v-divider>
        <perfect-scrollbar class="history">
            <h4 class="text-center mb-2 mt-3">History</h4>
            <v-divider></v-divider>
            <v-list color="transparent" dense rounded>
                <v-list-item class="command" :class="{'active-command': command.active}"
                             v-for="(command, i) in visualCommands" :key="i"
                             @click="revertHistory(i)">
                    <v-list-item-icon>
                        <v-icon>{{ getIcon(command) }}</v-icon>
                    </v-list-item-icon>
                    <v-list-item-content>
                        <v-list-item-title>
                            {{ command.name }}
                        </v-list-item-title>
                        <v-list-item-subtitle :title="command.value" v-if="command.value">
                            {{ command.value }}
                        </v-list-item-subtitle>
                    </v-list-item-content>
                </v-list-item>
            </v-list>
        </perfect-scrollbar>
    </v-sheet>
</template>

<script>
import {mapActions, mapState} from "vuex";

export default {
    name: "History",
    data: () => ({
        historyIcons: {
            AddFragment: 'mdi-import',
            DeleteFragment: 'mdi-delete',
            MoveFragment: 'mdi-chevron-right',
            SetEndPoint: 'mdi-contain-end',
            SetPlaybackRate: 'mdi-speedometer',
            SetStartPoint: 'mdi-contain-start',
            SetVolume: 'mdi-volume-high',
            SplitFragment: 'mdi-arrow-split-vertical',
        },
    }),
    methods: {
        revertHistory(index) {
            let visualIndex = this.visualCommands.findIndex(c => !c.active);
            visualIndex = visualIndex === -1 ? this.visualCommands.length : visualIndex;
            let count = index - visualIndex + 1;
            console.log(count);
            if (count < 0)
                for (let i = 0; i > count; i--)
                    this.undo();
            else if (count > 0)
                for (let i = 0; i < count; i++)
                    this.redo();
        },
        getIcon(visualCommand) {
            let {name, command} = visualCommand;
            switch (true) {
                case name === "MoveFragment":
                    return command.newIndex - command.oldIndex > 0 ? 'mdi-chevron-right' : 'mdi-chevron-left';
                case name in this.historyIcons:
                    return this.historyIcons[name];
                default:
                    return 'mdi-question-mark';
            }
        },
        getValue(command) {
            switch (command.constructor.name) {
                case "AddFragment":
                    return command.fragment.video.fileName;
                case "DeleteFragment":
                    return command.fragment.video.fileName;
                case "MoveFragment":
                    return command.newIndex - command.oldIndex > 0 ? 'Right' : 'Left';
                case "SetPlaybackRate":
                    return command.newRate.toFixed(2) + 'x';
                case "SetVolume":
                    return (command.newVolume * 100).toFixed(0) + '%';
                default:
                    return false;
            }
        },
        ...mapActions(['undo', 'redo']),
    },
    computed: {
        visualCommands() {
            let visualCommands = [];
            for (let i = 0; i < this.undoStack.length; i++) {
                let command = this.undoStack[i];
                let prevCommand = this.undoStack[i - 1];
                if (command.batchOn !== false &&
                    command.batchOn === prevCommand?.batchOn &&
                    command.constructor.name === prevCommand.constructor.name) {
                    let previous = visualCommands[visualCommands.length - 1];
                    previous.batchCount++;
                    previous.value = this.getValue(command);
                } else {
                    // for (let j = 0; j < 30; j++)
                    visualCommands.push({
                        name: command.constructor.name,
                        batchCount: 1,
                        active: i <= this.stackIndex,
                        value: this.getValue(command),
                        command,
                    });
                }
            }
            return visualCommands;
        },
        ...mapState({
            undoStack: state => state.command.undoStack,
            stackIndex: state => state.command.stackIndex,
        }),
    }
}
</script>

<style scoped>
.history-container {
    display: flex;
    max-height: 100%;
    min-width: 240px;
    max-width: 240px;
    position: relative;
}

.history {
    width: 100%;
    height: 100%;
    overflow-y: auto;
    position: relative;
}

.command {
    opacity: 0.5;
}

.active-command {
    opacity: 1;
}
</style>