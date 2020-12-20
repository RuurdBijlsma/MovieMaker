<template>
    <v-sheet class="history-container">
        <v-divider vertical></v-divider>
        <perfect-scrollbar class="history">
            <h4 class="text-center mt-3">History</h4>
            <v-list color="transparent" dense rounded>
                <v-list-item ref="commands" class="command"
                             :class="{
                                'executed-command': command.active,
                                'active-command': i === visualIndex - 1,
                             }"
                             v-for="(command, i) in visualCommands" :key="i"
                             @click="revertHistory(i)">
                    <v-list-item-avatar>
                        <v-icon :color="i === visualIndex - 1 ? 'primary' : ''">{{ getIcon(command) }}</v-icon>
                    </v-list-item-avatar>
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
import Utils from "@/js/Utils";

export default {
    name: "History",
    data: () => ({
        historyIcons: {
            'Add fragment': 'mdi-import',
            'Delete fragment': 'mdi-delete',
            'Move fragment': 'mdi-chevron-right',
            'Set end point': 'mdi-contain-end',
            'Set playback rate': 'mdi-speedometer',
            'Set start point': 'mdi-contain-start',
            'Duplicate fragment': 'mdi-content-duplicate',
            'Set volume': 'mdi-volume-high',
            'Split fragment': 'mdi-arrow-split-vertical',
        },
    }),
    methods: {
        revertHistory(index) {
            let count = index - this.visualIndex + 1;
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
                case name === "Move fragment":
                    return command.newIndex - command.oldIndex > 0 ? 'mdi-chevron-right' : 'mdi-chevron-left';
                case name in this.historyIcons:
                    return this.historyIcons[name];
                default:
                    return 'mdi-question-mark';
            }
        },
        getValue(command) {
            switch (command.name) {
                case "Add fragment":
                    return command.fragment.video.fileName;
                case "Delete fragment":
                    return command.fragment.video.fileName;
                case "Move fragment":
                    return command.newIndex - command.oldIndex > 0 ? 'Right' : 'Left';
                case "Set playback rate":
                    return command.newRate.toFixed(2) + 'x';
                case "Set volume":
                    return (command.newVolume * 100).toFixed(0) + '%';
                default:
                    return false;
            }
        },
        ...mapActions(['undo', 'redo']),
    },
    watch: {
        visualIndex() {
            this.$nextTick(()=>{
                let commandIndex = Utils.clamp(this.visualIndex - 1, 0, this.$refs.commands.length - 1);
                let element = this.$refs.commands[commandIndex];
                if (element?.$el)
                    element.$el.scrollIntoViewIfNeeded();
            });
        },
    },
    computed: {
        visualIndex() {
            let visualIndex = this.visualCommands.findIndex(c => !c.active);
            return visualIndex === -1 ? this.visualCommands.length : visualIndex;
        },
        visualCommands() {
            let visualCommands = [];
            for (let i = 0; i < this.undoStack.length; i++) {
                let command = this.undoStack[i];
                let prevCommand = this.undoStack[i - 1];
                if (command.batchOn !== false &&
                    command.batchOn === prevCommand?.batchOn &&
                    command.name === prevCommand.name) {
                    let previous = visualCommands[visualCommands.length - 1];
                    previous.batchCount++;
                    previous.value = this.getValue(command);
                } else {
                    // for (let j = 0; j < 30; j++)
                    visualCommands.push({
                        name: command.name,
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
    height: 100%;
    min-width: 240px;
    max-width: 240px;
    position: relative;
}

.history {
    width: 100%;
    overflow-y: auto;
    position: relative;
}

.command {
    opacity: 0.4;
}

.active-command {
    /*background-color: red;*/
    pointer-events: none;
}

.executed-command {
    opacity: 1;
}
</style>