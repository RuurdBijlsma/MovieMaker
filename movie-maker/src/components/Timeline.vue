<template>
    <div ref="timeline">
        <div class="fragment" v-for="(fragment, i) in visualFragments" :style="{
                width: fragment.width + 'px',
            }" :class="{
                'continues-right': fragment.continuesRight,
                'continues-left': fragment.continuesLeft,
                'active': fragment.fragment === activeFragment,
            }"
             ref="fragments"
             @mousemove="switchFragment($event, i)"
             @mousedown="moveStart($event, i)">
            <div class="visual-fragment">
                <div class="fragment-background"
                     :style="{
                backgroundImage: `url(${fragment.screenshots.merged})`,
                backgroundPositionX: (-1 * fragment.leftPixels) + 'px'
            }"></div>
                <canvas class="audio-wave" ref="audioCanvases"></canvas>
            </div>
            <div v-show="activeVisualFragment === fragment" :style="{
                left: seekLeft + 'px',
            }" class="seek-thumb"></div>
        </div>
    </div>
</template>

<script>
import {mapGetters, mapState} from "vuex";
import Utils from "@/js/Utils";

export default {
    name: "Timeline",
    data: () => ({
        bounds: null,
        visualFragments: [],
        renderAudioInterval: -1,
        activeVisualFragment: null,
        seekLeft: 0,
        fragmentIndex: false,
    }),
    beforeDestroy() {
        window.removeEventListener('resize', this.windowResize);
        clearInterval(this.renderAudioInterval);
        document.removeEventListener('mousemove', this.move);
        document.removeEventListener('mouseup', this.moveEnd);
    },
    mounted() {
        this.windowResize();
        window.addEventListener('resize', this.windowResize, false);
        requestAnimationFrame(() => this.updateFragmentsLayout());
        this.renderAudioInterval = setInterval(() => requestAnimationFrame(this.updateFragmentsLayout), 500);
        document.addEventListener('mousemove', this.move, false);
        document.addEventListener('mouseup', this.moveEnd, false);
    },
    methods: {
        switchFragment(e, fragmentIndex) {
            if (this.fragmentIndex !== false && this.fragmentIndex !== fragmentIndex) {
                this.fragmentIndex = fragmentIndex;
                this.seekToProgress(e);
            }
        },
        seekToProgress(e) {
            if (!this.activeFragment.video.canPlay)
                return;
            const visualFragment = this.visualFragments[this.fragmentIndex];
            const bounds = this.$refs.fragments[this.fragmentIndex].getBoundingClientRect();
            const leftMargin = visualFragment.continuesLeft ? 0 : 10;
            const rightMargin = visualFragment.continuesRight ? 0 : 10;
            const left = bounds.left + leftMargin;
            const width = bounds.width - rightMargin;
            let visualFragmentProgress = e.pageX - left;
            visualFragmentProgress = Math.max(Math.min(visualFragmentProgress / width, 1), 0);
            let fragmentProgress = visualFragment.start + visualFragmentProgress * (visualFragment.end - visualFragment.start);
            let {fragment} = visualFragment;
            let videoProgress = Utils.clamp(fragment.start + fragmentProgress * fragment.portion);
            this.$store.commit('activeFragment', fragment);
            fragment.video.element.currentTime = videoProgress * fragment.video.element.duration;
        },
        moveStart(e, fragmentIndex) {
            this.fragmentIndex = fragmentIndex;
            this.seekToProgress(e);
        },
        move(e) {
            if (this.fragmentIndex !== false) {
                this.seekToProgress(e);
                requestAnimationFrame(() => this.calculateSeekPosition());
            }
        },
        moveEnd(e) {
            if (this.fragmentIndex !== false)
                this.seekToProgress(e);
            this.fragmentIndex = false;
        },
        calculateSeekPosition() {
            const fragmentProgress = this.activeFragment.progress;
            const visualFragment = this.visualFragments.find(v =>
                v.fragment === this.activeFragment &&
                v.start <= fragmentProgress && fragmentProgress <= v.end
            );
            if (visualFragment === undefined)
                return;

            const margin = (visualFragment.continuesLeft ? 0 : 10) + (visualFragment.continuesRight ? 0 : 10);
            this.activeVisualFragment = visualFragment;
            let visualFragmentProgress = (fragmentProgress - visualFragment.start) / (visualFragment.end - visualFragment.start);
            this.seekLeft = Math.round(
                Utils.clamp(visualFragmentProgress) *
                (visualFragment.width - margin) * 100
            ) / 100;
        },
        renderAudio() {
            if (!this.$refs.audioCanvases)
                return;
            if (this.$refs.audioCanvases.length !== this.visualFragments.length)
                return;
            for (let i = 0; i < this.visualFragments.length; i++) {
                const fragment = this.visualFragments[i];
                const pcm = fragment.fragment.video.pcm;
                if (pcm === undefined)
                    continue;
                const canvas = this.$refs.audioCanvases[i];
                const context = canvas.getContext('2d');
                context.clearRect(0, 0, canvas.width, canvas.height);

                const visFragStart = fragment.fragment.start + fragment.start * fragment.fragment.portion;
                const visFragEnd = fragment.fragment.start + fragment.end * fragment.fragment.portion;
                const startIndex = Math.floor(visFragStart * pcm.length)
                const endIndex = Math.floor(visFragEnd * pcm.length)

                context.fillStyle = this.themeColors.secondary;
                context.strokeStyle = this.themeColors.primary;
                context.beginPath();
                context.moveTo(0, canvas.height);
                for (let j = startIndex; j < endIndex; j++) {
                    let height = pcm[j] * canvas.height * fragment.fragment.volume;
                    context.lineTo((j - startIndex) / (endIndex - startIndex) * canvas.width, canvas.height - height);
                }
                context.lineTo(canvas.width, canvas.height);
                context.lineTo(0, canvas.height);
                context.stroke();
                context.fill();
            }
        },
        updateFragmentsLayout() {
            if (this.fragments.length === 0)
                return;

            let currentOffsetLeft = 0;
            const visualFragments = [];
            const fragmentQueue = [...this.fragments];
            const fullWidth = this.bounds.width;
            while (fragmentQueue.length > 0) {
                const fragment = fragmentQueue.shift();
                const fits = fragment.width + currentOffsetLeft < fullWidth;
                if (fits) {
                    currentOffsetLeft += fragment.width;
                    visualFragments.push(fragment);
                } else {
                    const splitSizeLeft = fullWidth - currentOffsetLeft;
                    const splitSizeRight = fragment.width - splitSizeLeft;
                    const leftPartExists = splitSizeLeft > 30;
                    const rightPartExists = splitSizeRight > 30;

                    if (leftPartExists)
                        visualFragments.push({
                            ...fragment,
                            width: splitSizeLeft,
                            continuesRight: rightPartExists,
                            end: (fragment.leftPixels + splitSizeLeft) / fragment.fullWidth,
                        });

                    if (rightPartExists) {
                        const leftPixels = fragment.leftPixels + (leftPartExists ? splitSizeLeft : 0);
                        fragmentQueue.unshift({
                            ...fragment,
                            width: splitSizeRight,
                            continuesLeft: leftPartExists,
                            leftPixels,
                            start: leftPixels / fragment.fullWidth
                        });
                    }
                    currentOffsetLeft = 0;
                }
            }
            this.$nextTick(() => {
                this.calculateSeekPosition();
                if (this.$refs.audioCanvases) {
                    for (const canvas of this.$refs.audioCanvases) {
                        const bounds = canvas.getBoundingClientRect();
                        canvas.width = bounds.width;
                        canvas.height = bounds.height;
                    }
                    this.renderAudio();
                    this.timelineVideos.filter(v => !v.pcmLoaded).forEach(v => v.on('pcm', () => this.renderAudio()));
                }
            });
            this.visualFragments = visualFragments;
        },
        windowResize() {
            this.bounds = this.$refs.timeline.getBoundingClientRect();
            this.$nextTick(() => {
                requestAnimationFrame(() => this.updateFragmentsLayout());
            });
        },
    },
    watch: {
        activeFragment() {
            this.$nextTick(() => {
                requestAnimationFrame(() => this.calculateSeekPosition());
            });
        },
        progress() {
            requestAnimationFrame(() => this.calculateSeekPosition());
        },
        'activeFragment.end'() {
            this.$nextTick(() => {
                requestAnimationFrame(() => this.updateFragmentsLayout());
            });
        },
        'activeFragment.start'() {
            this.$nextTick(() => {
                requestAnimationFrame(() => this.updateFragmentsLayout());
            });
        },
        'activeFragment.playbackRate'() {
            this.$nextTick(() => {
                requestAnimationFrame(() => this.updateFragmentsLayout());
            });
        },
        'activeFragment.volume'() {
            requestAnimationFrame(() => this.renderAudio());
        },
        timeline() {
            this.$nextTick(() => {
                requestAnimationFrame(() => this.updateFragmentsLayout());
            });
        },
    },
    computed: {
        fragments() {
            return this.timeline.map(fragment => {
                const pixelWidth = Math.max(fragment.adjustedDuration * this.widthPerSecond, this.minFragmentWidth);
                return {
                    fragment,
                    fullWidth: pixelWidth,
                    width: pixelWidth,
                    screenshots: fragment.video.screenshots,
                    continuesRight: false,
                    continuesLeft: false,
                    start: 0,
                    end: 1,
                    leftPixels: 0,
                };
            });
        },
        ...mapGetters(['timelineVideos', 'fragmentAtProgress', 'themeColors', 'progressAtFragmentProgress']),
        ...mapState({
            activeFragment: state => state.activeFragment,
            timeline: state => state.timeline,
            minFragmentWidth: state => state.configTimeline.minFragmentWidth,
            widthPerSecond: state => state.configTimeline.widthPerSecond,
            progress: state => state.player.progress,
        }),
    },
}
</script>

