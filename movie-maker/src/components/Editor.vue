<template>
    <div class="editor">
        <edit-buttons class="top-panel"></edit-buttons>
        <div class="bottom-panel">
            <div class="left-panel">
                <video-player></video-player>
            </div>
            <v-divider vertical></v-divider>
            <div class="right-panel">
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

export default {
    name: "Editor",
    components: {EditButtons, Timeline, VideoPlayer}
}
</script>

<style scoped>
.editor {
    height: 100%;
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
}

.left-panel {
    /*border-right: 1px solid rgba(128, 128, 128, 0.5);*/
    width: 50%;
}

.right-panel {
    width: 50%;
    padding: 10px;
}

.timeline {
    width: 100%;
    height: 100%;
}
</style>