<template>
    <v-app class="app" :style="cssProps">

        <v-app-bar app elevation="1">
            <custom-header></custom-header>
        </v-app-bar>

        <v-main class="main">
            <router-view class="router-view"></router-view>
        </v-main>

        <custom-prompt></custom-prompt>
        <custom-dialog></custom-dialog>
        <export-dialog></export-dialog>
        <export-status></export-status>

        <v-snackbar v-for="snack in $store.state.snackbars" app v-model="snack.open" :timeout="snack.timeout"
                    color="secondary">
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
// test for bugs


// add audio track to video
// Advanced export (visualize filter graph)
// try to fix little flash when layout updates (delete fragment/resize to create more visual fragments)
// apply filter only if thing changed
// add cpu priority to settings

// DONE TODO
// End time + playback rate change = bug
// support for video without audio stream
// fix bug with player being too high after having opened an audio track?
// audio player
// duplicate fragment
// when loading project with start point, the video time isn't set correctly
// on simple edits frames before the start time still get decoded
// remember size of screen when closing
// show fragment duration in footer
// higher default width per second
// lower smallest width fragment in timeline
// if progress is <=0 show indeterminate loading on card and system progress
// make privacy thing a chip group
// save localstorage to file and restore if localStorage is empty and that file exists
// right click shouldn't seek
// transform to 'googleapis' remove 'youtube-api'
// add cancel button when uploading video
// show youtube video upload status
// upload video to youtube
// if not logged in don't allow user to youtube stuff
// youtube output video
// add youtube title/description input field to ExportDialog
// now that i have a prompt maybe do it on add of filter (and on chip click)
// change export button to choose output path button
// add lotta filters in advanced export options thing expando
// ffmpeg output video
// allow set output bitrate
// history panel doesnt scroll down when adding command
// when at start of a 2nd part of split fragment and press next frame it breaks:
// * problem lies in skipFrames not skipping to next fragment properly when at end of fragment
// load in audio wave cleaner (don't set last point at (end, 0)
// pause when switching to next fragment while playing???
// implement open video button
// implement open video folder button
// this may be allowed, but then there should be a way to get back to the current export status,
// perhaps replace the export video button with a status indicator, if you click that open the status dialog
// you can hide export status dialog while it's busy exporting,
// add progress to system icon
// show export prompt for where to save and a dialog for export options (fps, resolution, more?)
// use https://ffmpeg.org/ffmpeg-filters.html#ebur128-1 instead of pcm
// it doesnt remember import directory from last time :(
// dont show save prompt dialog when it's not possible to save
// check all key binds for weird effects
// chain atempos together for <0.5 tempo
// ffmpeg volume
// does video element still work (not frozen) after coming back from settings?
// check if user wants to save before clearing anything (new project, import project, closing the app)
// remember if there is unsaved stuff and indicate with star next to name in toolbar
// make dialog prompt into action somewhere for ease
// add regular save (show menu on top left icon when 2 options are available) (save as/ save)
// clear temp folder on close
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
import Utils from "@/js/Utils";
import CustomDialog from "@/components/CustomDialog";
import ExportDialog from "@/components/ExportDialog";
import ExportStatus from "@/components/ExportStatus";
import CustomPrompt from "@/components/CustomPrompt";


