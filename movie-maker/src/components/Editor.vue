<template>
    <div class="editor">
        <v-sheet color="softBackground" class="top-panel">
            <div class="flow-buttons">
                <v-btn small rounded text>
                    <span class="button-caption">Split</span>
                    <v-icon small>mdi-arrow-split-vertical</v-icon>
                </v-btn>
                <v-btn small rounded text>
                    <span class="button-caption">Set start</span>
                    <v-icon small>mdi-contain-start</v-icon>
                </v-btn>
                <v-btn small rounded text>
                    <span class="button-caption">Set end</span>
                    <v-icon small>mdi-contain-end</v-icon>
                </v-btn>
            </div>
            <div class="sliders">
                <volume-slider></volume-slider>
                <playback-rate-slider></playback-rate-slider>
            </div>
            <div class="flow-buttons fb2">
                <v-btn small rounded text>
                    <span class="button-caption">Delete</span>
                    <v-icon small>mdi-delete</v-icon>
                </v-btn>
                <v-btn small rounded text>
                    <span class="button-caption">Undo</span>
                    <v-icon small>mdi-undo</v-icon>
                </v-btn>
                <v-btn small rounded text>
                    <span class="button-caption">Redo</span>
                    <v-icon small>mdi-redo</v-icon>
                </v-btn>
            </div>
        </v-sheet>
        <div class="bottom-panel">
            <div class="left-panel">
                <video-player></video-player>
            </div>
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

export default {
    name: "Editor",
    components: {PlaybackRateSlider, VolumeSlider, Timeline, VideoPlayer}
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
    display: flex;
    padding: 0 25px;
    justify-content: space-evenly;
}

.flow-buttons {
    display: flex;
    flex-direction: column;
    height: 100%;
    justify-content: center;
}

.flow-buttons > * {
    margin: 2px 0;
}

.flow-buttons span {
    text-transform: uppercase;
    font-size: 12px;
    opacity: 0.7;
    margin-right: 10px;
    width: 70px;
    text-align: right;
    display: inline-block;
}

.fb2 span {
    width: 50px;
}

.sliders {
    display: flex;
}

.bottom-panel {
    flex-grow: 1;
    padding: 5px;
    display: flex;
}

.left-panel {
    border-right: 1px solid rgba(128, 128, 128, 0.5);
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