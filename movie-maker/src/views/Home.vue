<template>
    <div class="home">
        <div class="home-no-foot">
            <div class="left-panel">
                <editor class="editor" v-if="activeFragment"></editor>
                <div v-else class="no-data">
                    <v-icon class="no-data-icon" :size="windowWidth / 5">mdi-video-off-outline</v-icon>
                    <h1>Import a video to start</h1>
                    <p>Drag a video here or click the import videos button</p>
                    <v-btn :loading="importVideoLoading" @click="promptVideoInput" color="primary" rounded>
                        Import videos
                    </v-btn>
                    <div class="undo-redo mt-3">
                        <v-btn @click="undo" text v-if="canUndo">
                            <v-icon small>mdi-undo</v-icon>
                            <span class="redo-button">Undo</span>
                        </v-btn>
                        <v-btn @click="redo" text v-if="canRedo">
                            <v-icon small>mdi-redo</v-icon>
                            <span class="redo-button">Redo</span>
                        </v-btn>
                    </div>
                </div>
            </div>
            <history v-if="undoStack.length > 0 && scale > 2" class="right-panel"></history>
        </div>
        <v-footer v-if="activeFragment">
            <video-info-footer></video-info-footer>
        </v-footer>
    </div>
</template>

<script>

import {mapActions, mapGetters, mapState} from "vuex";
import Editor from "@/components/Editor";
import History from "@/components/History";
import VideoInfoFooter from "@/components/VideoInfoFooter";

export default {
    name: "Home",
    components: {VideoInfoFooter, History, Editor},
    data: () => ({}),
    mounted() {
    },
    beforeDestroy() {
    },
    methods: {
        ...mapActions(['promptVideoInput', 'redo', 'undo']),
    },
    computed: {
        ...mapGetters(['canRedo', 'canUndo', 'scale']),
        ...mapState({
            undoStack: state => state.command.undoStack,
            activeFragment: state => state.activeFragment,
            importVideoLoading: state => state.loading.videoImport,
            windowWidth: state=>state.windowWidth,
        }),
    },
}
</script>

<style scoped>
.home {
    height: calc(100vh - 64px);
    max-height: calc(100vh - 64px);
    display: flex;
    flex-direction: column;
}

@media (max-width: 959px) {
    .home {
        height: calc(100vh - 56px);
        max-height: calc(100vh - 56px);
    }
    .no-data{
        height: 100% !important;
    }
}

.home-no-foot {
    display: flex;
    height: calc(100% - 44px);
}

.left-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    max-height: 100%;
    flex-grow: 1;
}

.no-data {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 70%;
    flex-direction: column;
}

.no-data-icon {
    opacity: 0.3;
}

.no-data h1 {
    margin-bottom: 20px;
}

.no-data p {
    margin-bottom: 30px;
    opacity: 0.8;
}

.redo-button {
    text-transform: uppercase;
    margin-left: 10px;
}
</style>