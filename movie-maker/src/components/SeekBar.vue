<template>
    <div class="seek" @mousedown="moveStart" ref="seek">
        <v-sheet color="secondary darken-2" class="seek-background">
            <v-sheet color="secondary" class="seek-progress" :style="{
                width: percentage + '%',
            }"></v-sheet>
            <v-sheet color="primary" class="seek-thumb" :style="{
                left: `calc(${percentage}% - 0.25em)`,
            }"></v-sheet>
        </v-sheet>
    </div>
</template>

<script>
import {mapState} from "vuex";

export default {
    name: "SeekBar",
    data: () => ({
        seekDown: false,
    }),
    beforeDestroy() {
        document.removeEventListener('mousemove', this.move);
        document.removeEventListener('mouseup', this.moveEnd);
    },
    mounted() {
        document.addEventListener('mousemove', this.move, false);
        document.addEventListener('mouseup', this.moveEnd, false);
    },
    methods: {
        progressFromEvent(e) {
            let bounds = this.$refs.seek.getBoundingClientRect();
            let x = e.pageX - bounds.left;
            return Math.max(Math.min(x / bounds.width, 1), 0);
        },
        moveStart(e) {
            this.seekDown = true;
            this.seek(this.progressFromEvent(e));
        },
        move(e) {
            if (this.seekDown)
                this.seek(this.progressFromEvent(e));
        },
        moveEnd(e) {
            if (this.seekDown)
                this.seek(this.progressFromEvent(e));
            this.seekDown = false;
        },
        seek(progress) {
            this.$store.commit('progress', progress);
        },
    },
    computed: {
        percentage() {
            return Math.round(this.progress * 100000) / 1000;
        },
        ...mapState({
            progress: state => state.player.progress,
        }),
    },
}
</script>

<style scoped>
.seek {
    width: 100%;
    padding: 5px 0;
    cursor: pointer;
}

.seek > * {
    pointer-events: none;
}

.seek-background {
    width: 100%;
    height: 0.5em;
    border-radius: 0.15em;
}

.seek-progress {
    width: 30%;
    height: 100%;
    border-bottom-left-radius: 0.15em;
    border-top-left-radius: 0.15em;
}

.seek-thumb {
    left: 0;
    top: -0.75em;
    position: relative;
    width: 0.5em;
    height: 1em;
    border-radius: 0.15em;
}
</style>