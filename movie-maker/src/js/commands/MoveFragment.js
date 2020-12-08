import Command from "@/js/commands/Command";

export default class MoveFragment extends Command {
    constructor(fragment, newIndex) {
        super();
        this.fragment = fragment;
        this.newIndex = newIndex;
        this.oldIndex = Command.store.state.timeline.indexOf(fragment);
    }

    execute() {
        Command.store.commit('moveFragment', {fragment: this.fragment, newIndex: this.newIndex});
    }

    undo() {
        Command.store.commit('moveFragment', {fragment: this.fragment, newIndex: this.oldIndex});
    }
}