<template>
    <v-app class="app" :style="cssProps">

        <v-app-bar color="secondary" app elevation="0">
            <custom-header></custom-header>
        </v-app-bar>

        <v-main class="main">
            <router-view class="router-view"></router-view>
        </v-main>

        <v-dialog v-model="$store.state.electron.showClosePrompt" width="500">
            <v-card>
                <v-card-title> Are you sure you want to close?</v-card-title>
                <v-card-text>There may be unsaved changes!</v-card-text>
                <v-divider></v-divider>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn text @click="$store.commit('showClosePrompt', false)">
                        Cancel
                    </v-btn>
                    <v-btn color="error" text @click="closeWindow">
                        Close
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

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
        <v-footer v-if="activeFragment">
            <video-info-footer></video-info-footer>
        </v-footer>
    </v-app>
</template>

<script>
// TODO: Features
// Right click in explorer on video -> edit with ruurd movie maker
// export to youtube with manual key input
// youtube api key input in settings + yt account in settings + logout
// add audio track (music) to video
// Stop merging images, display them separately
// adjust width of player/timeline
// remove windows media control notification (add setting?)
// try to fix little flash when layout updates (delete fragment/resize to create more visual fragments)
// set max height of Home to be 100vw - something, then use percentages in children
// dont allow set end point when seek is at 0, dont allow set start point when seek is at 1
// support small width UI
// todo bug: memory pls

// DONE TODO
// undo history window
// Next frame/ prev frame button
// theme color chooser in settings
// click footer file name to open folder that file is in
// do pcm reading in thread
// dont show move right when not possible
// make getting ffmpeg path awaitable and wait when it's not retrieved yet
// dont allow seek when video is still loading (show loading indicator somewhere when video is loading)
// stop video playing when end of fragment is reached
// fix bugs with sometimes layout isn't updated hot reload issue maybe
// reposition seek when fragment is deleted
// when no redo is available, grey out redo button (hard to do maybe)
// make volume change reactive
// can't undo last action (add fragment) maybe because it's still active?? idk
// lotta bugs with start and end time?
// add command pattern
// increase volume to >1
// [top bar and context menu]: split/set start/set end/delete fragment/(un)mute fragment/more? Maybe add extra top bar for this? because no space there
// when no video is loaded, show big thing in screen "No videos loaded, click here to import some videos or drag them here"
// scroll on sliders for precise input
// seek thing on timeline
// better visualizer for highlighting active fragment
// amplitude audio wave timeline
import {mapActions, mapGetters, mapState} from "vuex";
import CustomHeader from "@/components/CustomHeader";
import VideoInfoFooter from "@/components/VideoInfoFooter";

export default {
    name: 'App',
    components: {VideoInfoFooter, CustomHeader},
    data: () => ({}),
    async mounted() {
        await this.initialize();
        console.log(this.$store);

        let electron = window.require('electron');
        electron.ipcRenderer.on('before-close', async () => {
            await this.$store.dispatch('secureClose');
        });
    },
    beforeDestroy() {

    },
    methods: {
        ...mapActions(['addSnack', 'initialize', 'closeWindow'])
    },
    computed: {
        cssProps() {
            console.log(this.$vuetify.theme);
            return {
                '--primary': this.themeColors.primary,
                '--foreground': this.themeColors.foreground,
                '--soft-foreground': this.themeColors.softForeground,
                '--soft-background': this.themeColors.softBackground,
                '--secondary': this.themeColors.secondary,
            }
        },
        ...mapGetters(['themeColors']),
        ...mapState({
            activeFragment: state => state.activeFragment,
        })
    }
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
