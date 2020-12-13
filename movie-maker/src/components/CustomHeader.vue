<template>
    <v-sheet class="header" color="secondary">
        <div class="left-content">
            <div class="logo mr-4">
                <div class="logo-icon" :style="{backgroundImage: `url(img/favicon.png)`}"></div>
            </div>
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
            </span>
        </div>
        <div class="right-content">
            <v-tooltip bottom v-if="hasProject">
                <template v-slot:activator="{ on, attrs }">
                    <v-btn class="no-drag" icon @click="saveProjectAs" v-bind="attrs" v-on="on">
                        <v-icon>mdi-content-save-outline</v-icon>
                    </v-btn>
                </template>
                <span>Save project</span>
            </v-tooltip>
            <v-tooltip bottom v-if="hasProject">
                <template v-slot:activator="{ on, attrs }">
                    <v-btn class="no-drag" icon @click="exportVideo" v-bind="attrs" v-on="on">
                        <v-icon>mdi-export</v-icon>
                    </v-btn>
                </template>
                <span>Export video</span>
            </v-tooltip>
            <v-tooltip bottom v-if="hasProject">
                <template v-slot:activator="{ on, attrs }">
                    <v-btn class="no-drag mr-8" icon @click="exportToYouTube" v-bind="attrs" v-on="on">
                        <v-icon>mdi-youtube</v-icon>
                    </v-btn>
                </template>
                <span>Export video to YouTube</span>
            </v-tooltip>
            <v-menu offset-y>
                <template v-slot:activator="{ on, attrs }">
                    <v-btn class="no-drag" icon v-bind="attrs" v-on="on">
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
            <v-btn class="no-drag close-button" icon @click="secureClose">
                <v-icon>mdi-close</v-icon>
            </v-btn>
        </div>
    </v-sheet>
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
        ...mapActions([
            'promptVideoInput', 'exportToYouTube', 'exportVideo', 'secureClose',
            'promptProjectInput', 'saveProjectAs', 'newProject',
        ]),
    },
    watch: {
        '$vuetify.theme.dark'() {
            localStorage.darkTheme = this.$vuetify.theme.dark;
        },
    },
    computed: {
        ...mapGetters(['hasProject', 'projectFileName']),
        ...mapState({
            activeFragment: state => state.activeFragment,
            importVideoLoading: state => state.loading.videoImport,
            importProjectLoading: state => state.loading.projectImport,
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
}

.logo {
    display: flex;
    place-items: center;
}

.logo-icon {
    height: 30px;
    width: 30px;
    margin-right: 1em;
    background-size: contain;
    background-position: center;
    background-repeat: no-repeat;
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