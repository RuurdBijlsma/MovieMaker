<template>
    <v-dialog v-model="$store.state.export.showDialog" width="800">
        <v-card>
            <v-card-title>Export video</v-card-title>
            <v-card-text>
                <div class="output-path">
                    <v-text-field label="Output path"
                                  outlined
                                  dense
                                  :rules="pathRules"
                                  class="mt-5"
                                  v-model="$store.state.export.outputPath"></v-text-field>
                    <v-btn @click="promptVideoExport" rounded class="ml-4 mb-1" text>...</v-btn>
                </div>
                <v-text-field label="Output FPS (optional)"
                              outlined
                              dense
                              v-model="$store.state.export.fps"
                              type="number"></v-text-field>
                <v-switch v-if="$store.state.export.fps !== ''"
                          label="Interpolate frames"
                          class="interpolate-switch"
                          v-model="$store.state.export.interpolate"></v-switch>
                <v-text-field label="Video bitrate (MB/s, optional)"
                              outlined
                              dense
                              v-model="$store.state.export.bitrate"
                              hide-details="auto"
                              type="number"></v-text-field>
                <v-switch v-model="$store.state.export.customResolution" label="Change output resolution"></v-switch>
                <div class="resolution">
                    <v-text-field label="Width"
                                  outlined
                                  :disabled="!$store.state.export.customResolution"
                                  dense
                                  v-model="exportWidth"
                                  type="number"></v-text-field>
                    <p>x</p>
                    <v-text-field label="Height"
                                  :disabled="!$store.state.export.customResolution"
                                  outlined
                                  dense
                                  v-model="exportHeight"
                                  type="number"></v-text-field>
                </div>
            </v-card-text>
            <v-divider></v-divider>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn text @click="cancel">
                    Cancel
                </v-btn>
                <v-btn color="primary" text @click="confirm">
                    Export
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script>
import {mapActions, mapState} from "vuex";
import path from 'path'

export default {
    name: "ExportDialog",
    data: () => ({
        pathRules: [
            v => path.isAbsolute(v) || 'Must be a valid path',
        ],
    }),
    methods: {
        cancel() {
            this.$store.commit('showExportDialog', false);
        },
        confirm() {
            if (path.isAbsolute(this.outputPath)) {
                this.$store.dispatch('exportVideo');
                this.$store.commit('showExportDialog', false);
            } else {
                this.$store.dispatch('addSnack', {text: `Given path "${this.outputPath}" is not valid`});
            }
        },
        ...mapActions(['promptVideoExport']),
    },
    computed: {
        exportHeight: {
            get: function () {
                let state = this.$store.state;
                return state.export.customResolution ?
                    state.export.height :
                    state.activeFragment?.video?.height;
            },
            set: function (height) {
                if (this.$store.state.export.customResolution) {
                    this.$store.commit('customHeight', height);
                }
            },
        },
        exportWidth: {
            get: function () {
                let state = this.$store.state;
                return state.export.customResolution ?
                    state.export.width :
                    state.activeFragment?.video?.width;
            },
            set: function (width) {
                if (this.$store.state.export.customResolution) {
                    this.$store.commit('customWidth', width);
                }
            },
        },
        ...mapState({
            outputPath: state => state.export.outputPath,
        }),
    },
}
</script>

<style scoped>
.output-path {
    display: flex;
    align-items: center;
}

.output-path > p {
    width: 100%;
    margin-bottom: 0;
    font-size: 15px;
    box-shadow: inset 0 0 0 2px var(--softer-background);
    padding: 8px 15px;
    border-radius: 3px;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.interpolate-switch {
    margin-top: -10px;
}

.resolution {
    display: flex;
    align-items: center;
}

.resolution > p {
    vertical-align: middle;
    margin: 0 15px;
    margin-bottom: 25px;
}
</style>