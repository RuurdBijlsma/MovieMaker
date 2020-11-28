<template>
    <div class="home">
        <div class="left-panel">
            <video controls></video>
        </div>
        <div class="right-panel">

        </div>
    </div>
</template>

<script>

export default {
    name: "Home",
    components: {},
    data: () => ({}),
    mounted() {
    },
    beforeDestroy() {
    },
    methods: {},
    watch: {},
    computed: {},
    beforeRouteLeave(to, from, next) {

    },
}
</script>

<style scoped>
.home {
    padding: 20px;
    display: flex;
    height: 100%;
}

.left-panel {
    border-right: 1px solid rgba(128, 128, 128, 0.5);
    width: 50%;
}

.right-panel {
    flex-grow: 1;
}
</style>