export default class Command {
    constructor(name = this.constructor.name, batchOn = false) {
        this.batchOn = batchOn;
        this.name = name;
    }

    static setStore(store) {
        this.store = store;
    }

    execute() {
        throw new Error("Not implemented");
    }

    undo() {
        throw new Error("Not implemented");
    }
}
