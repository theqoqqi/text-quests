
export default class Fork {

    #condition;

    #action;

    constructor({condition, action}) {
        this.#condition = condition;
        this.#action = action;
    }

    get condition() {
        return this.#condition;
    }

    get action() {
        return this.#action;
    }
}