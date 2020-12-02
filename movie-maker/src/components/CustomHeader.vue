<template>
    <v-sheet class="header" color="secondary">
        <div class="left-content">
            <div class="logo">
                <div class="logo-icon" :style="{backgroundImage: `url(img/favicon.png)`}"></div>
            </div>
            <v-tooltip bottom>
                <template v-slot:activator="{ on, attrs }">
                    <v-btn class="no-drag" icon @click="importVideoInput" v-bind="attrs" v-on="on">
                        <v-icon>mdi-import</v-icon>
                    </v-btn>
                </template>
                <span>Import video</span>
            </v-tooltip>
            <v-tooltip bottom>
                <template v-slot:activator="{ on, attrs }">
                    <v-btn class="no-drag" icon @click="addAudioTrack" v-bind="attrs" v-on="on">
                        <v-icon>mdi-music-note</v-icon>
                    </v-btn>
                </template>
                <span>Add audio track</span>
            </v-tooltip>
        </div>
        <div class="center-content">
            <div v-if="activeFragment" class="fragment-controls">
                <div class="slider-holder no-drag">
                    <v-slider class="slider" dense hide-details min="0" max="1"
                              step="0.01"
                              v-model="activeFragment.volume"></v-slider>
                    <div class="slider-label">
                        <p>Volume: {{ Math.round(activeFragment.volume * 100) }}%</p>
                    </div>
                </div>
                <v-tooltip bottom>
                    <template v-slot:activator="{ on, attrs }">
                        <v-btn x-small icon class="reset-button no-drag"
                               :style="{
                                            opacity: activeFragment.volume === 1 ? 0 : 0.5,
                                            pointerEvents: activeFragment.volume === 1 ? 'none' : 'all',
                                        }"
                               @click="activeFragment.volume = 1" v-bind="attrs" v-on="on">
                            <v-icon>mdi-reload</v-icon>
                        </v-btn>
                    </template>
                    <span>Set default volume</span>
                </v-tooltip>
                <div class="slider-holder no-drag">
                    <v-slider class="slider" dense hide-details min="0.1" max="8"
                              step="0.01"
                              v-model="activeFragment.playbackRate"></v-slider>
                    <div class="slider-label">
                        <p>Playback rate: {{ activeFragment.playbackRate.toFixed(2) }}x</p>
                    </div>
                </div>
                <v-tooltip bottom>
                    <template v-slot:activator="{ on, attrs }">
                        <v-btn x-small icon class="reset-button no-drag"
                               :style="{
                                            opacity: activeFragment.playbackRate === 1 ? 0 : 0.5,
                                            pointerEvents: activeFragment.playbackRate === 1 ? 'none' : 'all',
                                        }"
                               @click="activeFragment.playbackRate = 1" v-bind="attrs" v-on="on">
                            <v-icon>mdi-reload</v-icon>
                        </v-btn>
                    </template>
                    <span>Set default playback rate</span>
                </v-tooltip>
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
                </v-list>
            </v-menu>
            <v-btn class="no-drag" icon @click="$store.dispatch('minimizeWindow')">
                <v-icon>mdi-minus</v-icon>
            </v-btn>
            <v-btn class="no-drag close-button" icon @click="$store.dispatch('closeWindow')">
                <v-icon>mdi-close</v-icon>
            </v-btn>
        </div>
    </v-sheet>
</template>

<script>
import {mapActions, mapState} from "vuex";

export default {
    name: "CustomHeader",
    methods: {
        importVideoInput() {
            let element = document.createElement('input');
            element.setAttribute('type', 'file');
            element.setAttribute('accept', 'video/*');
            element.setAttribute('multiple', '');
            element.click();
            element.onchange = () => {
                for (let file of element.files) {
                    this.importVideo(file.path);
                }
            }
            console.log("IMPORT");
        },
        addAudioTrack() {
            console.log("add audio");
        },
        exportVideo() {
            console.log("exportVideo");
        },
        exportToYouTube() {
            console.log("exportToYouTube");
        },
        ...mapActions(['importVideo'])
    },
    watch: {
        '$vuetify.theme.dark'() {
            localStorage.darkTheme = this.$vuetify.theme.dark;
        },
    },
    computed: {
        ...mapState({
            activeFragment: state => state.activeFragment,
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
    width: calc(100% + 32px);
    height: calc(100% + 8px);
    margin: -4px -16px;
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

.slider-holder {
    display: flex;
    align-items: center;
    flex-direction: column;
    margin: 0 10px;
}

.slider-label {
    display: flex;
}

.reset-button {
    margin-top: -2px;
    opacity: 0;
}

.reset-button:hover, .reset-button:active {
    opacity: 1;
}

.slider-label > p {
    font-size: 12px;
    opacity: 0.8;
    width: 130px;
    margin: 0;
    text-align: center;
}

.slider {
    width: 100%;
}

.close-button:hover, .close-button:active {
    color: maroon !important;
}
</style>