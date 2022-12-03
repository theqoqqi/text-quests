import QuestContext from './QuestContext.js';
import Recipe from './Recipe.js';
import ItemStack from './ItemStack.js';
import Screen from './Screen.js';
import Relay from './Relay.js';
import Choice from './Choice.js';
import Condition from './Condition.js';
import Action from './Action.js';
import Fork from './Fork.js';

export default class QuestContextDeserializer {

    #questJson;

    #context;

    constructor(questJson) {
        this.#questJson = questJson;
    }

    deserialize() {
        this.#context = new QuestContext({
            internalName: this.#questJson.internalName,
            title: this.#questJson.title,
            startScreen: this.#questJson.startScreen,
        });

        this.readItems();
        this.readRecipes();
        this.readVariables();
        this.readScreens();
        this.readRelays();

        return this.#context;
    }

    readItems() {
        let itemsJson = this.#questJson.items ?? {};

        for (let [itemName, itemJson] of Object.entries(itemsJson)) {
            if (typeof itemJson === 'string') {
                itemJson = { title: itemJson };
            }

            this.#context.addItem({
                internalName: itemName,
                title: itemJson.title,
            });
        }
    }

    readRecipes() {
        let recipesJson = this.#questJson.recipes ?? {};

        for (let [recipeName, recipeJson] of Object.entries(recipesJson)) {
            if (typeof recipeJson === 'string') {
                recipeJson = QuestContextDeserializer.#parseRecipe(recipeJson);
            }

            let recipe = this.#createRecipe(recipeJson);

            this.#context.addRecipe(recipeName, recipe);
        }
    }

    readVariables() {
        let variables = this.#questJson.variables ?? {};

        for (const [name, value] of Object.entries(variables)) {
            this.#context.addVariable(name, value);
        }
    }

    readScreens() {
        let screensJson = this.#questJson.screens ?? [];

        for (const screenJson of screensJson) {
            let screen = QuestContextDeserializer.#createScreen(screenJson);

            this.#context.addScreen(screen);
        }
    }

    readRelays() {
        let relaysJson = this.#questJson.relays ?? [];

        for (const relayJson of relaysJson) {
            let relay = QuestContextDeserializer.#createRelay(relayJson);

            this.#context.addRelay(relay);
        }
    }

    #createRecipe(recipeJson) {
        let ingredients = this.#createItemStackList(recipeJson.ingredients);
        let results = this.#createItemStackList(recipeJson.results);

        return new Recipe({
            ingredients,
            results,
        });
    }

    #createItemStackList(itemsJson) {
        return Array.from(Object.entries(itemsJson))
            .map(([itemName, amount]) => this.#createItemStack(itemName, amount))
    }

    #createItemStack(itemName, amount) {
        let item = this.#context.getItem(itemName);

        return new ItemStack(item, amount);
    }

    static #createScreen(screenJson) {
        let choices = screenJson.choices.map(choiceJson => QuestContextDeserializer.#createChoice(choiceJson));

        return new Screen({
            internalName: screenJson.internalName,
            title: screenJson.title,
            text: screenJson.text,
            actions: {
                once: new Action(screenJson.actions?.once ?? []),
                always: new Action(screenJson.actions?.always ?? []),
            },
            choices,
        });
    }

    static #createChoice(choiceJson) {
        return new Choice({
            title: choiceJson.title,
            condition: new Condition(choiceJson.condition ?? []),
            action: new Action(choiceJson.action),
        });
    }

    static #createRelay(relayJson) {
        let forks = relayJson.forks.map(choiceJson => QuestContextDeserializer.#createFork(choiceJson));

        return new Relay({
            internalName: relayJson.internalName,
            actions: {
                once: new Action(relayJson.actions?.once ?? []),
                always: new Action(relayJson.actions?.always ?? []),
            },
            forks,
        });
    }

    static #createFork(forkJson) {
        return new Fork({
            condition: new Condition(forkJson.condition ?? []),
            action: new Action(forkJson.action),
        });
    }

    static #parseRecipe(recipeString) {
        let [ingredientsString, resultsString] = recipeString.trim().split('=');

        return {
            ingredients: this.#parseIngredients(ingredientsString),
            results: this.#parseResults(resultsString),
        };
    }

    static #parseIngredients(ingredientsString) {
        return this.#parseItems(ingredientsString, '+');
    }

    static #parseResults(resultsString) {
        return this.#parseItems(resultsString, '+');
    }

    static #parseItems(itemsString, separator) {
        let items = {};
        let itemNames = itemsString.split(separator).map(i => i.trim());

        for (const itemName of itemNames) {
            if (!items[itemName]) {
                items[itemName] = 0;
            }

            items[itemName]++;
        }

        return items;
    }

    static deserialize(questJson) {
        let deserializer = new QuestContextDeserializer(questJson);

        return deserializer.deserialize();
    }
}