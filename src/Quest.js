import Inventory from './Inventory.js';
import Condition from './Condition.js';

export default class Quest {

    #context;

    #inventory = new Inventory();

    #variables = new Map();

    #currentScreen;

    #choiceMessage;

    #unlockedRecipes = [];

    #seenScreens = [];

    #seenRelays = [];

    #screenChangeListener = () => {};

    #choiceSelectedListener = () => {};

    #choiceMessageChangeListener = () => {};

    #questFinishedListener = () => {};

    constructor(context) {
        this.#context = context;

        this.initVariables();
    }

    initVariables() {
        this.#variables.clear();

        this.#context.variables.forEach((value, name) => {
            this.setVariable(name, value);
        });
    }

    onScreenChanged(listener) {
        this.#screenChangeListener = listener;
    }

    onChoiceSelected(listener) {
        this.#choiceSelectedListener = listener;
    }

    onChoiceMessageChanged(listener) {
        this.#choiceMessageChangeListener = listener;
    }

    onQuestFinished(listener) {
        this.#questFinishedListener = listener;
    }

    start() {
        let startScreen = this.#context.getStartScreen();

        this.setCurrentScreen(startScreen);
        this.clearChoiceMessage();
    }

    finish() {
        this.#questFinishedListener();
    }

    setCurrentScreen(screen) {
        if (typeof screen === 'string') {
            screen = this.#context.getScreen(screen);
        }

        if (!this.#seenScreens.includes(screen)) {
            this.#seenScreens.push(screen);
            screen.actions.once.execute(this);
        }

        screen.actions.always.execute(this);
        this.#currentScreen = screen;
        this.#screenChangeListener(screen);
    }

    useRelay(relay) {
        if (typeof relay === 'string') {
            relay = this.#context.getRelay(relay);
        }

        if (!this.#seenRelays.includes(relay)) {
            this.#seenRelays.push(relay);
            relay.actions.once.execute(this);
        }

        relay.actions.always.execute(this);
        relay.use(this);
    }

    selectChoice(index) {
        let availableChoices = this.getAvailableChoices();
        let choice = availableChoices[index];

        if (!choice) {
            return;
        }

        this.clearChoiceMessage();

        choice.select(this);
        this.#choiceSelectedListener(choice);
    }

    setChoiceMessage(message) {
        this.#choiceMessage = message;
        this.#choiceMessageChangeListener(message);
    }

    clearChoiceMessage() {
        this.setChoiceMessage('');
    }

    unlockRecipe(name) {
        let recipe = this.#context.recipes.get(name);

        if (recipe) {
            this.#unlockedRecipes.push(recipe);
        }
    }

    lockRecipe(name) {
        let recipe = this.#context.recipes.get(name);
        let index = this.#unlockedRecipes.indexOf(recipe);

        if (index !== -1) {
            this.#unlockedRecipes.splice(index, 1);
        }
    }

    isRecipeUnlocked(name) {
        let recipe = this.#context.recipes.get(name);

        return recipe && this.#unlockedRecipes.includes(recipe);
    }

    canUseRecipe(index) {
        let recipe = this.#unlockedRecipes[index];

        return recipe && recipe.canCraft(this);
    }

    useRecipe(index) {
        let recipe = this.#unlockedRecipes[index];

        if (!recipe) {
            return;
        }

        if (!recipe.canCraft(this)) {
            return;
        }

        recipe.craft(this);

        let itemsString = Quest.#stringifyItems(recipe.results);

        this.setChoiceMessage(`Вы создали ${itemsString}`);
    }

    getAvailableChoices() {
        return this.#currentScreen.getAvailableChoices(this);
    }

    getAvailableRecipes() {
        return this.#unlockedRecipes;
    }

    getAvailableRecipesAsTexts() {
        return this.getAvailableRecipes().map(recipe => {
            let resultsString = Quest.#stringifyItems(recipe.results);
            let ingredientsString = Quest.#stringifyItems(recipe.ingredients);
            let availabilityString = recipe.canCraft(this) ? 'можно создать' : 'не хватает';

            return `${resultsString} (нужно: ${ingredientsString}, ${availabilityString})`;
        });
    }

    static #stringifyItems(itemStacks) {
        let stringifyStack = itemStack => {
            return itemStack.amount > 1
                ? `${itemStack.item.title} x${itemStack.amount}`
                : itemStack.item.title;
        };

        return itemStacks.map(stringifyStack).join(', ');
    }

    prepareText(text) {
        let ifTagRegex = /\[if ([^\]]+)]([^[]*)\[\/if]/g;

        return text.replaceAll(ifTagRegex, (match, expression, text) => {
            let condition = new Condition(expression);

            return condition.evaluate(this) ? text : '';
        });
    }

    getRegisteredItem(internalName) {
        let item = this.#context.getItem(internalName);

        if (!item) {
            console.error(`Попытка использовать несуществующий предмет '${internalName}'`);
        }

        return item;
    }

    getVariable(name) {
        return this.#variables.get(name);
    }

    setVariable(name, value) {
        this.#variables.set(name, value);
    }

    addItemToInventory(internalName, amount = 1) {
        let item = this.getRegisteredItem(internalName);

        if (item) {
            this.#inventory.add(item, amount);
        }
    }

    removeItemFromInventory(internalName) {
        let item = this.getRegisteredItem(internalName);

        if (item) {
            this.#inventory.remove(item);
        }
    }

    consumeItemFromInventory(internalName, amount = 1) {
        let item = this.getRegisteredItem(internalName);

        if (!item) {
            return false;
        }

        return this.#inventory.consume(item, amount);
    }

    countItemInInventory(internalName) {
        let item = this.getRegisteredItem(internalName);

        if (!item) {
            return 0;
        }

        return this.#inventory.getAmountOf(item);
    }

    getInventoryAsText() {
        if (this.#inventory.sortedItemStacks.length === 0) {
            return 'Пусто';
        }

        let itemStackToText = (itemStack, index) => {
            return `${index + 1}. ${itemStack.item.title} (${itemStack.amount})`;
        };

        return this.#inventory.sortedItemStacks
            .map(itemStackToText)
            .join('\n');
    }

    get currentScreen() {
        return this.#currentScreen;
    }

    get choiceMessage() {
        return this.#choiceMessage;
    }
}