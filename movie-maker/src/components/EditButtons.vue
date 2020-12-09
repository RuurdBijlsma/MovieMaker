<template>
    <div class="edit-container">
        <v-sheet class="edit-buttons">
            <div class="flow-buttons">
                <v-btn small rounded text @click="split">
                    <span class="button-caption button-layout">Split</span>
                    <v-icon small>mdi-arrow-split-vertical</v-icon>
                </v-btn>
                <v-btn small rounded text @click="setStartPoint">
                    <span class="button-caption button-layout">Set start</span>
                    <v-icon small>mdi-contain-start</v-icon>
                </v-btn>
                <v-btn small rounded text @click="setEndPoint">
                    <span class="button-caption button-layout">Set end</span>
                    <v-icon small>mdi-contain-end</v-icon>
                </v-btn>
            </div>
            <div class="sliders">
                <volume-slider></volume-slider>
                <playback-rate-slider></playback-rate-slider>
            </div>
            <div class="flow-buttons fb2">
                <v-btn small rounded text @click="removeFragment()">
                    <span class="button-caption button-layout">Delete</span>
                    <v-icon small>mdi-delete</v-icon>
                </v-btn>
                <div class="two-way-buttons">
                    <v-btn :disabled="!canMoveLeft" small icon @click="shiftFragment({shift: -1})">
                        <v-icon small>mdi-chevron-left</v-icon>
                    </v-btn>
                    <span class="button-caption two-way-caption">Move</span>
                    <v-btn :disabled="!canMoveRight" small icon @click="shiftFragment({shift: 1})">
                        <v-icon small>mdi-chevron-right</v-icon>
                    </v-btn>
                </div>
                <div class="two-way-buttons">
                    <v-btn :disabled="!canUndo" small icon @click="undo">
                        <v-icon small>mdi-undo</v-icon>
                    </v-btn>
                    <span class="button-caption two-way-caption">Undo</span>
                    <v-btn :disabled="!canRedo" small icon @click="redo">
                        <v-icon small>mdi-redo</v-icon>
                    </v-btn>
                </div>
            </div>
        </v-sheet>
        <v-divider></v-divider>
    </div>
</template>

<script>
import VolumeSlider from "@/components/VolumeSlider";
import PlaybackRateSlider from "@/components/PlaybackRateSlider";
import {mapActions, mapGetters} from "vuex";

export default {
    name: "EditButtons",
    components: {PlaybackRateSlider, VolumeSlider},
    methods: {
        ...mapActions(['split', 'setStartPoint', 'setEndPoint', 'removeFragment', 'shiftFragment', 'undo', 'redo']),
    },
    computed: {
        ...mapGetters(['canUndo', 'canRedo', 'canMoveRight', 'canMoveLeft'])
    },
}
</script>

<style scoped>
.edit-container {
    display: flex;
    flex-direction: column;
}

.edit-buttons {
    height: 100%;
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

.button-layout {
    margin-right: 10px;
    width: 70px;
}

.button-caption {
    text-transform: uppercase;
    font-size: 12px;
    opacity: 0.7;
    text-align: right;
    display: inline-block;
}

.fb2 .button-layout {
    width: 50px;
}

.two-way-caption {
    margin: 0 10px;
}

.sliders {
    display: flex;
}

.move-buttons {
    height: 100%;
    display: flex;
    place-items: center;
}
</style>