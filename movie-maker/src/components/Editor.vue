<template>
    <div class="editor">
        <edit-buttons class="top-panel"></edit-buttons>
        <div class="bottom-panel" ref="panel">
            <div class="left-panel" :style="{
                width: Math.round(playerWidth * 10000) / 100 + '%',
            }">
                <video-player></video-player>
            </div>
            <div class="divider" @mousedown="startMove">
                <div ref="divider" class="divider-inner"></div>
            </div>
            <div class="right-panel" :style="{
                width: Math.round((1-playerWidth) * 10000) / 100 + '%',
            }">
                <timeline class="timeline"></timeline>
            </div>
        </div>
    </div>
</template>

<script>
import VideoPlayer from "@/components/VideoPlayer";
import Timeline from "@/components/Timeline";
import VolumeSlider from "@/components/VolumeSlider";
import PlaybackRateSlider from "@/components/PlaybackRateSlider";
import EditButtons from "@/components/EditButtons";
import {mapState} from "vuex";

export default {
    name: "Editor",
    components: {EditButtons, Timeline, VideoPlayer},
    data: () => ({
        mouseDown: false,
    }),
    beforeDestroy() {
        document.removeEventListener('mousemove', this.move);
        document.removeEventListener('mouseup', this.endMove);
    },
    mounted() {
        document.addEventListener('mousemove', this.move, false);
        document.addEventListener('mouseup', this.endMove, false);
    },
    methods: {
        startMove(e) {
            this.mouseDown = true;
            this.resize(e);
        },
        move(e) {
            if (this.mouseDown)
                this.resize(e);
        },
        endMove(e) {
            if (this.mouseDown)
                this.resize(e);
            this.mouseDown = false;
        },
        resize(e) {
            let bounds = this.$refs.panel.getBoundingClientRect();
            let x = e.pageX - bounds.left;
            this.$store.commit('playerWidth', x / bounds.width);
        },
    },
    computed: {
        ...mapState({
            playerWidth: state => state.player.widthPercent,
        }),
    }
}
</script>

<style scoped>
.editor {
    height: 100%;
    max-height: 100%;
    display: flex;
    flex-direction: column;
}

.top-panel {
    height: 110px;
    width: 100%;
}

.bottom-panel {
    flex-grow: 1;
    display: flex;
    max-height: calc(100% - 110px);
}

.left-panel {
    /*border-right: 1px solid rgba(128, 128, 128, 0.5);*/
    width: 50%;
    min-width:250px;
    z-index: 1;
}

.divider {
    height: 100%;
    padding-left: 7px !important;
    padding-right: 7px !important;
    display: flex;
    margin-left: -7px;
    margin-right: -7px;
    cursor: e-resize;
    z-index: 3;
}

.divider-inner {
    pointer-events: none;
    background-color: var(--soft-foreground);
    opacity: 0.2;
    height: 100%;
    width: 1px;
}

.right-panel {
    min-width:150px;
    width: 50%;
    max-height: 100%;
    z-index: 1;
}

.timeline {
    width: 100%;
    height: 100%;
}
</style>