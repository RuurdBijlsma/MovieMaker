export default class UndoStack extends Array {
    constructor() {
        super();
        this.index = 0;
    }

    push(command) {
        console.log("Command added to stack:", command);
        // Erase commands in future
        this.splice(this.index++);
        super.push(command);

        // this.splice(this.index++, 0, command);
    }

    undo() {
        if (this.index > 0) {
            let toUndo = this[--this.index];
            toUndo.undo();
            if (toUndo.batch) while (true) {
                toUndo = this[this.index - 1];
                if (!toUndo || !toUndo.batch)
                    break;
                this.index--;
                toUndo.undo();
            }
        }
    }

    redo() {
        if (this.index < this.length) {
            let toRedo = this[this.index++];
            toRedo.execute();
            if (toRedo.batch) while (true) {
                toRedo = this[this.index];
                if (!toRedo || !toRedo.batch) {
                    this.index--;
                    break;
                }
                this.index++;
                toRedo.execute();
            }
        }

    }

    toString() {
        let result = '';
        for (let i = 0; i < this.length; i++) {
            result += this[i].constructor.name;
            if (i === this.index) {
                result += '<--- ACTIVE';
            }
            result += '\n';
        }
        return result;
    }
}
