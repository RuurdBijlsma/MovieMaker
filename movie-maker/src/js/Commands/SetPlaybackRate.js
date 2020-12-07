import Command from "@/js/Commands/Command";

export default class SetPlaybackRate extends Command {
    constructor(fragment, rate) {
        super(true);
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