// data/cardLibrary.js
const response = await fetch('./Data/cards.json')
export const CardLibrary = await response.json()


export const EFFECT_ACTIONS = {
  DAMAGE: (target, value) => target.takeDamage(value),
  HEAL: (target, value) => target.modifyHealth(value), // Or addHeal
  DRAW: (target, value) => target.drawCard(value),
  SHIELD: (target, value) => target.applyStack("shield", value),
  APPLY_BURN: (target, value) => target.applyStack("burn", value),
  APPLY_WET: (target, value) => target.applyStack("flow", value),
  DAMAGE_FIRE: (target, value) => target.takeDamage(value, 'fire'),
  DAMAGE_WATER: (target, value) => target.takeDamage(value, 'water'),
  DAMAGE_ELEC: (target, value) => target.takeDamage(value, 'elec'),
  FREEZE: (target, value) => target.applyStack("freeze", value),
  CHARGE: (target, value) => target.target.applyStack("charge", value),
  APPLY_REGEN: (target, value) => target.applyStack("regeneration", value),
  APPLY_FORTIFY: (target, value) => target.applyStack("fortify", value),
  MULTIPLY_DAMAGE: (target, value) => target.applyStack("damageMultiplier", value),
  APPLY_MULTISELECT: (target, value) => target.applyStack("multiselect", value),
  APPLY_PREPARATION: (target, value) => target.applyStack("preparation", value),
  REDUCE_NEXT_CARDS_COST: (target, value) => {
    for (let i = 0; i < value.charges; i++){
      if (target.costReduction[i]){ target.costReduction[i] += value.amount }
      else {target.costReduction.push(value.amount)}
    }
  },
  CREATE_TEMP_CARD_IN_HAND: (target, value) => {
  const baseCard = CardLibrary[value.cardId];
  if (!baseCard) return;

  for (let i = 0; i < value.count; i++) {
    const tempCard = {
      ...baseCard,
      energy_cost: value.energy_cost ?? baseCard.energy_cost ?? 1,
      exhaust: value.exhaust ?? false,
      temporary: true,
    };

    target.deck.hand.push(tempCard);
  }
  },
 
};