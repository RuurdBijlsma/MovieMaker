<template>
    <div class="video-info">
        <span class="not-uppercase">{{ video.fileName }}</span>
        <span>resolution: {{ video.width }}<span class="not-uppercase">x</span>{{ video.height }}</span>
        <span>fps: {{ video.fps }}</span>
        <span>bitrate: <span class="not-uppercase">{{ readableBitrate(video.bitrate) }}</span></span>
    </div>
</template>

<script>
import {mapState} from "vuex";
import Utils from "@/js/Utils";

export default {
    name: "VideoInfoFooter",
    methods: {
        readableBitrate(bitrate) {
            return Utils.readableBytes(bitrate, true) + '/s';
        },
    },
    computed: {
        video() {
            return this.activeFragment.video;
        },
        ...mapState({
            activeFragment: state => state.activeFragment,
        }),
    }
}
</script>

<style scoped>
.video-info {

}

.video-info > span {
    opacity: 0.7;
    text-transform: uppercase;
    font-size: 12px;
    margin-right: 30px;
}

.not-uppercase {
    text-transform: none !important;
}
</style>