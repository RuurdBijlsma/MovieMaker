import Command from "@/js/commands/Command";

export default class SetStartPoint extends Command {
    constructor(fragment, newPoint) {
        super("Set start point");
        this.fragment = fragment;
        this.oldPoint = this.fragment.start;
        this.newPoint = newPoint;
    }

    execute() {
        this.fragment.start = this.newPoint;
    }

    undo() {
        this.fragment.start = this.oldPoint;
    }
}