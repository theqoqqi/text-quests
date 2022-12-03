
export default class Relay {

    #internalName;

    #actions;

    #forks;

    constructor({internalName, actions, forks}) {
        this.#internalName = internalName;
        this.#actions = actions;
        this.#forks = forks;
    }

    use(quest) {
        for (const fork of this.#forks) {
            if (fork.condition.evaluate(quest)) {
                fork.action.execute(quest);
                return;
            }
        }
    }

    get internalName() {
        return this.#internalName;
    }

    get actions() {
        return this.#actions;
    }

    get forks() {
        return this.#forks;
    }
}