import Command from "@/js/Commands/Command";

export default class DeleteFragment extends Command {
    constructor(store, fragment) {
        super();
        this.store = store;
        this.fragment = fragment;
        this.index = this.store.state.timeline.indexOf(fragment);
    }

    execute() {
        console.log("commiting remove", this.fragment);
        this.store.commit('removeFromTimeline', this.fragment);
    }

    undo() {
        this.store.commit('addToTimeline', {fragment: this.fragment, index: this.index});
    }
}