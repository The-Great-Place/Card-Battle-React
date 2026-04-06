import { createModifierInstance } from "../models/ModifierInstance";

export function addModifier(owner, modifierInput) {
  if (!owner || !Array.isArray(owner.modifiers)) return null;

  const modifier = createModifierInstance(modifierInput);
  owner.modifiers.push(modifier);
  return modifier;
}

export function removeModifier(owner, modifierInstanceId) {
  if (!owner || !Array.isArray(owner.modifiers) || !modifierInstanceId) return null;

  const index = owner.modifiers.findIndex((modifier) => modifier.instanceId === modifierInstanceId);
  if (index < 0) return null;

  const [removedModifier] = owner.modifiers.splice(index, 1);
  return removedModifier ?? null;
}

export function getModifiersByKind(owner, kind) {
  if (!owner || !Array.isArray(owner.modifiers) || !kind) return [];
  return owner.modifiers.filter((modifier) => modifier.kind === kind);
}

export function consumeModifierUse(owner, modifierInstanceId, uses = 1) {
  if (!owner || !Array.isArray(owner.modifiers) || !modifierInstanceId) return null;

  const modifier = owner.modifiers.find((entry) => entry.instanceId === modifierInstanceId) ?? null;
  if (!modifier) return null;
  if (modifier.remainingUses == null) return modifier;

  modifier.remainingUses = Math.max(0, modifier.remainingUses - uses);
  if (modifier.remainingUses === 0) {
    removeModifier(owner, modifierInstanceId);
    return null;
  }

  return modifier;
}
