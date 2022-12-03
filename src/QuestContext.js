import Item from './Item.js';

export default class QuestContext {

    #internalName;

    #title;

    #startScreen;

    #items = new Map();

    #recipes = new Map();

    #variables = new Map();

    #screens = new Map();

    #relays = new Map();

    constructor({internalName, title, startScreen}) {
        this.#internalName = internalName;
        this.#title = title;
        this.#startScreen = startScreen;
    }

    addItem({internalName, title}) {
        if (this.#items.has(internalName)) {
            console.error(`Предмет с именем ${internalName} перезаписан, т.к. уже был зарегистрирован ранее`);
        }

        let item = new Item({internalName, title});

        this.#items.set(internalName, item);
    }

    getItem(internalName) {
        return this.#items.get(internalName);
    }

    addRecipe(internalName, recipe) {
        this.#recipes.set(internalName, recipe);
    }

    getRecipe(internalName) {
        return this.#recipes.get(internalName);
    }

    addVariable(name, value) {
        this.#variables.set(name, value);
    }

    getVariable(name) {
        return this.#variables.get(name);
    }

    addScreen(screen) {
        let internalName = screen.internalName;

        if (this.#screens.has(internalName)) {
            console.error(`Экран с именем ${internalName} перезаписан, т.к. уже был зарегистрирован ранее`);
        }

        this.#screens.set(internalName, screen);
    }

    getScreen(internalName) {
        return this.#screens.get(internalName);
    }

    getStartScreen() {
        return this.getScreen(this.#startScreen);
    }

    addRelay(relay) {
        let internalName = relay.internalName;

        if (this.#relays.has(internalName)) {
            console.error(`Релей с именем ${internalName} перезаписан, т.к. уже был зарегистрирован ранее`);
        }

        this.#relays.set(internalName, relay);
    }

    getRelay(internalName) {
        return this.#relays.get(internalName);
    }

    get internalName() {
        return this.#internalName;
    }

    get title() {
        return this.#title;
    }

    get recipes() {
        return this.#recipes;
    }

    get variables() {
        return this.#variables;
    }

    get screens() {
        return this.#screens;
    }

    get relays() {
        return this.#relays;
    }
}