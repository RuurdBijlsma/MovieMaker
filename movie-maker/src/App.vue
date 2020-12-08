<template>
    <v-app class="app" :style="cssProps">

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
        <v-footer v-if="activeFragment">
            <video-info-footer></video-info-footer>
        </v-footer>
    </v-app>
</template>

<script>
// TODO: Features
// Right click in explorer on video -> edit with ruurd movie maker
// export to youtube with manual key input
// do pcm reading in thread
// theme color chooser in settings
// add audio track (music) to video
// dont allow seek when video is still loading (show loading indicator somewhere when video is loading)
// Stop merging images, display them separately
// make getting ffmpeg path awaitable and wait when it's not retrieved yet
// Next frame/ prev frame button
// adjust width of player/timeline
// remove windows media control notification (add setting?)
// TODO: Check if video freeze but audio keeps going still happens (still happens when something other than opacity is used) (happens because of vue hot reload hopefully)
// todo bug: memory pls

// DONE TODO
// stop video playing when end of fragment is reached
// fix bugs with sometimes layout isn't updated hot reload issue maybe
// reposition seek when fragment is deleted
// when no redo is available, grey out redo button (hard to do maybe)
// make volume change reactive (probably need to make entire undostack and command pattern a vuex module or somthin)
// can't undo last action (add fragment) maybe because it's still active?? idk
// lotta bugs with start and end time?
// add command pattern (Ezpz lemon squeezy)
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
        console.log("Store", this.$store);
    },
    beforeDestroy() {

    },
    methods: {
        ...mapActions(['addSnack', 'initialize'])
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
