import { setCardDefinitions } from "./definitions/cardRegistry";

// data/cardLibrary.js
const response = await fetch('./Data/cards.json')
export const CardLibrary = await response.json()
setCardDefinitions(CardLibrary);












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
