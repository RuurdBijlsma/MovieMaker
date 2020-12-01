<template>
    <div ref="timeline">
        <div class="fragment" v-for="fragment in visualFragments" :style="{
            width: fragment.width + 'px',
        }">
            <div class="fragment-background" :class="{
                'fragment-continues-right': fragment.continuesRight,
                'fragment-continues-left': fragment.continuesLeft,
                'active-fragment': fragment.fragment === activeFragment,
            }" :style="{
                backgroundImage: `url(${fragment.screenshots.merged})`,
                backgroundPositionX: (-1 * fragment.leftCrop) + 'px'
            }"></div>
        </div>
    </div>
</template>

<script>
import {mapState} from "vuex";

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
    },
    methods: {
        lazyUpdateFragmentsLayout() {
            clearTimeout(this.lazyUpdateTimeout);
            this.lazyUpdateTimeout = setTimeout(() => this.updateFragmentsLayout(), 150);
        },
        updateFragmentsLayout() {
            console.log("Updating layout")
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
                        visualFragments.push({...fragment, width: splitSizeLeft, continuesRight: rightPartExists});

                    if (rightPartExists)
                        fragmentQueue.unshift({
                            ...fragment,
                            width: splitSizeRight,
                            leftCrop: fragment.leftCrop + splitSizeLeft,
                            continuesLeft: leftPartExists,
                        });
                    currentOffsetLeft = 0;
                }
            }
            this.visualFragments = visualFragments;
        },
        windowResize() {
            this.bounds = this.$refs.timeline.getBoundingClientRect();
            this.lazyUpdateFragmentsLayout();
        },
    },
    watch: {
        timeline() {
            console.log("Timeline changed", this.timeline);
            this.updateFragmentsLayout();
        },
    },
    computed: {
        //Fragments contain width and screenshots of timeline fragment
        fragments() {
            return this.timeline.map(fragment => {
                let pixelWidth = Math.max(fragment.adjustedDuration * this.widthPerSecond, this.minFragmentWidth);
                return {
                    fragment,
                    width: pixelWidth,
                    screenshots: fragment.video.screenshots,
                    leftCrop: 0,
                    continuesRight: false,
                    continuesLeft: false,
                };
            });
        },
        ...mapState({
            activeFragment: state => state.activeFragment,
            timeline: state => state.timeline,
            minFragmentWidth: state => state.timelineConfig.minFragmentWidth,
            widthPerSecond: state => state.timelineConfig.widthPerSecond,
        }),
    },
}
</script>

<style scoped>
.fragment {
    height: 100px;
    display: inline-flex;
    margin-bottom: 10px;
    padding: 10px;
}

.fragment-background {
    box-shadow: 0 0 0 1px grey;
    border-radius: 15px;
    width: 100%;
    height: 100%;
    background-color: grey;
    background-repeat: repeat;
    background-size: auto 100%;
    background-position: left;
    cursor: pointer;
}

.active-fragment {
    box-shadow: 0 0 20px 0 rgba(128, 128, 128, 0.8), 0 0 0 1px grey;
}

.fragment-continues-right {
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
}

.fragment-continues-left {
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
}
</style>