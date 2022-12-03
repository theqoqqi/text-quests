
export default class Choice {

    #title;

    #condition;

    #action;

    constructor({title, condition, action}) {
        this.#title = title;
        this.#condition = condition;
        this.#action = action;
    }

    select(quest) {
        this.#action.execute(quest);
    }

    get title() {
        return this.#title;
    }

    get condition() {
        return this.#condition;
    }

    get action() {
        return this.#action;
    }

    get changesScreen() {
        return this.#action.hasCommand('jump') || this.#action.hasCommand('relay');
    }

    get hasMessage() {
        return this.#action.hasCommand('message');
    }
}