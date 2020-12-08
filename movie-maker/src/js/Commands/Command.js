export default class Command {
    constructor(batchOn = false) {
        this.batchOn = batchOn;
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
