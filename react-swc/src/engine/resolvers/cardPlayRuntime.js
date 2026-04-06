import { resolveValue } from "../cardEffects";
import { consumeModifierUse } from "./modifierHelpers";
import { tickCardModifierDurations } from "./modifierRuntime";
import { resolveEffect } from "./effectResolver";

function buildEffectContext(source, target, card) {
  return {
    source,
    target,
    card,
  };
}

function normalizeTargets(target) {
  return Array.isArray(target) ? target : [target];
}

function resolveEffectValue(source, target, card, rawEffect) {
  const effect = { ...rawEffect };

  if (effect.value && typeof effect.value === "object" && Array.isArray(effect.value.params)) {
    effect.value = resolveValue(
      buildEffectContext(source, target, card),
      { params: [...effect.value.params] },
    ) ?? 0;
  }

  return effect;
}

function applyCardModifiersToEffect(card, effect) {
  if (!card?.getModifiersByKind) return;
  if (effect.type !== "DAMAGE") return;

  const damageBonus = card.getModifiersByKind("damage_bonus").reduce((total, modifier) => {
    return total + (modifier.amount ?? 0);
  }, 0);

  if (damageBonus !== 0) {
    effect.value += damageBonus;
  }

  card.getModifiersByKind("damage_bonus").forEach((modifier) => {
    if (modifier.remainingUses != null) {
      consumeModifierUse(card, modifier.instanceId, 1);
    }
  });
}

function resolveEffectTarget(source, target, effect) {
  return effect.target === "self" ? source : target;
}

export function resolveCardPlay(source, target, card, prepareEffect) {
  const targets = normalizeTargets(target);

  card.effects.forEach((rawEffect) => {
    const previewTarget = targets[0] ?? source;
    const effect = resolveEffectValue(source, previewTarget, card, rawEffect);
    applyCardModifiersToEffect(card, effect);
    prepareEffect(effect);

    targets.forEach((targetEntity) => {
      resolveEffect(
        buildEffectContext(source, resolveEffectTarget(source, targetEntity, effect), card),
        effect,
      );
    });
  });

  tickCardModifierDurations(card, 1);
}
