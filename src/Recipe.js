
export default class Recipe {

    #ingredients;

    #results;

    constructor({ingredients, results}) {
        this.#ingredients = ingredients;
        this.#results = results;
    }

    canCraft(quest) {
        for (const ingredient of this.#ingredients) {
            let amount = quest.countItemInInventory(ingredient.item.internalName);

            if (amount < ingredient.amount) {
                return false;
            }
        }

        return true;
    }

    craft(quest) {
        for (const ingredient of this.#ingredients) {
            quest.consumeItemFromInventory(ingredient.item.internalName, ingredient.amount);
        }

        for (const result of this.#results) {
            quest.addItemToInventory(result.item.internalName, result.amount);
        }
    }

    get ingredients() {
        return this.#ingredients;
    }

    get results() {
        return this.#results;
    }
}