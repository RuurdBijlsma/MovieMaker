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
    </v-app>
</template>

<script>
// TODO: Features
// ffmpeg output video
// youtube output video

// clear temp folder on close
// add regular save (show menu on top left icon when 2 options are available) (save as/ save)
// remember if there is unsaved stuff and indicate with star next to name in toolbar
// check if user wants to save before clearing anything (new project, import project, closing the app)
// does video element still work (not frozen) after coming back from settings?
// TODO: ^^^^ IT DOES FREEZE, PROBABLY CHANGE SETTINGS TO DIALOG??????? HOW ELSE???

// try to fix little flash when layout updates (delete fragment/resize to create more visual fragments)
// todo bug: memory pls
// when at start of a 2nd part of split fragment and press next frame it breaks

// DONE TODO
// new project button
// during project importing dont allow user to import video
// save project to file? maybe
// Stop merging images, display them separately
// In build version history list is broken
// fullscreen keybind + button
// youtube api key input in settings + yt account in settings + logout
// key binds
// context menu
// check startup without splash screen
// check if auth get user still works tomorrow (how does refresh token handling work??)
// drag to import
// zoom on timeline
// player volume
// save player and timeline config to localStorage
// dont allow set end point when seek is at 0, dont allow set start point when seek is at 1
// adjust width of player/timeline
// support small width UI
// set max height of Home to be 100vw - something, then use percentages in children
// remove windows media control notification (add setting?)
// Right click in explorer on video -> edit with ruurd movie maker
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
import electron from "electron";
import contextMenu from "electron-context-menu";
import path from 'path'
import Utils from "@/js/Utils";

