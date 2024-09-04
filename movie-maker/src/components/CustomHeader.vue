<template>
    <div class="header">
        <div class="left-content">
            <v-avatar class="no-drag logo mr-5" size="35" rounded v-ripple @click="goHome">
                <v-img :src="`img/favicon.png`"></v-img>
            </v-avatar>
            <v-tooltip bottom v-if="hasProject">
                <template v-slot:activator="{ on, attrs }">
                    <v-btn :disabled="importVideoLoading || importProjectLoading"
                           class="no-drag"
                           icon
                           @click="newProject"
                           v-bind="attrs" v-on="on">
                        <v-icon>mdi-file-outline</v-icon>
                    </v-btn>
                </template>
                <span>New project</span>
            </v-tooltip>
            <v-tooltip bottom>
                <template v-slot:activator="{ on, attrs }">
                    <v-btn :loading="importProjectLoading"
                           :disabled="importVideoLoading"
                           class="no-drag"
                           icon
                           @click="promptProjectInput"
                           v-bind="attrs" v-on="on">
                        <v-icon>mdi-movie-open-outline</v-icon>
                    </v-btn>
                </template>
                <span>Open project</span>
            </v-tooltip>
            <v-tooltip bottom>
                <template v-slot:activator="{ on, attrs }">
                    <v-btn :disabled="importProjectLoading"
                           :loading="importVideoLoading"
                           class="no-drag"
                           icon
                           @click="promptVideoInput"
                           v-bind="attrs"
                           v-on="on">
                        <v-icon>mdi-import</v-icon>
                    </v-btn>
                </template>
                <span>Import video</span>
            </v-tooltip>
        </div>
        <div class="center-content">
            <span class="caption" v-if="projectFileName !== ''">
                <span>{{ projectFileName.split('.')[0] }}</span>
                <span class="grey-file">.{{ projectFileName.split('.')[1] }}</span>
                <span class="unsaved" v-if="hasUnsavedAction">*</span>
            </span>
        </div>
        <div class="right-content">

            <v-btn class="no-drag" icon v-if="status.done && !(isExporting || isUploading) && status.error === ''"
                   @click="$store.commit('showExportStatus', true)">
                <v-icon color="success">mdi-check</v-icon>
            </v-btn>
            <v-btn icon v-if="isExporting || isUploading"
                   @click="$store.commit('showExportStatus', true)">
                <v-progress-circular class="no-drag"
                                     :color="isUploading ? 'red' : 'default'"
                                     :value="(isUploading ? youtube.progress.percent : exportProgress) * 100">
                    {{ Math.round((isUploading ? youtube.progress.percent : exportProgress) * 100) }}
                </v-progress-circular>
            </v-btn>

            <v-menu open-on-hover close-delay="100" offset-y v-else-if="hasProject">
                <template v-slot:activator="{ on, attrs }">
                    <v-btn class="no-drag" icon v-bind="attrs" v-on="on">
                        <v-icon>mdi-export</v-icon>
                    </v-btn>
                </template>
                <v-list dense>
                    <v-list-item @click="exportVideoAs">
                        <v-list-item-icon>
                            <v-icon>mdi-movie-outline</v-icon>
                        </v-list-item-icon>
                        <v-list-item-title>Quick export</v-list-item-title>
                    </v-list-item>
                    <v-list-item @click="showExportDialog(false)">
                        <v-list-item-icon>
                            <v-icon>mdi-movie-open-outline</v-icon>
                        </v-list-item-icon>
                        <v-list-item-title>Export</v-list-item-title>
                    </v-list-item>
                    <v-list-item @click="showExportDialog(true)">
                        <v-list-item-icon>
                            <v-icon>mdi-youtube</v-icon>
                        </v-list-item-icon>
                        <v-list-item-title>Export to YouTube</v-list-item-title>
                    </v-list-item>
                </v-list>
            </v-menu>
            <v-menu offset-y open-on-hover close-delay="100" v-if="hasProject && projectFileName !== ''">
                <template v-slot:activator="{ on, attrs }">
                    <v-btn class="no-drag" icon v-bind="attrs" v-on="on">
                        <v-icon>mdi-content-save-outline</v-icon>
                    </v-btn>
                </template>
                <v-list dense>
                    <v-list-item @click="saveProject">
                        <v-list-item-icon>
                            <v-icon>mdi-content-save-outline</v-icon>
                        </v-list-item-icon>
                        <v-list-item-title>Save</v-list-item-title>
                    </v-list-item>
                    <v-list-item @click="saveProjectAs">
                        <v-list-item-icon>
                            <v-icon>mdi-plus</v-icon>
                        </v-list-item-icon>
                        <v-list-item-title>Save as...</v-list-item-title>
                    </v-list-item>
                </v-list>
            </v-menu>
            <v-tooltip bottom v-else-if="hasProject">
                <template v-slot:activator="{ on, attrs }">
                    <v-btn @click="saveProject" class="no-drag" icon v-bind="attrs" v-on="on">
                        <v-icon>mdi-content-save-outline</v-icon>
                    </v-btn>
                </template>
                <span>Save project</span>
            </v-tooltip>

            <v-menu offset-y>
                <template v-slot:activator="{ on, attrs }">
                    <v-btn class="no-drag ml-8" icon v-bind="attrs" v-on="on">
                        <v-icon>mdi-cog</v-icon>
                    </v-btn>
                </template>
                <v-list>
                    <v-list-item color="primary">
                        <v-list-item-icon>
                            <v-icon>mdi-brightness-6</v-icon>
                        </v-list-item-icon>
                        <v-list-item-content>
                            <v-list-item-title class="theme-switch">
                                <span>Dark theme</span>
                            </v-list-item-title>
                        </v-list-item-content>
                        <v-list-item-action>
                            <v-switch dense inset v-model="$vuetify.theme.dark"></v-switch>
                        </v-list-item-action>
                    </v-list-item>
                    <v-list-item color="primary" to="/settings">
                        <v-list-item-icon>
                            <v-icon>mdi-cog</v-icon>
                        </v-list-item-icon>
                        <v-list-item-content>
                            <v-list-item-title>Settings</v-list-item-title>
                        </v-list-item-content>
                    </v-list-item>
                </v-list>
            </v-menu>
            <v-btn class="no-drag" icon @click="$store.dispatch('minimizeWindow')">
                <v-icon>mdi-minus</v-icon>
            </v-btn>
            <v-btn class="no-drag close-button" icon @click="closeWindow">
                <v-icon>mdi-close</v-icon>
            </v-btn>
        </div>
    </div>
