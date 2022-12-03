
import Action from './Action.js';
import Choice from './Choice.js';
import Condition from './Condition.js';
import Fork from './Fork.js';
import Inventory from './Inventory.js';
import Item from './Item.js';
import ItemStack from './ItemStack.js';
import Quest from './Quest.js';
import QuestContext from './QuestContext.js';
import QuestContextDeserializer from './QuestContextDeserializer.js';
import Recipe from './Recipe.js';
import Relay from './Relay.js';
import Screen from './Screen.js';

import QuestController from './../plugins/chats/QuestController.js';

import { test } from '../quests/test.js';

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

export default TextQuests;
