import Command from "@/js/commands/Command";

export default class SetPlaybackRate extends Command {
    constructor(fragment, rate) {
        super("Set playback rate",fragment);
        this.fragment = fragment;
        this.oldRate = fragment.playbackRate;
        this.newRate = rate;
    }

    execute() {
        this.fragment.playbackRate = this.newRate;
    }

    undo() {
        this.fragment.playbackRate = this.oldRate;
    }
}