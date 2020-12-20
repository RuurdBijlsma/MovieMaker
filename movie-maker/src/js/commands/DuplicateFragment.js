import Command from "@/js/commands/Command";
import VideoFragment from "@/js/VideoFragment";

export default class DuplicateFragment extends Command {
    constructor(fragment) {
        super("Duplicate fragment");
        this.fragment = fragment;

        this.newFragment = new VideoFragment(this.fragment.video);
        this.newFragment.start = this.fragment.start;
        this.newFragment.end = this.fragment.end;
    }

    execute() {
        let index = Command.store.state.timeline.indexOf(this.fragment) + 1;
        Command.store.commit('addToTimeline', {fragment: this.newFragment, index});
    }

    undo() {
        Command.store.commit('removeFromTimeline', this.newFragment)
    }
}