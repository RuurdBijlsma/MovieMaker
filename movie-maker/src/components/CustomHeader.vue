<template>
    <v-sheet class="header" color="secondary">
        <div class="left-content">
            <div class="logo">
                <div class="logo-icon" :style="{backgroundImage: `url(img/favicon.png)`}"></div>
            </div>
            <v-tooltip bottom>
                <template v-slot:activator="{ on, attrs }">
                    <v-btn :loading="importVideoLoading" class="no-drag" icon @click="promptVideoInput" v-bind="attrs" v-on="on">
                        <v-icon>mdi-import</v-icon>
                    </v-btn>
                </template>
                <span>Import video</span>
            </v-tooltip>
            <v-tooltip bottom>
                <template v-slot:activator="{ on, attrs }">
                    <v-btn :loading="importAudioLoading" class="no-drag" icon @click="addAudioTrack" v-bind="attrs" v-on="on">
                        <v-icon>mdi-music-note</v-icon>
                    </v-btn>
                </template>
                <span>Add audio track</span>
            </v-tooltip>
        </div>
        <div class="center-content">
            <div v-if="activeFragment" class="fragment-controls">
            </div>
        </div>
        <div class="right-content">
            <v-tooltip bottom>
                <template v-slot:activator="{ on, attrs }">
                    <v-btn class="no-drag" icon @click="exportVideo" v-bind="attrs" v-on="on">
                        <v-icon>mdi-export</v-icon>
                    </v-btn>
                </template>
                <span>Export video</span>
            </v-tooltip>
            <v-tooltip bottom>
                <template v-slot:activator="{ on, attrs }">
                    <v-btn class="no-drag" icon @click="exportToYouTube" v-bind="attrs" v-on="on">
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
import {mapActions, mapState} from "vuex";
import VolumeSlider from "@/components/VolumeSlider";
import PlaybackRateSlider from "@/components/PlaybackRateSlider";

export default {
    name: "CustomHeader",
    components: {PlaybackRateSlider, VolumeSlider},
    data: () => ({}),
    mounted() {

    },
    methods: {
        ...mapActions(['promptVideoInput', 'exportToYouTube', 'exportVideo', 'addAudioTrack','secureClose']),
    },
    watch: {
        '$vuetify.theme.dark'() {
            localStorage.darkTheme = this.$vuetify.theme.dark;
        },
    },
    computed: {
        ...mapState({
            activeFragment: state => state.activeFragment,
            importVideoLoading: state => state.loading.videoImport,
            importAudioLoading: state => state.loading.audioImport,
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
    width:100%;
    height:100%;
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