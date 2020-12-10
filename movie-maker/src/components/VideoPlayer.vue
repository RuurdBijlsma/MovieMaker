<template>
    <perfect-scrollbar class="player" ref="player">
        <div ref="videosContainer" class="videos" :style="{height: maxVideoHeight + 'px'}">
            <video @ended="playNextFragment" @canplay="canPlay" ref="videos"
                   v-for="videoFile in videoFiles"
                   :key="videoFile.filePath"
                   :id="videoFile.filePath"
                   :src="videoFile.filePath"
                   :style="{
                        width: videoWidth + 'px',
                        height: videoWidth / videoFile.aspectRatio + 'px',
                        visibility: videoFile === activeFragment.video ? 'visible': 'hidden',
                   }"
            ></video>
        </div>
        <div class="controls">
            <div class="time-control" v-if="videoFiles.length > 0"
                 :style="{pointerEvents: activeFragment.video.canPlay ? 'all' : 'none'}">
                <seek-bar class="seek-bar"></seek-bar>
                <span class="seek-time">{{ toHms(progress * fullDuration) }} / {{ toHms(fullDuration) }}</span>
            </div>
            <div class="playback-controls" v-if="videoFiles.length > 0">
                <v-spacer></v-spacer>
                <div class="center-controls">
                    <v-btn icon :disabled="!activeFragment.video.canPlay || !canSkipFrameLeft" @click="skipFrames(-1)">
                        <v-icon>mdi-skip-previous</v-icon>
                    </v-btn>
                    <v-btn icon x-large @click="togglePlay" :loading="!activeFragment.video.canPlay">
                        <v-icon v-if="playing">mdi-pause</v-icon>
                        <v-icon v-else>mdi-play</v-icon>
                    </v-btn>
                    <v-btn icon :disabled="!activeFragment.video.canPlay || !canSkipFrameRight" @click="skipFrames(1)">
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
    </perfect-scrollbar>
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

                // console.log(this.$store.getters.computedProgress);
                if (this.activeFragment.progress >= 1 && !activeVideo.paused || this.activeFragment.progress > 1){
                    // console.log('play next fragment');
                    this.playNextFragment();
                }

                if (activeVideo.playbackRate !== this.activeFragment.playbackRate)
                    activeVideo.playbackRate = this.activeFragment.playbackRate;
                const gainNode = this.activeFragment.video.gainNode;
                if (gainNode && gainNode.gain.value !== this.activeFragment.volume)
                    gainNode.gain.value = this.activeFragment.volume;
            }
        }, 1000 / 60);
    },
    beforeDestroy() {
        clearInterval(this.timeInterval);
        window.removeEventListener('resize', this.windowResize);
    },
    methods: {
        canPlay(e) {
            let video = this.videoFiles.find(v => v.filePath === e.target.getAttribute('id'));
            if (video)
                video.emit('canplay');
        },
        togglePlay() {
            if (this.playing)
                this.pause();
            else
                this.play();
        },
        windowResize() {
            this.bounds = this.$refs.player.$el.getBoundingClientRect();
        },
        ...mapActions(['play', 'pause', 'playNextFragment', 'skipFrames'])
    },
    watch: {
        playerWidth() {
            this.windowResize();
        },
        activeFragment(fragment, previousFragment) {
            if (previousFragment === null)
                return;
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
            return this.bounds.width;
        },
        maxVideoHeight() {
            let maxRatio = this.videoFiles.reduce((a, b) => Math.min(a, b.aspectRatio), 3);
            return this.videoWidth / maxRatio;
        },
        ...mapGetters(['fullDuration', 'toHms', 'progressAtFragmentProgress', 'canSkipFrameLeft', 'canSkipFrameRight']),
        ...mapState({
            videoFiles: state => state.videoFiles,
            activeFragment: state => state.activeFragment,
            progress: state => state.player.progress,
            playing: state => state.player.playing,
            timeline: state => state.timeline,
            playerWidth: state => state.player.widthPercent,
        }),
    },
}
</script>

<style scoped>
.player {
    width: 100%;
    max-height: 100%;
    overflow-y: auto;
}

.player video {
    width: 100%;
    position: absolute;
}

.controls {
    margin: 20px;
    display: flex;
    flex-direction: column;
}

.time-control {
    display: flex;
}

.seek-time {
    white-space: nowrap;
    font-size: 12px;
    padding-left: 10px;
    opacity: 0.7;
}

.playback-controls {
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