import EventEmitter from 'events'

export default class AbortSignal extends EventEmitter {
    constructor(signal) {
        super();
        this.signal = signal;
        this.aborted = false;
        signal.addEventListener('abort', (...e) => this._onAbort(...e));
        this.onabort = () => 0
    }

    static get name() {
        return "AbortSignal";
    }

    addEventListener(...args) {
        this.on(...args);
    }

    removeEventListener(...args) {
        this.off(...args);
    }

    _onAbort(...e) {
        // noinspection JSConstantReassignment
        this.aborted = true;
        this.onabort();
        this.emit('abort', ...e)
    }

    get [Symbol.toStringTag]() {
        return 'AbortSignal';
    }
}