export default {
    name: 'App',
    components: {CustomPrompt, ExportStatus, ExportDialog, CustomDialog, VideoInfoFooter, CustomHeader},
    data: () => ({
        disposeContextMenu: null,
    }),
    async mounted() {
        this.updateSystemProgress();
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
            await this.$store.dispatch('closeWindow');
        });
        electron.ipcRenderer.on('open-file', async (e, args) => {
            electron.ipcRenderer.send('received-file');
            console.log("RECEIVED OPEN FILE COMMAND", args);
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
                        label: "Split fragment",
                        click: () => this.split({})
                    },
                    {
                        label: "Duplicate fragment",
                        click: () => this.duplicate({})
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
            let ignoredElements = ['[object HTMLTextAreaElement]', '[object HTMLInputElement]'];
            if (ignoredElements.includes(e.target.toString())) {
                return;
            }
            switch (true) {
                case e.key === 'n' && e.ctrlKey:
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
                    if (!this.hasProject)
                        return;
                    e.preventDefault();
                    if (this.fullscreen)
                        this.$store.commit('fullscreen', false);
                    else
                        this.$store.commit('fullscreen', true);
                    break;
                case e.key === ' ':
                    if (!this.hasProject)
                        return;
                    if (this.playing) this.pause();
                    else this.play();
                    break;
                case e.key === 'e' && e.ctrlKey:
                    if (!this.hasProject)
                        return;
                    this.exportVideo()
                    break;
                case e.key === 'i' && e.ctrlKey:
                    this.promptVideoInput()
                    break;
                case e.key === 'ArrowLeft':
                    if (!this.hasProject)
                        return;
                    this.skipFrames(-this.activeFragment.video.fps * 5);
                    break;
                case e.key === 'ArrowRight':
                    if (!this.hasProject)
                        return;
                    this.skipFrames(this.activeFragment.video.fps * 5);
                    break;
                case e.key === 'm':
                    if (!this.hasProject)
                        return;
                    if (this.activeFragment.volume === 0)
                        this.setVolume({volume: 1});
                    else
                        this.setVolume({volume: 0});
                    break;
                case e.key === 'ArrowUp':
                    if (!this.hasProject)
                        return;
                    let volumeHigh = this.activeFragment.volume * 1.2;
                    this.setVolume({volume: volumeHigh});
                    break;
                case e.key === 'ArrowDown':
                    if (!this.hasProject)
                        return;
                    let volumeLow = this.activeFragment.volume / 1.2;
                    this.setVolume({volume: volumeLow});
                    break;
                case e.key === '-':
                    if (!this.hasProject)
                        return;
                    let pbrHigh = this.activeFragment.playbackRate / 1.2;
                    this.setPlaybackRate({playbackRate: pbrHigh});
                    break;
                case e.key === '+':
                case e.key === '=':
                    if (!this.hasProject)
                        return;
                    let pbrLow = this.activeFragment.playbackRate * 1.2;
                    this.setPlaybackRate({playbackRate: pbrLow});
                    break;
                case e.key === ',':
                    if (!this.hasProject)
                        return;
                    this.shiftFragment({shift: -1});
                    break;
                case e.key === '.':
                    if (!this.hasProject)
                        return;
                    this.shiftFragment({shift: 1});
                    break;
                case e.key === 'Backspace':
                case e.key === 'Delete':
                    if (!this.hasProject)
                        return;
                    this.removeFragment();
                    break;
                case e.key === '\\':
                    if (!this.hasProject)
                        return;
                    this.split({})
                    break;
                case e.key === '[':
                    if (!this.hasProject)
                        return;
                    this.setStartPoint({})
                    break;
                case e.key === ']':
                    if (!this.hasProject)
                        return;
                    this.setEndPoint({})
                    break;
                case e.key === 'd' && e.ctrlKey:
                    if (!this.hasProject)
                        return;
                    this.duplicate({})
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
                    if (!this.hasProject)
                        return;
                    let progress = (+e.key) / 10;
                    this.seek(progress);
                    break;
            }
        },
        ...mapActions(['addSnack', 'initialize',
            'split', 'setStartPoint', 'setEndPoint', 'importVideo',
            'removeFragment', 'redo', 'undo', 'promptVideoInput',
            'exportVideo', 'play', 'pause', 'seek', 'importProjectByPath',
            'skipFrames', 'shiftFragment', 'setVolume', 'setPlaybackRate',
            'newProject', 'promptProjectInput', 'saveProjectAs', 'saveProject',
            'updateSystemProgress', 'duplicate',
        ]),
    },
    watch: {
        systemProgress() {
            this.updateSystemProgress();
        },
    },
    computed: {
        cssProps() {
            console.log(this.$vuetify.theme);
            return {
                '--primary': this.themeColors.primary,
                '--foreground': this.themeColors.foreground,
                '--soft-foreground': this.themeColors.softForeground,
                '--soft-background': this.themeColors.softBackground,
                '--softer-background': this.themeColors.softerBackground,
                '--secondary': this.themeColors.secondary,
                '--success': this.themeColors.success,
                '--error': this.themeColors.error,
            }
        },
        ...mapGetters(['themeColors', 'hasProject', 'systemProgress']),
        ...mapState({
            activeFragment: state => state.activeFragment,
            showContextMenu: state => state.showContextMenu,
            playing: state => state.player.playing,
            fullscreen: state => state.player.fullscreen,
            status: state => state.exportStatus,
        }),
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
