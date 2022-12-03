
export default class ItemStack {

    #item;

    #amount;

    constructor(item, amount = 1) {
        this.#item = item;
        this.#amount = amount;
    }

    get item() {
        return this.#item;
    }

    get amount() {
        return this.#amount;
    }

    get isEmpty() {
        return this.#amount <= 0;
    }

    add(amount = 1) {
        this.#amount += amount;
    }

    consume(amount = 1) {
        if (!this.has(amount)) {
            return false;
        }

        this.#amount -= amount;
        return true;
    }

    has(amount) {
        return this.#amount >= amount;
    }
}