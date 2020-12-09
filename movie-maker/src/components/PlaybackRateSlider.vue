<template>
    <div class="slider-container">
        <div class="slider-holder" @wheel="wheelPbr">
            <v-slider class="slider"
                      :prepend-icon="pbrIcon"
                      dense
                      hide-details
                      min="0.1"
                      max="2"
                      step="0.001"
                      v-model="rawPlaybackRate"></v-slider>
            <div class="slider-label">
                <p>Playback rate: {{ activeFragment.playbackRate.toFixed(2) }}x</p>
            </div>
        </div>
        <v-tooltip bottom>
            <template v-slot:activator="{ on, attrs }">
                <v-btn x-small icon class="reset-button"
                       :style="{
                                            opacity: activeFragment.playbackRate === 1 ? 0 : 0.5,
                                            pointerEvents: activeFragment.playbackRate === 1 ? 'none' : 'all',
                                        }"
                       @click="rawPlaybackRate = 1" v-bind="attrs" v-on="on">
                    <v-icon>mdi-reload</v-icon>
                </v-btn>
            </template>
            <span>Set default playback rate</span>
        </v-tooltip>
    </div>
</template>

<script>
import {mapActions, mapState} from "vuex";

export default {
    name: "PlaybackRateSlider",
    data: () => ({
        rawPlaybackRate: 1,
        commit: true,
    }),
    methods: {
        updateRawPbr(commit = true) {
            let pbr = this.activeFragment.playbackRate;
            if (pbr > 1)
                pbr = 1 + (pbr - 1) / 7;
            if (pbr !== this.rawPlaybackRate) {
                this.commit = commit;
                this.rawPlaybackRate = pbr;
            }
        },
        wheelPbr(e) {
            this.rawPlaybackRate -= e.deltaY * 0.00005;
        },
        ...mapActions(['setPlaybackRate']),
    },
    watch: {
        'activeFragment.playbackRate'() {
            this.updateRawPbr(false);
        },
        activeFragment() {
            this.updateRawPbr(false);
        },
        rawPlaybackRate() {
            let playbackRate = this.rawPlaybackRate;
            if (this.rawPlaybackRate > 1)
                playbackRate = 1 + (this.rawPlaybackRate - 1) * 7;
            if (this.commit)
                this.setPlaybackRate({playbackRate});
            else
                this.commit = true;
        },
    },
    computed: {
        pbrIcon() {
            if (this.rawPlaybackRate < 0.8) {
                return 'mdi-speedometer-slow';
            } else if (this.rawPlaybackRate < 1.2) {
                return 'mdi-speedometer-medium';
            } else {
                return 'mdi-speedometer';
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

.slider >>> i {
    font-size: 19px;
    opacity: 0.8;
}
</style>