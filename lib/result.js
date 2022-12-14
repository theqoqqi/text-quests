
class Action {

    static #commandTypes = {
        jump(quest, screenName) {
            quest.setCurrentScreen(screenName);
        },
        next(quest, amount) {
            quest.goToNextScreen(amount ? +amount : undefined);
        },
        relay(quest, relayName) {
            quest.useRelay(relayName);
        },
        message(quest, text) {
            quest.setChoiceMessage(text);
        },
        give(quest, item, amount = 1) {
            quest.addItemToInventory(item, amount ? +amount : undefined);
        },
        consume(quest, item, amount = 1) {
            quest.consumeItemFromInventory(item, amount ? +amount : undefined);
        },
        unlock(quest, recipeName) {
            quest.unlockRecipe(recipeName);
        },
        lock(quest, recipeName) {
            quest.lockRecipe(recipeName);
        },
        set(quest, variableName, operator, expression) {
            let value = quest.getVariable(variableName);

            eval(`value ${operator} ${expression}`);

            quest.setVariable(variableName, value);
        },
        exit(quest) {
            quest.finish();
        },
    };

    #commands;

    constructor(commands) {
        this.#commands = Array.isArray(commands)
            ? commands : [commands];
    }

    execute(quest) {
        let commands = this.#commands.map(command => Action.#parseCommand(command));

        for (const command of commands) {
            Action.#executeCommand(command, quest);
        }
    }

    hasCommand(commandType) {
        return this.#commands.some(command => command.startsWith(commandType));
    }

    static #executeCommand(command, quest) {
        let commandType = Action.#commandTypes[command.type];

        commandType(quest, ...command.args);
    }

    static #parseCommand(commandString) {
        let [command, ...args] = this.#splitArguments(commandString);

        return {
            type: command,
            args,
        };
    }

    static #splitArguments(string) {
        let regex = /[^\s"]+|"([^"]*)"/gi;
        let args = [];
        let match;

        do {
            match = regex.exec(string);

            if (match != null) {
                args.push(match[1] ? match[1] : match[0]);
            }
        } while (match != null);

        return args;
    }
}

class Choice {

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

class Condition {

    #expressions;

    constructor(expressions = []) {
        this.#expressions = Array.isArray(expressions)
            ? expressions : [expressions];
    }

    evaluate(quest) {
        if (this.#expressions.length === 0) {
            return true;
        }

        let preparedExpressions = this.#expressions.map(e => this.#prepareExpression(e, quest));
        let combinedExpression = preparedExpressions.map(e => `(${e})`).join(' || ');

        return eval(combinedExpression);
    }

    #prepareExpression(expression, quest) {
        return expression
            .replaceAll(/item\((\w+)\)/g, (match, itemName) => {
                return quest.countItemInInventory(itemName);
            })
            .replaceAll(/var\((\w+)\)/g, (match, itemName) => {
                return quest.getVariable(itemName);
            });
    }

    static alwaysTrue() {
        return new Condition([]);
    }
}

class Fork {

    #condition;

    #action;

    constructor({condition, action}) {
        this.#condition = condition;
        this.#action = action;
    }

    get condition() {
        return this.#condition;
    }

    get action() {
        return this.#action;
    }
}

class Inventory {

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

class Item {

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

class ItemStack {

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

class Quest {

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

    goToNextScreen(amount = 1) {
        let currentIndex = this.#context.getScreenIndex(this.#currentScreen);

        this.setCurrentScreen(currentIndex + amount);
    }

    setCurrentScreen(screen) {
        if (typeof screen === 'number') {
            screen = this.#context.getScreenByIndex(screen);
        }

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
        let recipe = this.#context.getRecipe(name);

        if (recipe) {
            this.#unlockedRecipes.push(recipe);
        }
    }

    lockRecipe(name) {
        let recipe = this.#context.getRecipe(name);
        let index = this.#unlockedRecipes.indexOf(recipe);

        if (index !== -1) {
            this.#unlockedRecipes.splice(index, 1);
        }
    }

    isRecipeUnlocked(name) {
        let recipe = this.#context.getRecipe(name);

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

        this.setChoiceMessage(`???? ?????????????? ${itemsString}`);
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
            let availabilityString = recipe.canCraft(this) ? '?????????? ??????????????' : '???? ??????????????';

            return `${resultsString} (??????????: ${ingredientsString}, ${availabilityString})`;
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
            console.error(`?????????????? ???????????????????????? ???????????????????????????? ?????????????? '${internalName}'`);
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
            return '??????????';
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

class QuestContext {

    #internalName;

    #title;

    #startScreen;

    #items = new Map();

    #recipes = new Map();

    #variables = new Map();

    #screens = [];

    #screensByNames = new Map();

    #relays = new Map();

    constructor({internalName, title, startScreen}) {
        this.#internalName = internalName;
        this.#title = title;
        this.#startScreen = startScreen;
    }

    addItem({internalName, title}) {
        if (this.#items.has(internalName)) {
            console.error(`?????????????? ?? ???????????? ${internalName} ??????????????????????, ??.??. ?????? ?????? ?????????????????????????????? ??????????`);
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

        this.#screens.push(screen);

        if (!internalName) {
            return;
        }

        if (this.#screensByNames.has(internalName)) {
            console.error(`?????????? ?? ???????????? ${internalName} ??????????????????????, ??.??. ?????? ?????? ?????????????????????????????? ??????????`);
        }

        this.#screensByNames.set(internalName, screen);
    }

    getScreen(internalName) {
        return this.#screensByNames.get(internalName);
    }

    getScreenIndex(screen) {
        return this.#screens.indexOf(screen);
    }

    getScreenByIndex(index) {
        return this.#screens[index];
    }

    getStartScreen() {
        return this.getScreen(this.#startScreen);
    }

    addRelay(relay) {
        let internalName = relay.internalName;

        if (this.#relays.has(internalName)) {
            console.error(`?????????? ?? ???????????? ${internalName} ??????????????????????, ??.??. ?????? ?????? ?????????????????????????????? ??????????`);
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

class QuestContextDeserializer {

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

class Recipe {

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

class Relay {

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

class Screen {

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

class QuestController {

    static #quests = {};

    #chat;

    #quest = null;

    #screenType = 'story';

    #lastScreenName = 'EMPTY';

    #lastAvailableChoices = [];

    constructor(chat) {
        this.#chat = chat;

        this.#chat.addCommandListener('QuestController', (command, args) => {
            if (command.toLowerCase() === 'quest') {
                let questData = QuestController.#quests[args[0] || 'test'];

                this.#chat.setActiveListenerGroupName('QuestController');
                this.#sendHelpMessage();
                this.#startQuest(questData);
            }

            if (command.toLowerCase() === 'stop-quest') {
                this.#chat.clearActiveListenerGroupName();
                this.#stopQuest();
            }
        });

        this.#chat.addMessageListener('QuestController', message => {
            if (!this.#quest) {
                return;
            }

            if (message.match(/^[1-9]$/g)) {
                let choiceNumber = +message.charAt(0);

                this.#onSelectChoice(choiceNumber - 1);
            }

            if (['??????????????????', '????????????????', '????????'].includes(message.toLowerCase())) {
                this.#showInventoryScreen();
            }

            if (['??????????', '??????????????', '????????????????'].includes(message.toLowerCase())) {
                this.#showRecipesScreen();
            }

            if (['??????????', '??????????', '??????????'].includes(message.toLowerCase())) {
                this.#setScreen(this.#quest.currentScreen);
            }
        });
    }

    #onSelectChoice(index) {
        if (this.#screenType === 'story') {
            this.#quest.selectChoice(index);
        }

        if (this.#screenType === 'recipes') {
            if (this.#quest.canUseRecipe(index)) {
                this.#quest.useRecipe(index);
            } else {
                this.#setChoiceMessage('???????????????????????? ??????????????????');
            }
        }
    }

    #sendHelpMessage() {
        this.#sendChatMessage(
            '?????????? ?????????????? ????????????????, ???????????? ?????????????? ?????????????????? ?? ?????? ??????????????.'
            + '\n?????????? ??????????, ?????????? ?????????????????? ?????????????????? ??????????????????:'
            + '\n?????????????????? - ???????????????????? ???????????? ?????????????????? ??????????.'
            + '\n?????????? - ?????????????? ?????????? ?????????????? ???? ??????????????????.'
            + '\n?????????? - ?????????????????? ?? ???????????? ?? ?????????????? ?? ????????????????????.'
        );
    }

    #startQuest(questData) {
        let questContext = QuestContextDeserializer.deserialize(questData);
        let quest = new Quest(questContext);

        this.#quest = quest;

        quest.onScreenChanged(screen => this.#setScreen(screen));

        quest.onChoiceSelected(choice => {
            if (!quest) {
                return;
            }

            let availableChoices = quest.getAvailableChoices();
            let screenChanged = this.#lastScreenName !== quest.currentScreen.internalName;
            let choicesChanged = !QuestController.#arraysEqual(this.#lastAvailableChoices, availableChoices);
            let updatesText = choice.changesScreen || choice.hasMessage;

            if ((!screenChanged && choicesChanged) || !updatesText) {
                this.#setScreen(quest.currentScreen);
            }
        });

        quest.onChoiceMessageChanged(message => {
            setTimeout(() => {
                this.#setChoiceMessage(message);
            }, 200);
        });

        quest.onQuestFinished(() => {
            this.#chat.clearActiveListenerGroupName();
            this.#stopQuest();
        });

        quest.start();
    }

    #stopQuest() {
        this.#quest = null;
    }

    #showInventoryScreen() {
        this.#setScreenData({
            internalName: 'INVENTORY',
            type: 'inventory',
            title: '??????????????????',
            text: this.#quest.getInventoryAsText(),
            choices: [],
        });
    }

    #showRecipesScreen() {
        let choices = this.#quest.getAvailableRecipesAsTexts().map(recipeText => {
            return { title: recipeText };
        });

        this.#setScreenData({
            internalName: 'RECIPES',
            type: 'recipes',
            title: '??????????',
            text: choices.length > 0 ? '?????????????????? ??????????????:' : '?????? ?????????????????? ????????????????',
            choices: choices,
        });
    }

    #setScreen(screen) {
        this.#setScreenData({
            internalName: screen.internalName,
            type: 'story',
            title: screen.title,
            text: screen.text,
            choices: screen.getAvailableChoices(this.#quest),
        });
    }

    #setScreenData({internalName, type, title, text, choices}) {
        if (!this.#quest) {
            return;
        }

        this.#screenType = type;
        this.#lastScreenName = internalName;
        this.#lastAvailableChoices = choices;

        if (Array.isArray(text)) {
            text = text.join('\n');
        }

        text = this.#quest.prepareText(text);

        let choicesText = Array.from(choices.entries())
            .map(([index, choice]) => {
                return `${index + 1}. ${choice.title}`;
            })
            .join('\n');

        let messageText = `${title}\n${text}\n${choicesText}`;

        this.#sendChatMessage(messageText);
    }

    #setChoiceMessage(message) {
        if (message) {
            this.#sendChatMessage(message);
        }
    }

    #sendChatMessage(message) {
        this.#chat.sendMessage(message.replaceAll('\n', '<br />'));
    }

    static addQuest(questName, quest) {
        this.#quests[questName] = quest;
    }

    static #arraysEqual(a, b) {
        return a.length === b.length
            && a.every((v, i) => v === b[i]);
    }
}

