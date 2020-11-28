<template>
    <v-app class="app">

        <v-app-bar color="secondary" app elevation="0">
            <custom-header></custom-header>
        </v-app-bar>

        <v-main class="main">
            <router-view class="router-view"></router-view>
        </v-main>

        <v-snackbar v-for="snack in $store.state.snackbars" app v-model="snack.open" :timeout="snack.timeout"
                    :outlined="!$vuetify.theme.dark" color="primary">
            {{ snack.text }}
            <template v-slot:action="{ attrs }">
                <v-btn text v-bind="attrs" :color="$vuetify.theme.dark ? 'default' : 'primary'"
                       @click="snack.open = false">
                    Dismiss
                </v-btn>
            </template>
        </v-snackbar>
    </v-app>
</template>

<script>
// TODO: Features
// Sound line on preview thing
// Right click in explorer on video -> edit with ruurd movie maker
// ffmpeg export to stream for instant actual preview
// export to youtube with manual key input

import {mapActions} from "vuex";
import CustomHeader from "@/components/CustomHeader";

export default {
    name: 'App',
    components: {CustomHeader},
    data: () => ({}),
    async mounted() {
        await this.initialize();
        console.log("Store", this.$store);
        console.log("Theme", this.$vuetify)
        await this.addSnack({text: "Hello snackers :)"})
    },
    beforeDestroy() {

    },
    methods: {
        ...mapActions(['addSnack', 'initialize'])
    },
    watch: {},
};
</script>
<style>
@import url('https://fonts.googleapis.com/css?family=Roboto:400,400i,500,600,700,800,900&display=swap');
@import url('https://cdn.materialdesignicons.com/5.0.45/css/materialdesignicons.min.css');

html, body {
    overflow-y: auto;
}

h1 {
    font-size: 1.8rem;
}

h1, h2, h3, h4, h5 {
    font-weight: bold;
}

.app {
    user-select: none;
    font-family: Roboto, Helvetica Neue, Helvetica, Arial, sans-serif;
    display: flex;
    flex-direction: column;
}

.main {
    flex-grow: 1;
}
</style>
