<template>
    <div class="player" ref="player">
        <div ref="videosContainer" class="videos" :style="{height: maxVideoHeight + 'px'}">
            <video @ended="videoEnd" ref="videos"
                   v-for="videoFile in videoFiles"
                   :key="videoFile.filePath" :id="videoFile.filePath"
                   :src="videoFile.filePath" :style="{
                        width: videoWidth + 'px',
                        height: videoWidth / videoFile.aspectRatio + 'px',
                        opacity: videoFile === activeFragment.video ? 1 : 0.001,
            }"></video>
        </div>
        <div class="time-control" v-if="videoFiles.length > 0">
            <seek-bar class="seek-bar"></seek-bar>
            <span class="seek-time">{{ toHms(progress * fullDuration) }} / {{ toHms(fullDuration) }}</span>
        </div>
        <div class="controls" v-if="videoFiles.length > 0">
            <v-spacer></v-spacer>
            <div class="center-controls">
                <v-btn icon>
                    <v-icon>mdi-skip-previous</v-icon>
                </v-btn>
                <v-btn icon x-large @click="togglePlay">
                    <v-icon v-if="playing">mdi-pause</v-icon>
                    <v-icon v-else>mdi-play</v-icon>
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
import {mapActions, mapGetters, mapState} from "vuex";
import SeekBar from "@/components/SeekBar";

export default {
    name: "VideoPlayer",
    components: {SeekBar},
    data: () => ({
        bounds: null,
        timeInterval: -1,
    }),
    mounted() {
        this.$store.commit('videosContainer', this.$refs.videosContainer);
        this.windowResize();
        window.addEventListener('resize', this.windowResize, false);
        this.timeInterval = setInterval(() => {
            if (this.$refs.videos) {
                let activeVideo = this.activeFragment.video.element;
                this.$store.commit('playing', !activeVideo.paused)
                let progress = this.progressAtFragmentProgress({
                    fragment: this.activeFragment,
                    progress: this.activeFragment.progress
                });
                if (!isNaN(progress))
                    this.$store.commit('progress', progress);
                if (activeVideo.playbackRate !== this.activeFragment.playbackRate)
                    activeVideo.playbackRate = this.activeFragment.playbackRate;
                if (activeVideo.volume !== this.activeFragment.volume)
                    activeVideo.volume = this.activeFragment.volume;
            }
        }, 1000 / 60);
    },
    beforeDestroy() {
        clearInterval(this.timeInterval);
        window.removeEventListener('resize', this.windowResize);
    },
    methods: {
        togglePlay() {
            if (this.playing)
                this.pause();
            else
                this.play();
        },
        windowResize() {
            this.bounds = this.$refs.player.getBoundingClientRect();
        },
        ...mapActions(['play', 'pause', 'videoEnd'])
    },
    watch: {
        activeFragment(fragment, previousFragment) {
            if (previousFragment === null)
                return;
            console.log("Active video changed");
            if (fragment.video !== previousFragment.video) {
                const wasPaused = previousFragment.video.element.paused;
                previousFragment.reset();
                if (!wasPaused) {
                    fragment.video.element.play();
                }
            }
        }
    },
    computed: {
        videoWidth() {
            if (this.bounds === null)
                return 0;
            return this.bounds.width - 40;
        },
        maxVideoHeight() {
            let maxRatio = this.videoFiles.reduce((a, b) => Math.min(a, b.aspectRatio), 3);
            return this.videoWidth / maxRatio;
        },
        ...mapGetters(['fullDuration', 'toHms', 'progressAtFragmentProgress']),
        ...mapState({
            videoFiles: state => state.videoFiles,
            activeFragment: state => state.activeFragment,
            progress: state => state.player.progress,
            playing: state => state.player.playing,
            timeline: state => state.timeline,
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