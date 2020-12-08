<template>
    <div class="home">
        <editor class="editor" v-if="activeFragment"></editor>
        <div v-else class="no-data">
            <v-icon class="no-data-icon" size="300">mdi-video-off-outline</v-icon>
            <h1>Import a video to start</h1>
            <p>Drag a video here or click the import videos button</p>
            <v-btn :loading="importLoading" @click="promptVideoInput" color="primary" rounded>
                Import videos
            </v-btn>
            <v-btn @click="redo" text class="mt-2" v-if="undoStack.length > 0">
                <v-icon small>mdi-redo</v-icon>
                <span class="redo-button">Redo</span>
            </v-btn>
        </div>
    </div>
</template>

<script>

import {mapActions, mapState} from "vuex";
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
        ...mapActions(['promptVideoInput', 'redo']),
    },
    computed: {
        ...mapState({
            activeFragment: state => state.activeFragment,
            importLoading: state => state.importLoading,
            undoStack: state => state.command.undoStack,
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