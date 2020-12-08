import Command from "@/js/Commands/Command";

export default class SetVolume extends Command {
    constructor(fragment, newVolume) {
        super(fragment);
        this.fragment = fragment;
        this.oldVolume = fragment.volume;
        this.newVolume = newVolume;
    }

    execute() {
        this.fragment.volume = this.newVolume;
    }

    undo() {
        this.fragment.volume = this.oldVolume;
    }
}