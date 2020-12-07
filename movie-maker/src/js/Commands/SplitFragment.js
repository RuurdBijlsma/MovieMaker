import Command from "@/js/Commands/Command";
import VideoFragment from "@/js/VideoFragment";

export default class SplitFragment extends Command {
    constructor(store, fragment, splitPoint) {
        super();
        this.store = store;
        this.fragment = fragment;
        this.splitPoint = splitPoint;

        this.newFragment = null;
        this.oldEndPoint = 1;
    }

    execute() {
        this.newFragment = new VideoFragment(this.fragment.video);
        this.oldEndPoint = this.fragment.end;
        this.fragment.end = this.splitPoint;
        this.newFragment.start = this.splitPoint;
        let index = this.store.state.timeline.indexOf(this.fragment) + 1;
        this.store.commit('addToTimeline', {fragment: this.newFragment, index});
    }

    undo() {
        this.store.commit('removeFromTimeline', this.newFragment)
        this.fragment.end = this.oldEndPoint;
    }
}