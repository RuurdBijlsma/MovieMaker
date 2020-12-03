<template>
    <div ref="timeline">
        <div class="fragment" v-for="fragment in visualFragments" :style="{
            width: fragment.width + 'px',
        }">
            <div class="fragment-background"
                 @mousedown="$store.commit('activeFragment', fragment.fragment)"
                 :class="{
                    'continues-right': fragment.continuesRight,
                    'continues-left': fragment.continuesLeft,
                    'active-fragment': fragment.fragment === activeFragment,
                }"
                 :style="{
                backgroundImage: `url(${fragment.screenshots.merged})`,
                backgroundPositionX: (-1 * fragment.leftPixels) + 'px'
            }"></div>
            <canvas class="audio-wave" ref="audioCanvases" :class="{
                'continues-right': fragment.continuesRight,
                'continues-left': fragment.continuesLeft,
            }"></canvas>
        </div>
    </div>
</template>

<script>
import {mapGetters, mapState} from "vuex";

export default {
    name: "Timeline",
    data: () => ({
        bounds: null,
        visualFragments: [],
        lazyUpdateTimeout: -1,
    }),
    mounted() {
        this.windowResize();
        window.addEventListener('resize', this.windowResize, false);
    },
    beforeDestroy() {
        window.removeEventListener('resize', this.windowResize);
        clearTimeout(this.lazyUpdateTimeout);
        requestAnimationFrame(() => this.renderAudio());
    },
    methods: {
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

                const start = Math.floor(fragment.start * pcm.length)
                const end = Math.floor(fragment.end * pcm.length)

                context.fillStyle = 'rgba(0, 222, 100, 0.4)';
                context.strokeStyle = 'green';
                let x = 0;
                context.beginPath();
                context.moveTo(x, canvas.height);
                for (let x = 0; x < canvas.width; x++) {
                    let index = start + Math.floor((end - start) * (x / canvas.width))
                    let value = pcm[index] * canvas.height * fragment.fragment.volume;
                    context.lineTo(x++, canvas.height - value);
                }
                // for (let j = start; j < end; j++) {
                //     let value = pcm[j] * canvas.height * fragment.fragment.volume;
                //     context.lineTo(x++, canvas.height - value);
                // }
                context.stroke();
                context.lineTo(x, canvas.height);
                context.fill();
            }
        },
        lazyUpdateFragmentsLayout() {
            // clearTimeout(this.lazyUpdateTimeout);
            // this.lazyUpdateTimeout = setTimeout(() => this.updateFragmentsLayout(), 150);
            this.updateFragmentsLayout();
        },
        updateFragmentsLayout() {
            if (this.fragments.length === 0)
                return;

            let currentOffsetLeft = 0;
            let visualFragments = [];
            let fragmentQueue = [...this.fragments];
            let fullWidth = this.bounds.width;
            while (fragmentQueue.length > 0) {
                let fragment = fragmentQueue.shift();
                let fits = fragment.width + currentOffsetLeft < fullWidth;
                if (fits) {
                    currentOffsetLeft += fragment.width;
                    visualFragments.push(fragment);
                } else {
                    let splitSizeLeft = fullWidth - currentOffsetLeft;
                    let splitSizeRight = fragment.width - splitSizeLeft;
                    let leftPartExists = splitSizeLeft > 30;
                    let rightPartExists = splitSizeRight > 30;

                    if (leftPartExists)
                        visualFragments.push({
                            ...fragment,
                            width: splitSizeLeft,
                            continuesRight: rightPartExists,
                            end: fragment.fragment.start + fragment.fragment.portion * (fragment.leftPixels + splitSizeLeft) / fragment.fullWidth,
                        });

                    if (rightPartExists) {
                        let leftPixels = fragment.leftPixels + (leftPartExists ? splitSizeLeft : 0);
                        fragmentQueue.unshift({
                            ...fragment,
                            width: splitSizeRight,
                            continuesLeft: leftPartExists,
                            leftPixels,
                            start: fragment.fragment.start + fragment.fragment.portion * leftPixels / fragment.fullWidth
                        });
                    }
                    currentOffsetLeft = 0;
                }
            }
            this.$nextTick(() => {
                for (let canvas of this.$refs.audioCanvases) {
                    let bounds = canvas.getBoundingClientRect();
                    canvas.width = bounds.width;
                    canvas.height = bounds.height;
                }
                this.timelineVideos.filter(v => !v.pcmLoaded).forEach(v => v.on('pcm', () => this.renderAudio()));
                this.renderAudio()
            });
            this.visualFragments = visualFragments;
        },
        windowResize() {
            this.bounds = this.$refs.timeline.getBoundingClientRect();
            this.lazyUpdateFragmentsLayout();
        },
    },
    watch: {
        'activeFragment.playbackRate'() {
            requestAnimationFrame(() => this.updateFragmentsLayout());
        },
        'activeFragment.volume'() {
            requestAnimationFrame(() => this.renderAudio());
        },
        timeline() {
            this.updateFragmentsLayout();
        },
    },
    computed: {
        fragments() {
            return this.timeline.map(fragment => {
                let pixelWidth = Math.max(fragment.adjustedDuration * this.widthPerSecond, this.minFragmentWidth);
                return {
                    fragment,
                    fullWidth: pixelWidth,
                    width: pixelWidth,
                    screenshots: fragment.video.screenshots,
                    continuesRight: false,
                    continuesLeft: false,
                    start: fragment.start,
                    end: fragment.end,
                    leftPixels: 0,
                };
            });
        },
        ...mapGetters(['timelineVideos']),
        ...mapState({
            activeFragment: state => state.activeFragment,
            timeline: state => state.timeline,
            minFragmentWidth: state => state.configTimeline.minFragmentWidth,
            widthPerSecond: state => state.configTimeline.widthPerSecond,
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
    display: inline-flex;
    margin-bottom: 10px;
    padding: 10px;
    flex-direction: column;
}

.fragment-background {
    /*box-shadow: 0 0 0 1px grey;*/
    border-radius: var(--border-radius) var(--border-radius) 0 0;
    width: 100%;
    height: 100%;
    background-color: grey;
    background-repeat: repeat;
    background-size: auto 100%;
    background-position: left;
    cursor: pointer;
}

.active-fragment {
    box-shadow: 0 0 20px 2px rgba(128, 128, 128, 0.7);
}

.continues-right {
    border-top-right-radius: 0 !important;
    border-bottom-right-radius: 0 !important;
}

.continues-left {
    border-top-left-radius: 0 !important;
    border-bottom-left-radius: 0 !important;
}

.audio-wave {
    width: 100%;
    height: 30px;
    background-color: rgba(128, 128, 128, 0.4);
    border-radius: 0 0 var(--border-radius) var(--border-radius);
}
</style>