</template>

<script>
import {mapActions, mapGetters, mapState} from "vuex";
import VolumeSlider from "@/components/VolumeSlider";
import PlaybackRateSlider from "@/components/PlaybackRateSlider";

export default {
    name: "CustomHeader",
    components: {PlaybackRateSlider, VolumeSlider},
    data: () => ({}),
    mounted() {

    },
    methods: {
        showExportDialog(youtube = false) {
            if (youtube && !this.isLoggedIn) {
                this.addSnack({text: "You must log in to YouTube before uploading"});
                this.$router.push("/settings");
                return;
            }
            this.$store.commit('ytShow', youtube);
            this.$store.commit('showExportDialog', true);
        },
        goHome() {
            if (this.$route.path !== '/')
                this.$router.push("/");
        },
        ...mapActions([
            'promptVideoInput', 'exportToYouTube', 'exportVideoAs', 'closeWindow',
            'promptProjectInput', 'saveProjectAs', 'newProject', 'saveProject', 'addSnack',
        ]),
    },
    watch: {
        '$vuetify.theme.dark'() {
            localStorage.darkTheme = this.$vuetify.theme.dark;
        },
    },
    computed: {
        ...mapGetters(['hasProject', 'projectFileName', 'isExporting', 'exportProgress', 'isUploading', 'isLoggedIn']),
        ...mapState({
            youtube: state => state.youtube,
            activeFragment: state => state.activeFragment,
            importVideoLoading: state => state.loading.videoImport,
            importProjectLoading: state => state.loading.projectImport,
            hasUnsavedAction: state => state.command.hasUnsavedAction,
            status: state => state.exportStatus,
        }),
    },
}
</script>

<style scoped>
.header {
    -webkit-app-region: drag;
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    height: 100%;
    padding: 0 1em;
}

.no-drag {
    -webkit-app-region: no-drag;
}

.left-content {
    display: flex;
    align-items: center;
}

.logo {
    cursor: pointer;
}

.center-content {
    flex-grow: 1;
    display: flex;
    justify-content: center;
    max-width: calc(100% - 320px - 206px);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.grey-file {
    opacity: 0.7;
}

.unsaved {
    color: var(--primary);
}

.fragment-controls {
    display: flex;
    width: 100%;
    justify-content: center;
    align-items: center;
}

.close-button:active {
    color: maroon !important;
}
</style>