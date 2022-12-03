
export default class Item {

    #internalName;

    #title;

    constructor({internalName, title}) {
        this.#internalName = internalName;
        this.#title = title;
    }

    get internalName() {
        return this.#internalName;
    }

    get title() {
        return this.#title;
    }
}