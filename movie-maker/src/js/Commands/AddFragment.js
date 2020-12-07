import Command from "@/js/Commands/Command";

export default class AddFragment extends Command {
    constructor(store, fragment) {
        super();
        this.store = store;
        this.fragment = fragment;
    }

    execute() {
        if (this.store.state.activeFragment === null) {
            this.store.commit('activeFragment', this.fragment);
        }
        this.store.commit('addToTimeline', {fragment: this.fragment});
    }

    undo() {
        this.store.commit('removeFromTimeline', this.fragment);
    }
}