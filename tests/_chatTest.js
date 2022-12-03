import TextQuests from './../src/index.js';

let GM = {};

var GM_xmlhttpRequest = GM_xmlhttpRequest || GM.xmlhttpRequest || function () { return null; };
var GM_setValue = GM_setValue || GM.setValue || function () { return null; };
var GM_getValue = GM_getValue || GM.getValue || function () { return null; };
var GM_deleteValue = GM_deleteValue || GM.deleteValue || function () { return null; };

class AbstractChat {
    constructor() {
        this.listeners = {};
        this.activeListenerGroup = null;
        this.chatStarted = GM_getValue('current_dialog_id', null) !== null;

        this.createChatStateListenerInterval();
        this.createInputListener();
        this.createMessageListener();

        this.createSilentCommandListener();
    }

    createChatStateListenerInterval() {
        setInterval(() => {
            let isVisible = this.getChatState();
            if (this.chatStarted !== isVisible) {
                this.chatStarted = isVisible;
                this.triggerEvent('ChatStateChanged', this.chatStarted);
            }
        }, 100);
    }

    createInputListener() {
        throw new Error('Method is not implemented');
    }

    createMessageListener() {
        throw new Error('Method is not implemented');
    }

    processNewMessageElement($element) {
        let messageInfo = this.getMessageInfoFromElement($element);

        this.processNewMessageInfo(messageInfo);
    }

    processNewMessageInfo(messageInfo) {
        if (messageInfo.text.startsWith('/')) {
            let commandInfo = this.parseCommand(messageInfo.text);
            this.triggerEvent('Command', commandInfo.name, commandInfo.args, messageInfo.isOwn);

        } else {
            this.triggerEvent('Message', messageInfo.text, messageInfo.isOwn);
        }
    }

    getMessageInfoFromElement($element) {
        throw new Error('Method is not implemented');
    }

    createSilentCommandListener() {
        $(document).keydown((e) => {
            if (!e.ctrlKey || e.key !== 'Enter') {
                return;
            }

            let messageText = this.getMessageText();
            let isOwnMessage = true;

            if (!messageText.startsWith('/')) {
                return;
            }

            let commandInfo = this.parseCommand(messageText);
            this.triggerEvent('Command', commandInfo.name, commandInfo.args, isOwnMessage);
            this.setMessageText('');
        });
    }

    sendMessage(text) {
        let oldText = this.getMessageText();
        // let oldSelectionRange = this.getSelectionRange(); // Нужно реализовать

        this.setMessageHtml(text);
        this.sendCurrentMessage();

        this.setMessageHtml(oldText);
        this.setSelectionRange(1000, 1000);
    }

    setMessageText(text) {
        throw new Error('Method is not implemented');
    }

    getMessageText() {
        throw new Error('Method is not implemented');
    }

    setMessageHtml(html) {
        throw new Error('Method is not implemented');
    }

    getMessageHtml() {
        throw new Error('Method is not implemented');
    }

    setSelectionRange(start, end) {
        throw new Error('Method is not implemented');
    }

    sendCurrentMessage() {
        throw new Error('Method is not implemented');
    }

    startNewChat() {
        throw new Error('Method is not implemented');
    }

    getChatState() {
        throw new Error('Method is not implemented');
    }

    getMessageCount() {
        throw new Error('Method is not implemented');
    }

    isChatStarted() {
        return this.chatStarted;
    }

    parseCommand(message) {
        while (message.charAt(0) === '/') {
            message = message.substring(1);
        }
        let args = message.split(' ');
        let name = args.shift();
        return {
            name: name,
            args: args,
        };
    }

    addChatStartedListener(groupName, listener) {
        this.addChatStateListener(groupName, function (isStarted) {
            if (isStarted) {
                listener();
            }
        });
    }

    addChatFinishedListener(groupName, listener) {
        this.addChatStateListener(groupName, function (isStarted) {
            if (!isStarted) {
                let closedByMe = $('.talk_over_text').text().trim() === 'Вы завершили чат:';
                listener(closedByMe);
            }
        });
    }

