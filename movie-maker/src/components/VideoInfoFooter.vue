<template>
    <div class="video-info">
        <span @click="openFolder(video.filePath)" v-ripple class="clickable not-uppercase">{{ video.fileName }}</span>
        <span>resolution: {{ video.width }}<span class="not-uppercase">x</span>{{ video.height }}</span>
        <span>fps: {{ video.fps }}</span>
        <span>bitrate: <span class="not-uppercase">{{ readableBitrate(video.bitrate) }}</span></span>
    </div>
</template>

<script>
import {mapActions, mapState} from "vuex";
import Utils from "@/js/Utils";

export default {
    name: "VideoInfoFooter",
    methods: {
        readableBitrate(bitrate) {
            return Utils.readableBytes(bitrate, true) + '/s';
        },
        ...mapActions(['openFolder']),
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
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.video-info > span {
    opacity: 0.7;
    text-transform: uppercase;
    font-size: 12px;
    margin-right: 20px;
    padding: 5px 10px;
}

.not-uppercase {
    text-transform: none !important;
}

.clickable {
    display: inline-block;
    border-radius: 3px;
    cursor: pointer;
    text-shadow: 0 0 10px transparent;
    transition: text-shadow 0.15s;
}
</style>