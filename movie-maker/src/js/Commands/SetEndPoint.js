import Command from "@/js/Commands/Command";

export default class SetEndPoint extends Command {
    constructor(fragment, newPoint) {
        super();
        this.fragment = fragment;
        this.oldPoint = this.fragment.end;
        this.newPoint = newPoint;
    }

    execute() {
        this.fragment.end = this.newPoint;
    }

    undo() {
        this.fragment.end = this.oldPoint;
    }
}