<style scoped>
.timeline {
    --border-radius: 10px;
}

.fragment {
    height: 125px;
    display: inline-block;
    margin-bottom: 10px;
    padding: 10px;
    border-radius: calc(var(--border-radius) * 1.5);
    cursor: pointer;
    box-shadow: inset 0 0px 0px 0 #5b5b5b;
    transition: box-shadow 0.3s;
}

.visual-fragment {
    width: 100%;
    height: 105px;
    display: inline-flex;
    flex-direction: column;
}

.continues-left.fragment {
    padding-left: 0;
}

.continues-right.fragment {
    padding-right: 0;
}

.fragment > * {
    pointer-events: none;
}

.fragment-background {
    /*box-shadow: 0 0 0 1px grey;*/
    border-radius: var(--border-radius) var(--border-radius) 0 0;
    width: 100%;
    height: 100%;
    background-color: var(--soft-background);
    background-repeat: repeat;
    background-size: auto 100%;
    background-position: left;
}

.active {
    box-shadow: inset 0 -4px 10px 0 #5b5b5b;
    /*box-shadow: inset 0 -8px 15px -5px var(--secondary);*/
    /*box-shadow: inset 0 -8px 15px -5px #5b5b5b;*/
}

.continues-right .fragment-background, .continues-right .audio-wave, .continues-right.fragment {
    border-top-right-radius: 0 !important;
    border-bottom-right-radius: 0 !important;
}

.continues-left .fragment-background, .continues-left .audio-wave, .continues-left.fragment {
    border-top-left-radius: 0 !important;
    border-bottom-left-radius: 0 !important;
}

.audio-wave {
    width: 100%;
    height: 25px;
    background-color: rgba(80, 80, 80, 0.4);
    border-radius: 0 0 var(--border-radius) var(--border-radius);
}

.seek-thumb {
    width: 4px;
    height: 105px;
    position: relative;
    background-color: var(--primary);
    box-shadow: 0 0 10px 0 rgba(255, 255, 255, 0.5);
    margin-top: -105px;
    border-radius: 2px;
}
</style>