export default class Action {

    static #commandTypes = {
        jump(quest, screenName) {
            quest.setCurrentScreen(screenName);
        },
        relay(quest, relayName) {
            quest.useRelay(relayName);
        },
        message(quest, text) {
            quest.setChoiceMessage(text);
        },
        give(quest, item, amount = 1) {
            quest.addItemToInventory(item, amount);
        },
        consume(quest, item, amount = 1) {
            quest.consumeItemFromInventory(item, amount);
        },
        unlock(quest, recipeName) {
            quest.unlockRecipe(recipeName);
        },
        lock(quest, recipeName) {
            quest.lockRecipe(recipeName);
        },
        set(quest, variableName, operator, expression) {
            let value = quest.getVariable(variableName);

            eval(`value
            ${operator}
            ${expression}`);

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