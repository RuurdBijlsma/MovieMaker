<template>
    <v-dialog v-model="$store.state.exportStatus.show" width="800">
        <v-card :loading="!status.done">
            <template slot="progress">
                <v-progress-linear
                    :color="status.error !== '' ? 'error' : exportProgress > 0.9 ? 'success' : 'primary'"
                    :value="exportProgress * 100"
                ></v-progress-linear>
            </template>
            <v-card-title v-if="isExporting">Exporting video</v-card-title>
            <v-card-title v-else-if="!status.done">
                <v-icon color="warning" class="mr-2">mdi-alert-outline</v-icon>
                An error occurred during video export!
            </v-card-title>
            <v-card-title v-else>
                <v-icon color="success" class="mr-2">mdi-check</v-icon>
                Video export complete!
            </v-card-title>
            <v-card-text>
                {{ outputPath }}
            </v-card-text>
            <div v-if="status.error !== ''">
                <v-card-text class="error--text">
                    {{ status.error }}
                </v-card-text>
                <v-divider></v-divider>
            </div>
            <perfect-scrollbar class="output" v-if="status.output.length > 0">
                <v-expansion-panels>
                    <v-expansion-panel>
                        <v-expansion-panel-header>Show details</v-expansion-panel-header>
                        <v-expansion-panel-content>
                            <p class="output-line" v-for="line in status.output">{{ line }}</p>
                        </v-expansion-panel-content>
                    </v-expansion-panel>
                </v-expansion-panels>
            </perfect-scrollbar>
            <v-divider></v-divider>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn text color="error" @click="abort" v-if="!status.done && isExporting">
                    Abort
                </v-btn>
                <v-btn text v-else-if="!status.done" @click="dismiss">
                    Dismiss
                </v-btn>
                <div v-else>

                    <v-tooltip top>
                        <template v-slot:activator="{ on, attrs }">
                            <v-btn class="mr-2" icon @click="openFolder(outputPath)"
                                   v-bind="attrs"
                                   v-on="on">
                                <v-icon>mdi-folder-outline</v-icon>
                            </v-btn>
                        </template>
                        <span>Open containing folder</span>
                    </v-tooltip>
                    <v-tooltip top>
                        <template v-slot:activator="{ on, attrs }">
                            <v-btn class="mr-6" icon @click="openFile(outputPath)"
                                   v-bind="attrs"
                                   v-on="on">
                                <v-icon>mdi-play</v-icon>
                            </v-btn>
                        </template>
                        <span>Open video</span>
                    </v-tooltip>
                    <v-btn text @click="dismiss">
                        Dismiss
                    </v-btn>
                </div>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script>
import {mapActions, mapGetters, mapState} from "vuex";
import path from 'path'

export default {
    name: "ExportStatus",
    data: () => ({}),
    methods: {
        dismiss() {
            this.$store.commit('showExportStatus', false);
            if (this.status.error)
                this.$store.commit('statusError', '');
        },
        abort() {
            this.status.command.kill();
            console.log('abort');
        },
        ...mapActions(['openFile', 'openFolder']),
    },
    computed: {
        ...mapGetters(['exportProgress', 'isExporting']),
        ...mapState({
            status: state => state.exportStatus,
            outputPath: state => state.export.outputPath,
        }),
    },
}
</script>

<style scoped>
.output {
    max-height: 500px;
    overflow-y: auto;
}

.output-line {
    margin: 0 10px;
    font-size: 13px;
    opacity: 0.8;
    font-family: monospace;
}
</style>