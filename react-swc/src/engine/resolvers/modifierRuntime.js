import { removeModifier } from "./modifierHelpers";

export function tickCardModifierDurations(card, decrement = 1) {
  if (!card?.modifiers || !Array.isArray(card.modifiers)) return [];

  const updated = [];
  for (let index = card.modifiers.length - 1; index >= 0; index -= 1) {
    const modifier = card.modifiers[index];
    if (modifier.duration == null) {
      updated.push(modifier);
      continue;
    }

    modifier.duration = Math.max(0, modifier.duration - decrement);
    if (modifier.duration === 0) {
      removeModifier(card, modifier.instanceId);
      continue;
    }

    updated.push(modifier);
  }

  return updated;
}
