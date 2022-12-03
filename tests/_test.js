import Quest from './../src/Quest.js';
import QuestContext from './../src/QuestContext.js';
import Condition from './../src/Condition.js';
import {test as testQuest} from './../quests/test.js';
import QuestContextDeserializer from './../src/QuestContextDeserializer.js';

document.addEventListener('DOMContentLoaded', init);
document.addEventListener('DOMContentLoaded', start);

function init() {
    let questContext = new QuestContext({
        internalName: 'testQuest',
        title: 'Тестовый квест',
        startScreen: 'start',
    });
    let quest = new Quest(questContext);

    window.quest = quest;

    questContext.addItem({
        internalName: 'item1',
        title: 'Предмет 1',
    });
    questContext.addItem({
        internalName: 'item2',
        title: 'Предмет 2',
    });

    console.log(quest.getRegisteredItem('item1'));
    console.log(quest.getRegisteredItem('item2'));

    quest.addItemToInventory('item1', 2);
    quest.addItemToInventory('item2');
    quest.addItemToInventory('item1');

    console.log(quest.getInventoryAsText());

    if (quest.consumeItemFromInventory('item1', 1)) {
        console.log('consumed item1 x 1');
    }

    if (quest.consumeItemFromInventory('item2', 3)) {
        console.log('consumed item2 x 3');
    }

    console.log(quest.getInventoryAsText());

    let condition1 = new Condition('item(item1) === 1');
    let condition2 = new Condition([
        'item(item1) > 1',
        'item(item2) === 0',
    ]);
    let condition3 = new Condition('item(item1) === 2');

    console.log('condition1:', condition1.evaluate(quest));
    console.log('condition2:', condition2.evaluate(quest));
    console.log('condition3:', condition3.evaluate(quest));
}

function start() {
    let questContext = QuestContextDeserializer.deserialize(testQuest);
    let quest = new Quest(questContext);

    let $screenTitle = $('.screen-title');
    let $screenText = $('.screen-text');
    let $choiceMessage = $('.choice-message');
    let $choices = $('.choices');
    let $inventoryControl = $('.inventory-control');
    let $recipesControl = $('.recipes-control');
    let $screenControl = $('.screen-control');

    let screenType = 'story';
    let onSelectChoice = index => {
        if (screenType === 'story') {
            quest.selectChoice(index);
        }

        if (screenType === 'recipes') {
            if (quest.canUseRecipe(index)) {
                quest.useRecipe(index);
            } else {
                setChoiceMessage('Недостаточно предметов');
            }
        }
    };

    quest.onScreenChanged(setScreen);
    quest.onChoiceMessageChanged(setChoiceMessage);
    quest.onChoiceSelected(choice => {
        setScreen(quest.currentScreen);
    });

    quest.start();

    $inventoryControl.click(() => showInventoryScreen());
    $recipesControl.click(() => showRecipesScreen());
    $screenControl.click(() => setScreen(quest.currentScreen));

    function showInventoryScreen() {
        setScreenData({
            type: 'inventory',
            title: 'Инвентарь',
            text: quest.getInventoryAsText(),
            choices: [],
        });
    }

    function showRecipesScreen() {
        let choices = quest.getAvailableRecipesAsTexts().map(recipeText => {
            return { title: recipeText };
        });

        setScreenData({
            type: 'recipes',
            title: 'Крафт',
            text: choices.length > 0 ? 'Доступные рецепты:' : 'Нет доступных рецептов',
            choices: choices,
        });
    }

    function setScreen(screen) {
        setScreenData({
            type: 'story',
            title: screen.title,
            text: screen.text,
            choices: screen.getAvailableChoices(quest),
        });
    }

    function setScreenData({type, title, text, choices}) {

        if (screenType !== type) {
            setChoiceMessage('');
        }

        screenType = type;

        if (Array.isArray(text)) {
            text = text.join('\n');
        }

        text = quest.prepareText(text);

        $screenTitle.text(title);
        $screenText.html(text.replaceAll('\n', '<br />'));

        $choices.empty();

        for (const [index, choice] of choices.entries()) {
            addChoice(index, choice);
        }
    }

    function setChoiceMessage(message) {
        if (message) {
            $choiceMessage.html(message.replaceAll('\n', '<br />'));
        } else {
            $choiceMessage.empty();
        }
    }

    function addChoice(index, choice) {
        let $choice = $('<button class="choice">');

        $choice.text(`${index + 1}. ${choice.title}`);
        $choice.click(() => onSelectChoice(index));

        $choices.append($choice);
    }

    console.log(quest);
}
