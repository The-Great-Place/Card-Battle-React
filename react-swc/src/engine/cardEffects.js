// data/cardLibrary.js
const response = await fetch('./Data/cards.json')
export const CardLibrary = await response.json()
console.log(CardLibrary)


export const EFFECT_ACTIONS = {
  DAMAGE: (target, value) => target.takeDamage(value),
  HEAL: (target, value) => target.modifyHealth(value), // Or addHeal
  SHIELD: (target, value) => target.addShield(value),
  DRAW: (target, value) => target.drawCard(value),
  APPLY_BURN: (target, value) => target.onFire += value,
  APPLY_WET: (target, value) => target.onWet += value,
  APPLY_ELEC: (target, value) => target.onElec += value,
  DAMAGE_FIRE: (target, value) => target.takeDamage(value, 'fire'),
  DAMAGE_WATER: (target, value) => target.takeDamage(value, 'water'),
  DAMAGE_ELEC: (target, value) => target.takeDamage(value, 'elec'),
  FREEZE: (target, value) => target.isFrozen = true,
  CHARGE: (target, value) => target.charge += value,
  REDUCE_NEXT_CARDS_COST: (target, value) => {
  const amount = value?.amount ?? 0;
  const charges = value?.charges ?? 0;

  target.costReductionAmount = Math.max(target.costReductionAmount, amount);
  target.costReductionCharges += charges;
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