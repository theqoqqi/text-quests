
export default class Screen {

    #internalName;

    #title;

    #text;

    #actions;

    #choices;

    constructor({internalName, title, text, actions, choices}) {
        this.#internalName = internalName;
        this.#title = title;
        this.#text = text;
        this.#actions = actions;
        this.#choices = choices;
    }

    getAvailableChoices(quest) {
        return this.#choices.filter(choice => {
            return choice.condition.evaluate(quest);
        });
    }

    get internalName() {
        return this.#internalName;
    }

    get title() {
        return this.#title;
    }

    get text() {
        return this.#text;
    }

    get actions() {
        return this.#actions;
    }

    get choices() {
        return this.#choices;
    }
}