const test = {
    internalName: 'test',
    title: '???????????????? ??????????',
    startScreen: 'start',
    items: {
        stone: '????????????',
        stick: '??????????',
        sword: '??????',
        feather: '????????',
    },
    recipes: {
        sword: 'stick + stone + stone = sword',
    },
    variables: {
        owl: false,
    },
    screens: [
        {
            internalName: 'start',
            title: '??????????',
            text: '?????????? ???????????? ????????????, ?????? ?????????? ??????',
            actions: {
                once: [
                    'unlock sword',
                ],
            },
            choices: [
                {
                    title: '????????????',
                    condition: 'item(sword) >= 1',
                    action: [
                        'relay finish',
                        'consume sword',
                        'lock sword',
                    ],
                },
                {
                    title: '?????????? ?? ??????',
                    action: 'next',
                },
            ],
        },
        {
            internalName: 'forest',
            title: '??????',
            text: '???? ???????????? ?????????? ????????????????, ???????????????????? ?????????? ?? ????????????',
            choices: [
                {
                    title: '?????????????????? ??????????',
                    action: [
                        'give stick',
                        'message "???? ?????????????????? ??????????"',
                    ],
                },
                {
                    title: '?????????????????? ????????????',
                    action: [
                        'give stone',
                        'message "???? ?????????????????? ????????????"',
                    ],
                },
                {
                    title: '?????????????????????????? ?? ??????????',
                    condition: 'var(owl) !== true',
                    action: [
                        'set owl = true',
                        'message "???????? ???????? ???????????????? ?? ??????????"',
                    ],
                },
                {
                    title: '??????????????????',
                    action: 'jump start',
                },
            ],
        },
        {
            internalName: 'owl',
            title: '????????',
            text: '???????? ???????????? ?????? ??????????',
            choices: [
                {
                    title: '??????????????!',
                    action: 'next',
                },
            ],
        },
        {
            title: '?????????????? ???? ????????',
            text: '???????? ???????????????? ?????? ????????',
            choices: [
                {
                    title: '(?????????????? ?? ???????????? ????????????)',
                    action: [
                        'give feather',
                        'message "???? ?????????????????? ????????"',
                        'next',
                    ],
                },
            ],
        },
        {
            internalName: 'finish',
            title: '??????????',
            text: [
                '???? ????????????!',
                '[if var(owl)]???????? ??????????????.[/if]',
            ],
            choices: [
                {
                    title: '??????????',
                    action: 'exit',
                },
            ],
        },
    ],
    relays: [
        {
            internalName: 'finish',
            forks: [
                {
                    condition: 'var(owl) === true',
                    action: 'jump owl',
                },
                {
                    action: 'jump finish',
                },
            ],
        }
    ],
};

let TextQuests = {
    Action,
    Choice,
    Condition,
    Fork,
    Inventory,
    Item,
    ItemStack,
    Quest,
    QuestContext,
    QuestContextDeserializer,
    Recipe,
    Relay,
    Screen,
    builtInQuests: {
        test
    },
    plugins: {
        chats: {
            QuestController
        }
    }
};

window.TextQuests = TextQuests;
