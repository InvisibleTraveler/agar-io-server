class Locker {
    lock = null;

    constructor() {
        const shared = new SharedArrayBuffer(32);
        this.lock = new Int32Array(shared);
        Atomics.store(this.lock, 0, 1);
    }

    enter() {
        while (true) {
            Atomics.wait(this.lock, 0, 0);
            const n = Atomics.compareExchange(this.lock, 0, 1, 0);
            if (n === 1) return;
        }
    }

    leave() {
        Atomics.store(this.lock, 0, 1);
        Atomics.notify(this.lock, 0, 1);
    }
}

module.exports = { Locker };
