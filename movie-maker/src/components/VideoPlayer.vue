<template>
    <perfect-scrollbar class="player" ref="player">
        <div ref="videosContainer" class="videos" :style="{height: maxVideoHeight + 'px'}">
            <video @canplay.once="canPlay" ref="videos"
                   @ended="playNextFragment(true)"
                   v-for="videoFile in videoFiles"
                   :key="videoFile.filePath"
                   :id="videoFile.filePath"
                   v-show="!isAudio"
                   :src="videoFile.filePath"
                   :style="{
                        width: videoWidth + 'px',
                        height: videoHeight(videoFile) + 'px',
                        visibility: videoFile === activeFragment.video &&
                            !isAudio ? 'visible': 'hidden',
                   }"
            ></video>
            <canvas v-show="isAudio" ref="audioCanvas"></canvas>
        </div>
        <div class="controls" :class="{fullscreen}">
            <div class="time-control" v-if="videoFiles.length > 0"
                 :style="{pointerEvents: activeFragment.video.canPlay ? 'all' : 'none'}">
                <seek-bar class="seek-bar"></seek-bar>
                <span class="seek-time">{{ toHms(progress * fullDuration) }} / {{ toHms(fullDuration) }}</span>
            </div>
            <div class="playback-controls" v-if="videoFiles.length > 0">
                <v-menu open-on-hover :close-on-content-click="false" v-if="!fullscreen">
                    <template v-slot:activator="{ on, attrs }">
                        <v-icon
                            v-bind="attrs"
                            v-on="on"
                            small>
                            {{ volumeIcon }}
                        </v-icon>
                    </template>
                    <v-list class="player-volume-container">
                        <v-slider
                            min="0"
                            max="1"
                            step="0.01"
                            v-model="$store.state.player.volume"
                            @click:prepend="toggleMute"
                            class="player-volume"
                            dense
                            hide-details
                            :prepend-icon="volumeIcon"></v-slider>
                    </v-list>
                </v-menu>
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
                    <v-btn icon @click="toggleFullScreen">
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
        prevVolume: 1,
        canvas: null,
        context: null,
        animationFrame: -1,
    }),
    beforeDestroy() {
        clearInterval(this.timeInterval);
        window.removeEventListener('resize', this.windowResize);
        this.$store.commit('videosContainer', null);
        cancelAnimationFrame(this.animationFrame);
    },
    mounted() {
        this.canvas = this.$refs.audioCanvas;
        this.context = this.canvas.getContext('2d');
        this.animationFrame = requestAnimationFrame(() => this.visualizeAudio());

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

                if (this.activeFragment.progress >= 1) {
                    this.playNextFragment();
                }

                if (activeVideo.playbackRate !== this.activeFragment.playbackRate)
                    activeVideo.playbackRate = this.activeFragment.playbackRate;
                const gainNode = this.activeFragment.video.gainNode;
                let updatedGain = this.activeFragment.volume * this.playerVolume;
                if (gainNode && gainNode.gain.value !== updatedGain)
                    gainNode.gain.value = updatedGain;
            }
        }, 1000 / 60);
    },
    methods: {
        resizeCanvas() {
            this.canvas.width = this.videoWidth;
            this.canvas.height = this.maxVideoHeight;
        },
        visualizeAudio() {
            this.animationFrame = requestAnimationFrame(() => this.visualizeAudio());
            if (!this.isAudio)
                return;
            this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

            let video = this.activeFragment.video;
            video.analyser.getByteTimeDomainData(video.dataArray);
            let bufferLength = video.analyser.frequencyBinCount;

            this.context.lineWidth = 2;
            this.context.strokeStyle = this.themeColors.primary;

            this.context.beginPath();

            const sliceWidth = this.canvas.width * 1.0 / bufferLength;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {

                const v = video.dataArray[i] / 128.0;
                const y = v * this.canvas.height / 2;

                if (i === 0) {
                    this.context.moveTo(x, y);
                } else {
                    this.context.lineTo(x, y);
                }

                x += sliceWidth;
            }

            this.context.lineTo(this.canvas.width, this.canvas.height / 2);
            this.context.stroke();
        },
        videoHeight(video) {
            return this.videoWidth / video.aspectRatio
        },
        toggleMute() {
            if (this.playerVolume > 0) {
                this.prevVolume = this.playerVolume;
                this.$store.commit('playerVolume', 0);
            } else {
                this.$store.commit('playerVolume', this.prevVolume);
            }
        },
        toggleFullScreen() {
            if (this.fullscreen) {
                this.$store.commit('fullscreen', false);
            } else {
                this.$store.commit('fullscreen', true);
            }
        },
        canPlay(e) {
            let video = this.videoFiles.find(v => v.filePath === e.target.getAttribute('id'));
            if (video)
                video.emit('canplay');
            this.activeFragment?.reset?.()
        },
        togglePlay() {
            if (this.playing)
                this.pause();
            else
                this.play();
        },
        windowResize() {
            this.bounds = this.$refs.player.$el.getBoundingClientRect();
            this.resizeCanvas();
        },
        ...mapActions(['play', 'pause', 'playNextFragment', 'skipFrames', 'addSnack'])
    },
    watch: {
        async fullscreen() {
            if (this.fullscreen) {
                try {
                    await this.$refs.player.$el.requestFullscreen();
                } catch (e) {
                    this.addSnack({text: "Full screen failed"}).then();
                }
            } else {
                try {
                    await document.exitFullscreen();
                } catch (e) {
                    this.addSnack({text: "Exiting full screen failed"}).then();
                }
            }
            this.windowResize();
        },
        playerVolume() {
            localStorage.playerVolume = this.playerVolume;
        },
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
        volumeIcon() {
            switch (true) {
                case this.playerVolume === 0:
                    return 'mdi-volume-mute';
                case this.playerVolume < 0.5:
                    return 'mdi-volume-medium';
                case this.playerVolume < 4:
                    return 'mdi-volume-high';
                default:
                    return 'mdi-volume-vibrate';
            }
        },
        videoWidth() {
            if (this.bounds === null)
                return 0;
            return this.bounds.width;
        },
        maxVideoHeight() {
            let maxRatio = this.videoFiles
                .filter(v => !v.isAudio)
                .reduce((a, b) => Math.min(a, b.aspectRatio), 3);
            return this.videoWidth / maxRatio;
        },
        ...mapGetters([
            'fullDuration', 'toHms', 'progressAtFragmentProgress',
            'canSkipFrameLeft', 'canSkipFrameRight', 'isAudio', 'themeColors',
        ]),
        ...mapState({
            videoFiles: state => state.videoFiles,
            activeFragment: state => state.activeFragment,
            progress: state => state.player.progress,
            playing: state => state.player.playing,
            timeline: state => state.timeline,
            playerWidth: state => state.player.widthPercent,
            playerVolume: state => state.player.volume,
            fullscreen: state => state.player.fullscreen,
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

.videos {
    display: flex;
    align-items: center;
}

.controls {
    padding: 20px;
    display: flex;
    flex-direction: column;
}

.controls.fullscreen {
    position: fixed;
    width: 100%;
    z-index: 4;
    bottom: 0;
    background-image: linear-gradient(0deg, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0) 150%);
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
    align-items: center;
}

.center-controls > * {
    margin: 0 2px;
}

.right-controls {
    align-items: center;
    display: flex;
}

.player-volume-container {
    overflow: hidden;
    padding: 5px 10px;
}

.player-volume {
    width: 120px;
}
</style>