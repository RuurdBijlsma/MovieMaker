<template>
    <v-dialog v-model="$store.state.exportStatus.show" width="800">
        <v-card :loading="!status.done">
            <template slot="progress">
                <v-progress-linear
                    color="primary"
                    :value="exportProgress * 100"
                ></v-progress-linear>
            </template>
            <v-card-title>Exporting video</v-card-title>
            <perfect-scrollbar class="output" v-if="status.output.length > 0">
                <v-expansion-panels>
                    <v-expansion-panel>
                        <v-expansion-panel-header>Show export output</v-expansion-panel-header>
                        <v-expansion-panel-content>
                            <p class="output-line" v-for="line in status.output">{{ line }}</p>
                        </v-expansion-panel-content>
                    </v-expansion-panel>
                </v-expansion-panels>
            </perfect-scrollbar>
            <div v-if="status.error !== ''">
                <v-card-title>Error</v-card-title>
                <v-card-text class="error--text">
                    {{ status.error }}
                </v-card-text>
            </div>
            <v-divider></v-divider>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn text color="error" @click="abort" v-if="!status.done">
                    Abort
                </v-btn>
                <div v-else>
                    <v-btn text @click="openVideoFolder">
                        Open containing folder
                    </v-btn>
                    <v-btn text @click="openVideo">
                        Open video
                    </v-btn>
                    <v-btn text color="success" @click="dismiss">
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
        openVideo() {

        },
        openVideoFolder() {

        },
        dismiss() {
            this.$store.commit('showExportStatus', false);
        },
        abort() {
            console.log('abort');
        },
    },
    computed: {
        ...mapGetters(['exportProgress']),
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