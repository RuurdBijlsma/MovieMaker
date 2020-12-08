import Command from "@/js/commands/Command";

export default class SetPlaybackRate extends Command {
    constructor(fragment, rate) {
        super(fragment);
        this.fragment = fragment;
        this.oldSpeed = fragment.playbackRate;
        this.newSpeed = rate;
    }

    execute() {
        this.fragment.playbackRate = this.newSpeed;
    }

    undo() {
        this.fragment.playbackRate = this.oldSpeed;
    }
}