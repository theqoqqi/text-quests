
export default class Condition {

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