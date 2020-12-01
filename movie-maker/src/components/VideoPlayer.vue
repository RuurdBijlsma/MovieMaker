<template>
    <div class="player" ref="player">
        <div class="videos" :style="{height: maxVideoHeight + 'px'}" v-if="bounds">
            <video v-for="videoFile in videoFiles" :id="videoFile.filePath" :src="videoFile.filePath" :style="{
                width: videoWidth + 'px',
                height: videoWidth / videoFile.aspectRatio + 'px',
            }"></video>
        </div>
        <div class="time-control">
            <seek-bar class="seek-bar" v-if="videoFiles.length > 0"></seek-bar>
            <span class="seek-time">{{ toHms(progress * fullDuration) }} / {{ toHms(fullDuration) }}</span>
        </div>
        <div class="controls">
            <v-spacer></v-spacer>
            <div class="center-controls">
                <v-btn icon>
                    <v-icon>mdi-skip-previous</v-icon>
                </v-btn>
                <v-btn icon x-large>
                    <v-icon>mdi-play</v-icon>
                </v-btn>
                <v-btn icon>
                    <v-icon>mdi-skip-next</v-icon>
                </v-btn>
            </div>
            <v-spacer></v-spacer>
            <div class="right-controls">
                <v-btn icon>
                    <v-icon>mdi-fullscreen</v-icon>
                </v-btn>
            </div>
        </div>
    </div>
</template>

<script>
import {mapGetters, mapState} from "vuex";
import SeekBar from "@/components/SeekBar";

export default {
    name: "VideoPlayer",
    components: {SeekBar},
    data: () => ({
        bounds: null,
    }),
    mounted() {
        this.windowResize();
        window.addEventListener('resize', this.windowResize, false);
    },
    beforeDestroy() {
        window.removeEventListener('resize', this.windowResize);
    },
    methods: {
        windowResize() {
            this.bounds = this.$refs.player.getBoundingClientRect();
        },
    },
    computed: {
        videoWidth() {
            return this.bounds.width - 40;
        },
        maxVideoHeight() {
            let maxRatio = this.videoFiles.reduce((a, b) => Math.min(a, b.aspectRatio), 3);
            return this.videoWidth / maxRatio;
        },
        ...mapGetters(['fullDuration', 'toHms']),
        ...mapState({
            videoFiles: state => state.videoFiles,
            progress: state => state.player.progress,
        }),
    },
}
</script>

<style scoped>
.player {
    padding: 20px;
    width: 100%;
}

.player video {
    width: 100%;
    position: absolute;
}

.time-control {
    margin-top: 10px;
    display: flex;
}

.seek-time {
    white-space: nowrap;
    font-size: 12px;
    padding-left: 10px;
    opacity: 0.7;
}

.controls {
    display: flex;
    place-content: center;
}

.center-controls > * {
    margin: 0 2px;
}

.right-controls {
    align-items: center;
    display: flex;
}
</style>