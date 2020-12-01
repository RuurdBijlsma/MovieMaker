<template>
    <div class="home">
        <div class="left-panel">
            <video-player></video-player>
        </div>
        <div class="right-panel">
            <timeline class="timeline"></timeline>
        </div>
    </div>
</template>

<script>

import Timeline from "@/components/Timeline";
import VideoPlayer from "@/components/VideoPlayer";

export default {
    name: "Home",
    components: {VideoPlayer, Timeline},
    data: () => ({}),
    mounted() {
    },
    beforeDestroy() {
    },
    methods: {},
    watch: {},
    computed: {
    },
}
</script>

<style scoped>
.home {
    padding: 5px;
    display: flex;
    height: 100%;
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