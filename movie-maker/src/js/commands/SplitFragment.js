import Command from "@/js/commands/Command";
import VideoFragment from "@/js/VideoFragment";

export default class SplitFragment extends Command {
    constructor(fragment, splitPoint) {
        super();
        this.fragment = fragment;
        this.splitPoint = splitPoint;

        this.newFragment = new VideoFragment(this.fragment.video);
        this.newFragment.start = splitPoint;
        this.newFragment.end = this.fragment.end;
        this.oldEndPoint = this.fragment.end;
    }

    execute() {
        this.fragment.end = this.splitPoint;
        let index = Command.store.state.timeline.indexOf(this.fragment) + 1;
        Command.store.commit('addToTimeline', {fragment: this.newFragment, index});
    }

    undo() {
        Command.store.commit('removeFromTimeline', this.newFragment)
        this.fragment.end = this.oldEndPoint;
    }
}