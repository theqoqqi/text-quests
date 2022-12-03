import QuestContextDeserializer from '../../src/QuestContextDeserializer.js';
import Quest from '../../src/Quest.js';

export default class QuestController {

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

                console.log();

                this.#chat.setActiveListenerGroupName('QuestController');
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

            if (['инвентарь', 'предметы', 'вещи'].includes(message.toLowerCase())) {
                this.#showInventoryScreen();
            }

            if (['крафт', 'рецепты', 'создание'].includes(message.toLowerCase())) {
                this.#showRecipesScreen();
            }

            if (['экран', 'текст', 'сцена'].includes(message.toLowerCase())) {
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
                this.#setChoiceMessage('Недостаточно предметов');
            }
        }
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
            title: 'Инвентарь',
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
            title: 'Крафт',
            text: choices.length > 0 ? 'Доступные рецепты:' : 'Нет доступных рецептов',
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

        this.#chat.sendMessage(messageText);
    }

    #setChoiceMessage(message) {
        if (message) {
            this.#chat.sendMessage(message);
        }
    }

    static addQuest(questName, quest) {
        this.#quests[questName] = quest;
    }

    static #arraysEqual(a, b) {
        return a.length === b.length
            && a.every((v, i) => v === b[i]);
    }
}
