import Command from "@/js/Commands/Command";

export default class MoveFragment extends Command {
    constructor(store, fragment, newIndex) {
        super();
        this.store = store;
        this.fragment = fragment;
        this.newIndex = newIndex;
        this.oldIndex = store.state.timeline.indexOf(fragment);
    }

    execute() {
        this.store.commit('moveFragment', {fragment: this.fragment, newIndex: this.newIndex});
    }

    undo() {
        this.store.commit('moveFragment', {fragment: this.fragment, newIndex: this.oldIndex});
    }
}