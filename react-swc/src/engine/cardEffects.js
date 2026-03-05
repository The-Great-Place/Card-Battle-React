// data/cardLibrary.js
import cards from "../data/cards.json"
export const CardLibrary = cards


export const EFFECT_ACTIONS = {
  DAMAGE: (target, value) => target.takeDamage(value),
  HEAL: (target, value) => target.modifyHealth(value), // Or addHeal
  SHIELD: (target, value) => target.addShield(value),
  DRAW: (target, value) => target.drawCard(value)
};