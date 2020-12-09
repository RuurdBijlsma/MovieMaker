<template>
    <div class="slider-container">
        <div class="slider-holder no-drag" @wheel="wheelVolume">
            <v-slider
                :prepend-icon="volumeIcon"
                @click:prepend="toggleMute"
                class="slider"
                dense
                hide-details
                min="0"
                max="2"
                step="0.001"
                v-model="rawVolume"></v-slider>
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
                       @click="rawVolume = 1" v-bind="attrs" v-on="on">
                    <v-icon>mdi-reload</v-icon>
                </v-btn>
            </template>
            <span>Set default volume</span>
        </v-tooltip>
    </div>
</template>

<script>
import {mapActions, mapState} from "vuex";

export default {
    name: "VolumeSlider",
    data: () => ({
        prevVolume: 1,
        rawVolume: 1,
        commit: true,
    }),
    methods: {
        updateRawVolume(commit = true) {
            let vol = this.activeFragment.volume;
            if (vol > 1)
                vol = 1 + (vol - 1) / 7;
            if (vol !== this.rawVolume) {
                this.commit = commit;
                this.rawVolume = vol;
            }
        },
        toggleMute() {
            if (this.rawVolume > 0) {
                this.prevVolume = this.rawVolume;
                this.rawVolume = 0;
            } else {
                this.rawVolume = this.prevVolume;
            }
        },
        wheelVolume(e) {
            this.rawVolume -= e.deltaY * 0.0001;
        },
        ...mapActions(['setVolume']),
    },
    watch: {
        'activeFragment.volume'() {
            this.updateRawVolume(false);
        },
        activeFragment() {
            this.updateRawVolume(false);
        },
        rawVolume() {
            let volume = this.rawVolume;
            if (this.rawVolume > 1)
                volume = 1 + (this.rawVolume - 1) * 7;
            if (this.commit) {
                console.log('commiting')
                this.setVolume({volume});
            } else {
                console.log("Not committing")
                this.commit = true;
            }
        },
    },
    computed: {
        volumeIcon() {
            if (this.activeFragment.volume === 0) {
                return 'mdi-volume-mute';
            } else if (this.activeFragment.volume < 0.5) {
                return 'mdi-volume-medium';
            } else if (this.activeFragment.volume < 4) {
                return 'mdi-volume-high';
            } else {
                return 'mdi-volume-vibrate';
            }
        },
        ...mapState({
            activeFragment: state => state.activeFragment,
        }),
    },
}
</script>

<style scoped>
.slider-container {
    height: 100%;
    display: flex;
    place-items: center;
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

.slider >>> button {
    font-size: 19px;
    opacity: 0.8;
}
</style>