export default {
    name: 'App',
    components: {VideoInfoFooter, CustomHeader},
    data: () => ({
        disposeContextMenu: null,
    }),
    async mounted() {
        if (location.search.includes('file=video')) {
            this.$store.commit('importVideoLoading', true);
        } else if (location.search.includes('file=project')) {
            this.$store.commit('importProjectLoading', true);
        }
        window.addEventListener('resize', this.setWindowWidth, false);
        document.addEventListener('keydown', this.keyListener, false);

        await this.initialize();
        console.log(this.$store);

        let electron = window.require('electron');
        electron.ipcRenderer.on('before-close', async () => {
            await this.$store.dispatch('secureClose');
        });
        electron.ipcRenderer.on('open-file', async (e, args) => {
            electron.ipcRenderer.send('received-file');
            if (args.length === 1 && Utils.isProjectFile(args[0])) {

                this.$store.commit('importProjectLoading', true);
                await this.importProjectByPath(args[0]);
                this.$store.commit('importProjectLoading', false);

            } else if (args.length > 0) {

                this.$store.commit('importVideoLoading', true);
                await Promise.all(args.map(p => this.importVideo(p)));
                this.$store.commit('importVideoLoading', false);

            }
        });

        this.disposeContextMenu = this.createContextMenu();
    },
    beforeDestroy() {
        this.disposeContextMenu?.()
        document.removeEventListener('keydown', this.keyListener);
        window.removeEventListener('resize', this.setWindowWidth);
    },
    methods: {
        createContextMenu() {
            return contextMenu({
                prepend: () => [
                    {
                        label: "Set start point",
                        click: () => this.setStartPoint({})
                    },
                    {
                        label: "Set end point",
                        click: () => this.setEndPoint({})
                    },
                    {
                        label: "Split video",
                        click: () => this.split({})
                    },
                ],
                append: () => [
                    {
                        label: "Delete",
                        click: () => this.removeFragment()
                    },
                ],
                shouldShowMenu: (e, params) => {
                    let value = this.showContextMenu;
                    this.$store.commit('showContextMenu', false);
                    return value;
                },
                showInspectElement: false,
            });
        },
        setWindowWidth() {
            this.$store.commit('windowWidth', window.innerWidth)
        },
        keyListener(e) {
            console.log(e.key);
            switch (true) {
Addd                case e.key === 'n' && e.ctrlKey:
                    this.newProject();
                    break;
                case e.key === 'o' && e.ctrlKey:
                    this.promptProjectInput();
                    break;
                case e.key === 'S' && e.ctrlKey && e.shiftKey:
                    this.saveProjectAs();
                    break;
                case e.key === 's' && e.ctrlKey:
                    this.saveProject();
                    break;
                case e.key === 'Escape':
                    e.preventDefault();
                    if (this.fullscreen)
                        this.$store.commit('fullscreen', false);
                    break;
                case e.key === 'F11':
                    e.preventDefault();
                    if (this.fullscreen)
                        this.$store.commit('fullscreen', false);
                    else
                        this.$store.commit('fullscreen', true);
                    break;
                case e.key === ' ':
                    if (this.playing) this.pause();
                    else this.play();
                    break;
                case e.key === 'e' && e.ctrlKey:
                    this.exportVideo()
                    break;
                case e.key === 'i' && e.ctrlKey:
                    this.promptVideoInput()
                    break;
                case e.key === 'ArrowLeft':
                    this.skipFrames(-this.activeFragment.video.fps * 5);
                    break;
                case e.key === 'ArrowRight':
                    this.skipFrames(this.activeFragment.video.fps * 5);
                    break;
                case e.key === 'm':
                    if (this.activeFragment.volume === 0)
                        this.setVolume({volume: 1});
                    else
                        this.setVolume({volume: 0});
                    break;
                case e.key === 'ArrowUp':
                    let volumeHigh = this.activeFragment.volume * 1.2;
                    this.setVolume({volume: volumeHigh});
                    break;
                case e.key === 'ArrowDown':
                    let volumeLow = this.activeFragment.volume / 1.2;
                    this.setVolume({volume: volumeLow});
                    break;
                case e.key === '-':
                    let pbrHigh = this.activeFragment.playbackRate / 1.2;
                    this.setPlaybackRate({playbackRate: pbrHigh});
                    break;
                case e.key === '+':
                case e.key === '=':
                    let pbrLow = this.activeFragment.playbackRate * 1.2;
                    this.setPlaybackRate({playbackRate: pbrLow});
                    break;
                case e.key === ',':
                    this.shiftFragment({shift: -1});
                    break;
                case e.key === '.':
                    this.shiftFragment({shift: 1});
                    break;
                case e.key === 'Backspace':
                case e.key === 'Delete':
                    this.removeFragment();
                    break;
                case e.key === '\\':
                    this.split({})
                    break;
                case e.key === '[':
                    this.setStartPoint({})
                    break;
                case e.key === ']':
                    this.setEndPoint({})
                    break;
                case e.key === 'y' && e.ctrlKey:
                case e.key === 'Z' && e.ctrlKey && e.shiftKey:
                    this.redo();
                    break;
                case e.key === 'z' && e.ctrlKey:
                    this.undo();
                    break;
                case e.key === 'r' && e.ctrlKey:
                    location.reload();
                    break;
                case e.key === '`':
                    this.$store.dispatch('openDevTools');
                    break;
                case !isNaN(+e.key):
                    let progress = (+e.key) / 10;
                    this.seek(progress);
                    break;
            }
        },
        ...mapActions(['addSnack', 'initialize', 'closeWindow',
            'split', 'setStartPoint', 'setEndPoint', 'importVideo',
            'removeFragment', 'redo', 'undo', 'promptVideoInput',
            'exportVideo', 'play', 'pause', 'seek', 'importProjectByPath',
            'skipFrames', 'shiftFragment', 'setVolume', 'setPlaybackRate',
            'newProject', 'promptProjectInput', 'saveProjectAs','saveProject'
        ])
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
            showContextMenu: state => state.showContextMenu,
            playing: state => state.player.playing,
            fullscreen: state => state.player.fullscreen,
        })
    }
};
</script>
<style>
@import url('https://fonts.googleapis.com/css?family=Roboto:400,400i,500,600,700,800,900&display=swap');
@import url('https://cdn.materialdesignicons.com/5.0.45/css/materialdesignicons.min.css');

html, body {
    overflow: hidden;
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
