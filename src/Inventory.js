
import ItemStack from './ItemStack.js';

export default class Inventory {

    #itemStacks = [];

    constructor(items = []) {
        this.#itemStacks = items;
    }

    get sortedItemStacks() {
        return this.#itemStacks;
    }

    add(item, amount = 1) {
        let existingStack = this.getItemStack(item);

        if (existingStack) {
            existingStack.add(amount);
            return;
        }

        let itemStack = new ItemStack(item, amount);

        this.#itemStacks.push(itemStack);
    }

    remove(item) {
        this.#itemStacks = this.#itemStacks.filter(itemStack => itemStack.item !== item);
    }

    #removeItemStack(itemStack) {
        let index = this.#itemStacks.indexOf(itemStack);

        if (index === -1) {
            return;
        }

        this.#itemStacks.splice(index, 1);
    }

    consume(item, amount = 1) {
        let itemStack = this.getItemStack(item);

        if (!itemStack) {
            return false;
        }

        let success = itemStack.consume(amount);

        if (itemStack.isEmpty) {
            this.#removeItemStack(itemStack);
        }

        return success;
    }

    hasItem(item, amount = 1) {
        let itemStack = this.getItemStack(item);

        if (!itemStack) {
            return;
        }

        return itemStack.has(amount);
    }

    getAmountOf(item) {
        let itemStack = this.getItemStack(item);

        if (!itemStack) {
            return 0;
        }

        return itemStack.amount;
    }

    getItemStack(item) {
        return this.#itemStacks.find(itemStack => itemStack.item === item)
            ?? null;
    }
}