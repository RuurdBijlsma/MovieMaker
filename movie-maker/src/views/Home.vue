<template>
    <div class="home">
        <editor class="editor" v-if="activeFragment"></editor>
        <div v-else class="no-data">
            <v-icon class="no-data-icon" size="300">mdi-video-off-outline</v-icon>
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
</template>

<script>

import {mapActions, mapGetters, mapState} from "vuex";
import Editor from "@/components/Editor";

export default {
    name: "Home",
    components: {Editor},
    data: () => ({}),
    mounted() {
    },
    beforeDestroy() {
    },
    methods: {
        ...mapActions(['promptVideoInput', 'redo', 'undo']),
    },
    computed: {
        ...mapGetters(['canRedo', 'canUndo']),
        ...mapState({
            activeFragment: state => state.activeFragment,
            importVideoLoading: state => state.loading.videoImport,
        }),
    },
}
</script>

<style scoped>
.home {
    display: flex;
    flex-direction: column;
    height: 100%;
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