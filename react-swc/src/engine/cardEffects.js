import { CardInstance } from "../Objects/Card";
// data/cardLibrary.js
const response = await fetch('./Data/cards.json')
export const CardLibrary = await response.json()


export const EFFECT_ACTIONS = {
  DAMAGE: (context, effect) => {
    const amount = resolveValue(context, effect.value);
    context.target.takeDamage(amount);
  },
  HEAL: (context, effect) => {
    context.target.modifyHealth(effect.value)
  }, // Or addHeal
  DRAW: (context, effect) => {
    context.target.drawCard(effect.value)
  },
  APPLY_STACK: (context, effect) => {
    const amount = resolveValue(context, effect.value)
    context.target.applyStack(effect.stack_name, amount)
  },
  REDUCE_NEXT_CARDS_COST: (context, effect) => {
    let value = effect.value
    for (let i = 0; i < effect.charges; i++){
      if (context.target.costReduction[i]){ context.target.costReduction[i] += effect.value }
      else {context.target.costReduction.push(effect.value)}
    }
  },
  CREATE_TEMP_CARD_IN_HAND: (context, effect) => {
  let value = effect.value

  for (let i = 0; i < value.count; i++) {
    const tempCard = CardInstance.fromCardId(value.cardId, {
      costOverride: value.energy_cost ?? null,
      exhaust: value.exhaust ?? false,
      temporary: true,
    });
    if (!tempCard) continue;

    context.target.deck.addCardInstance(tempCard, "hand");
  }
  },
 
};












// Helper to get nested properties like "target.health"
const getProp = (context, path) => {
  //case 1: static number prop
  if (typeof path === 'number') return path;
  //case 2: dynamic prop
  const keys = path.split('.');
  return keys.reduce((obj, key) => obj?.[key], context);
};
const calculate = (a, b, o) =>{
  switch (o) {
    case '+':
      return a + b;
    case '-':
      return a - b;
    case '*':
      return a * b;
    case '/':
      return Math.floor(a / b);
    default:
      return 0;
  }
}
// Calculate dynamic value
export const resolveValue = (context, value) => {
  // Case 1: It's just a number (Static)
  if (typeof value === 'number') return value;
  // Case 2: It's a dynamic formula (Variable)
  const params = value.params;

  const operations = new Set(['+', '-', '*', '/'])
  const stack = []
  params.forEach(e => {
    if (operations.has(e)){
      let second = stack.pop();
      let first = stack.pop();
      stack.push(calculate(first, second, e));
    }
    else {
      stack.push(getProp(context, e));
    }
  });

  return stack[0]
};
