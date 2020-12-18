<template>
    <v-dialog v-model="$store.state.exportStatus.show" width="700">
        <v-card :loading="true">
            <template slot="progress">
                <v-progress-linear
                    v-if="status.error !== ''"
                    color="warning"
                    :value="100"
                ></v-progress-linear>
                <v-progress-linear
                    v-else-if="isExporting || (status.done && !status.youtube) || youtube.done"
                    color="success"
                    :value="exportProgress * 100"
                ></v-progress-linear>
                <v-progress-linear
                    v-else-if="isUploading"
                    color="red"
                    :value="youtube.progress.percent * 100"
                ></v-progress-linear>
            </template>
            <v-card-title v-if="isUploading">
                2/2 - Uploading video
            </v-card-title>
            <v-card-title v-else-if="isExporting">
                {{ status.youtube ? '1/2 - ' : '' }}Exporting video
            </v-card-title>
            <v-card-title v-else-if="status.error !== ''">
                <v-icon color="warning" class="mr-2">mdi-alert-outline</v-icon>
                An error occurred during video export!
            </v-card-title>
            <v-card-title v-else-if="status.youtube">
                <v-icon color="success" class="mr-2">mdi-check</v-icon>
                Video upload complete!
            </v-card-title>
            <v-card-title v-else>
                <v-icon color="success" class="mr-2">mdi-check</v-icon>
                Video export complete!
            </v-card-title>
            <v-card-subtitle v-if="!status.youtube">
                {{ outputPath }}
            </v-card-subtitle>
            <v-card-text v-if="isUploading || isExporting">
                {{ speed }}
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
                <v-btn text color="error" @click="abort" v-if="(isUploading || isExporting) && status.error === ''">
                    Abort
                </v-btn>
                <v-btn text @click="dismiss" v-else-if="status.error !== ''">
                    Dismiss
                </v-btn>
                <div v-else-if="!status.youtube">
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
                <div v-else>
                    <v-tooltip top>
                        <template v-slot:activator="{ on, attrs }">
                            <v-btn class="mr-2" icon
                                   @click="openFile(youtube.url)"
                                   v-bind="attrs"
                                   color="red"
                                   v-on="on">
                                <v-icon>mdi-youtube</v-icon>
                            </v-btn>
                        </template>
                        <span>Open on YouTube</span>
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
import Utils from "@/js/Utils";

export default {
    name: "ExportStatus",
    data: () => ({}),
    methods: {
        dismiss() {
            this.$store.commit('showExportStatus', false);
        },
        abort() {
            if (this.isExporting) {
                this.status.command.kill();
            } else if (this.isUploading) {
                this.cancelUpload();
            }
            console.log('abort');
        },
        ...mapActions(['openFile', 'cancelUpload', 'openFolder', 'showTextPrompt', 'resetYouTubeStatus', 'resetExportStatus']),
    },
    watch: {
        'status.show'() {
            if (!this.status.show && this.status.error !== '') {
                // when dismissing error, reset status stuff
                this.resetYouTubeStatus();
                this.resetExportStatus();
            }
        },
    },
    computed: {
        speed() {
            if (this.isUploading) {
                let uploaded = Utils.readableBytes(this.youtube.progress.uploaded);
                let total = Utils.readableBytes(this.youtube.progress.total);
                return `Uploaded: ${uploaded} / ${total}`;
            } else if (this.isExporting) {
                let time = this.status.progress.timemark?.substr(3) ?? '00:00.00';
                return `Exported: ${time} / ${this.toHms(this.fullDuration)}`;
            }
            return '';
        },
        ...mapGetters(['exportProgress', 'isExporting', 'isUploading', 'fullDuration', 'toHms']),
        ...mapState({
            status: state => state.exportStatus,
            outputPath: state => state.export.outputPath,
            youtube: state => state.youtube,
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