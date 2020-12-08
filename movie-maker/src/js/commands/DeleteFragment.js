import Command from "@/js/commands/Command";

export default class DeleteFragment extends Command {
    constructor(fragment) {
        super();
        this.fragment = fragment;
        this.index = Command.store.state.timeline.indexOf(fragment);
    }

    execute() {
        Command.store.commit('removeFromTimeline', this.fragment);
    }

    undo() {
        Command.store.commit('addToTimeline', {fragment: this.fragment, index: this.index});
    }
}