    addInputListener(groupName, listener) {
        this.on('Input', groupName, listener);
    }

    addMessageListener(groupName, listener) {
        this.on('Message', groupName, listener);
    }

    addCommandListener(groupName, listener) {
        this.on('Command', groupName, listener);
    }

    addChatStateListener(groupName, listener) {
        this.on('ChatStateChanged', groupName, listener);
    }

    setActiveListenerGroupName(groupName) {
        this.activeListenerGroup = groupName;
    }

    clearActiveListenerGroupName() {
        this.activeListenerGroup = null;
    }

    isListenerGroupActive(groupName) {
        return this.activeListenerGroup === null || this.activeListenerGroup === groupName;
    }

    triggerEvent(eventName, ...args) {
        console.log('EVENT:', eventName, args);

        let listeners = this.listeners[eventName] || [];

        for (let listenerInfo of listeners) {
            if (this.isListenerGroupActive(listenerInfo.groupName)) {
                listenerInfo.listener(...args);
            }
        }
    }

    on(eventName, groupName, listener) {
        console.log('on(' + eventName + ', ' + listener + ')');
        if (listener === undefined) {
            return;
        }
        if (this.listeners[eventName] === undefined) {
            this.listeners[eventName] = [];
        }
        this.listeners[eventName].push({
            groupName: groupName,
            listener: listener,
        });
    }
}

class FakeChat extends AbstractChat {

    constructor() {
        super();
        this.chatState = false;
        this.messages = [];
    }

    createInputListener() {
        console.log('createInputListener()');
    }

    createMessageListener() {
        console.log('createMessageListener()');
    }

    getMessageInfoFromElement($element) {
        console.log('getMessageInfoFromElement()', $element);
        return {
            text: '',
            isOwn: false,
        };
    }

    createSilentCommandListener() {
        console.log('createSilentCommandListener()');
    }

    setMessageText(text) {
        console.log('setMessageText()', text);
    }

    getMessageText() {
        console.log('getMessageText()');
        return '';
    }

    setMessageHtml(html) {
        console.log('setMessageHtml()');
    }

    getMessageHtml() {
        console.log('getMessageHtml()');
        return '';
    }

    setSelectionRange(start, end) {
        console.log('setSelectionRange()', start, end);
    }

    sendMessage(text, isOwn = true) {
        console.log('sendMessage()', text);
        // this.triggerEvent('Message', text, true);
        if (text.startsWith('/')) {
            let commandInfo = this.parseCommand(text);
            this.triggerEvent('Command', commandInfo.name, commandInfo.args, isOwn);

        } else {
            this.triggerEvent('Message', text, isOwn);
        }
    }

    sendCurrentMessage() {
        console.log('sendCurrentMessage()');
    }

    startNewChat() {
        console.log('startNewChat()');
    }

    getChatState() {
        // console.log('getChatState()');
        return this.chatState;
    }

    getMessageCount() {
        console.log('getMessageCount()');
        return this.messages.length;
    }

    triggerEvent(eventName, ...args) {
        if (eventName === 'ChatStateChanged') {
            this.chatState = args[0];
        }
        if (eventName === 'Message') {
            this.messages.push({
                text: args[0],
                isOwn: args[1],
            });
        }
        super.triggerEvent(eventName, ...args);
    }
}





let chat = new FakeChat();

window.chat = chat;





chat.addMessageListener('QuestController', message => {
    let element = document.createElement('pre');
    element.innerHTML = message;
    document.body.append(element);
});

let messages = [
    '/quest',
    '1',
    '1',
    '3',
    '2',
    '2',
    'инвентарь',
    'крафт',
    '1',
    'экран',
    '3',
    '1',
    '1',
    '1',
];

let intervalId = setInterval(() => {
    if (messages.length === 0) {
        clearInterval(intervalId);
        return;
    }

    let message = messages.shift();

    chat.sendMessage(message);
}, 400);





for (const [questName, quest] of Object.entries(TextQuests.builtInQuests)) {
    TextQuests.plugins.chats.QuestController.addQuest(questName, quest);
}

let questController = new TextQuests.plugins.chats.QuestController(chat);
