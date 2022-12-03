
export const test = {
    internalName: 'test',
    title: 'Тестовый квест',
    startScreen: 'start',
    items: {
        stone: 'Камень',
        stick: 'Палка',
        sword: 'Меч',
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
            title: 'Старт',
            text: 'Чтобы пройти дальше, вам нужен меч',
            actions: {
                once: [
                    'unlock sword',
                ],
            },
            choices: [
                {
                    title: 'Пройти',
                    condition: 'item(sword) >= 1',
                    action: [
                        'relay finish',
                        'consume sword',
                        'lock sword',
                    ],
                },
                {
                    title: 'Пойти в лес',
                    action: 'jump forest',
                },
            ],
        },
        {
            internalName: 'forest',
            title: 'Лес',
            text: 'Вы видите много деревьев, валяющихся палок и камней',
            choices: [
                {
                    title: 'Подобрать палку',
                    action: [
                        'give stick',
                        'message "Вы подобрали палку"',
                    ],
                },
                {
                    title: 'Подобрать камень',
                    action: [
                        'give stone',
                        'message "Вы подобрали камень"',
                    ],
                },
                {
                    title: 'Поздороваться с совой',
                    condition: 'var(owl) !== true',
                    action: [
                        'set owl = true',
                        'message "Сова лишь угукнула в ответ"',
                    ],
                },
                {
                    title: 'Вернуться',
                    action: 'jump start',
                },
            ],
        },
        {
            internalName: 'owl',
            title: 'Сова',
            text: 'Сова желает вам удачи',
            choices: [
                {
                    title: 'Спасибо! (пройти дальше)',
                    action: 'jump finish',
                },
            ],
        },
        {
            internalName: 'finish',
            title: 'Финиш',
            text: [
                'Вы прошли!',
                '[if var(owl)]Сова улетела.[/if]',
            ],
            choices: [
                {
                    title: 'Конец',
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
