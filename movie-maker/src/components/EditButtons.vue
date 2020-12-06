<template>
    <v-sheet color="softBackground" class="edit-buttons">
        <div class="flow-buttons">
            <v-btn small rounded text @click="split">
                <span class="button-caption">Split</span>
                <v-icon small>mdi-arrow-split-vertical</v-icon>
            </v-btn>
            <v-btn small rounded text @click="setStartPoint">
                <span class="button-caption">Set start</span>
                <v-icon small>mdi-contain-start</v-icon>
            </v-btn>
            <v-btn small rounded text @click="setEndPoint">
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
</template>

<script>
import VolumeSlider from "@/components/VolumeSlider";
import PlaybackRateSlider from "@/components/PlaybackRateSlider";
import {mapActions} from "vuex";

export default {
    name: "EditButtons",
    components: {PlaybackRateSlider, VolumeSlider},
    methods:{
        ...mapActions(['split', 'setStartPoint','setEndPoint']),
    }
}
</script>

<style scoped>
.edit-buttons {
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
</style>