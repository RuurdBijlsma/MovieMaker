<template>
    <perfect-scrollbar class="graph">
        <v-card color="primary darken-1" class="node input" v-for="(video, i) in videoFiles">
            <v-card-text class="node-input"><b>Input: </b>{{ video.filePath }}</v-card-text>
            <v-card-text class="node-output"><b>Output: </b>[{{ i }}:v]</v-card-text>
        </v-card>
        <v-card color="primary darken-4" class="node input" v-for="(video, i) in videoFiles">
            <v-card-text class="node-input"><b>Input: </b>{{ video.filePath }}</v-card-text>
            <v-card-text class="node-output"><b>Output: </b>[{{ i }}:a]</v-card-text>
        </v-card>
        <v-card :color="`secondary darken-${chain.inputs.includes('a') ? '2' : '0'}`" class="node" v-for="chain in complexFilter">
            <v-card-text class="node-input"><b>Input: </b> {{ chain.inputs }}</v-card-text>
            <v-card-title v-for="subFilter in chain.filter.split(',')" class="node-filter">
                {{ subFilter }}
            </v-card-title>
            <v-card-text class="node-output"><b>Output: </b> {{ chain.outputs }}</v-card-text>
        </v-card>
        <v-card color="success" class="node output">
            <v-card-text>
                <v-card-title class="node-input">Map <b class="mr-1 ml-1">out</b> to output file</v-card-title>
            </v-card-text>
        </v-card>
    </perfect-scrollbar>
</template>

<script>

import {mapGetters, mapState} from "vuex";

export default {
    name: "FilterGraph",
    data: () => ({
    }),
    beforeDestroy() {

    },
    mounted() {
        console.log(this.complexFilter);
        console.log(this.colors);
    },
    methods: {},
    computed: {
        ...mapGetters(['project', 'complexFilter']),
        ...mapState({
            videoFiles: state => state.videoFiles,
        }),
    }
}
</script>

<style scoped>
.graph {
    display: flex;
    overflow: auto;
    flex-direction: column;
    max-height: calc(100vh - 64px);
    width: 100%;
    max-width: 900px;
    margin: 0 auto;
}

@media (max-width: 959px) {
    .graph {
        max-height: calc(100vh - 56px);
    }
}

.node.output {
    margin-bottom: 10px;
}

.node {
    margin: 10px;
    margin-bottom: 0;
}
</style>