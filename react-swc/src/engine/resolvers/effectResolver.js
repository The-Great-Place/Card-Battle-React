import { CardInstance } from "../../Objects/Card";
import { getEffectSchema } from "../definitions/effectSchemaRegistry";
import { getStatusDefinition } from "../definitions/statusRegistry";
import { resolveValue } from "../cardEffects";
import { getCardDefinition } from "../definitions/cardRegistry";
import { getRegisteredInteractionController } from "../core/InteractionController";

function getValidCardIdsFromSelector(context, selector) {
  if (!selector) return [];

  if (selector === "hand") {
    return context.source?.deck?.hand?.map((card) => card.instanceId) ?? [];
  }

  return [];
}

function getValidEntityIdsFromSelector(context, selector) {
  if (!selector) return [];

  if (selector === "self") {
    return context.source ? [context.source.id] : [];
  }

  if (selector === "target") {
    return context.target ? [context.target.id] : [];
  }

  return [];
}

function getSelectionIds(context, effect) {
  const explicitSelection = Array.isArray(effect.selectionIds) ? effect.selectionIds : null;
  const contextSelection = Array.isArray(context.selectionIds) ? context.selectionIds : null;
  const pendingSelection = Array.isArray(context.pendingInteraction?.selectedTargetIds)
    ? context.pendingInteraction.selectedTargetIds
    : null;

  return explicitSelection?.length
    ? explicitSelection
    : contextSelection?.length
    ? contextSelection
    : pendingSelection ?? [];
}

function resolveEffectAmount(context, rawValue) {
  return resolveValue(context, rawValue);
}

const effectHandlers = {
  DAMAGE: (context, effect) => {
    const amount = resolveEffectAmount(context, effect.value);
    context.target.takeDamage(amount);
  },
  HEAL: (context, effect) => {
    context.target.modifyHealth(effect.value);
  },
  DRAW: (context, effect) => {
    context.target.drawCard(effect.value);
  },
  APPLY_STACK: (context, effect) => {
    const amount = resolveEffectAmount(context, effect.value);
    const definitionId = effect.stack_name;
    if (!definitionId || !context.target?.applyStatus) return;

    const definition = getStatusDefinition(definitionId);
    const stacking = definition?.stacking ?? "amount";
    const statusInput = {
      definitionId,
      sourceEntityId: context.source?.id ?? context.target?.id ?? null,
    };

    if (definitionId === "regeneration" || stacking === "duration") {
      statusInput.duration = amount;
    } else {
      statusInput.amount = amount;
    }

    context.target.applyStatus(statusInput);
  },
  REDUCE_NEXT_CARDS_COST: (context, effect) => {
    const amount = resolveEffectAmount(context, effect.value);
    for (let i = 0; i < effect.charges; i += 1) {
      context.target.applyStatus({
        definitionId: "costReduction",
        amount,
        duration: 1,
        sourceEntityId: context.source?.id ?? context.target?.id ?? null,
      });
    }
  },
  CREATE_TEMP_CARD_IN_HAND: (context, effect) => {
    const value = effect.value;

    for (let i = 0; i < value.count; i += 1) {
      const tempCard = CardInstance.fromCardId(value.cardId, {
        costOverride: value.energy_cost ?? null,
        exhaust: value.exhaust ?? false,
        temporary: true,
      });
      if (!tempCard) continue;

      if (Array.isArray(value.modifiers)) {
        value.modifiers.forEach((modifierInput) => {
          tempCard.addModifier({
            scope: "card",
            ...modifierInput,
          });
        });
      }

      context.target.deck.addCardInstance(tempCard, "hand");
    }
  },
  APPLY_MODIFIER: (context, effect) => {
    const modifier = effect.modifier ?? effect.value?.modifier ?? null;
    if (!modifier || !context.card?.addModifier) return;
    context.card.addModifier({
      scope: "card",
      ...modifier,
    });
  },
  APPLY_MODIFIER_WITH_USES: (context, effect) => {
    const modifier = effect.modifier ?? effect.value?.modifier ?? null;
    if (!modifier || !context.card?.addModifier) return;

    const uses = effect.uses ?? effect.value?.uses ?? modifier.remainingUses ?? null;
    context.card.addModifier({
      scope: "card",
      remainingUses: uses ?? null,
      ...modifier,
    });
  },
  APPLY_MODIFIER_WITH_DURATION: (context, effect) => {
    const modifier = effect.modifier ?? effect.value?.modifier ?? null;
    if (!modifier || !context.card?.addModifier) return;

    const duration = effect.duration ?? effect.value?.duration ?? modifier.duration ?? null;
    context.card.addModifier({
      scope: "card",
      duration: duration ?? null,
      ...modifier,
    });
  },
  BEGIN_INTERACTION: (context, effect) => {
    const interactionController = getRegisteredInteractionController();
    if (!interactionController) return;

    const interaction = effect.interaction ?? effect.value?.interaction ?? null;
    if (!interaction) return;

    const selector = interaction.selector ?? null;
    const validCardInstanceIds = interaction.validCardInstanceIds ?? getValidCardIdsFromSelector(context, selector);
    const validEntityIds = interaction.validEntityIds ?? getValidEntityIdsFromSelector(context, selector);
    const validOptionIds = Array.isArray(interaction.options)
      ? interaction.options.map((option) => option.id).filter(Boolean)
      : [];

    interactionController.beginInteraction(
      {
        ...interaction,
        validCardInstanceIds,
        validEntityIds,
        validOptionIds,
      },
      context,
    );
  },
  UPGRADE_SELECTED_CARD: (context, effect) => {
    const deckOwner = context.source?.deck ?? context.target?.deck ?? null;
    if (!deckOwner) return;

    const selectionIds = getSelectionIds(context, effect);
    const upgrade = effect.upgrade ?? effect.value?.upgrade ?? {};
    const damageBonus = upgrade.damageBonus ?? 0;
    const costReduction = upgrade.costReduction ?? 0;

    selectionIds.forEach((instanceId) => {
      const card = deckOwner.getCardInHand(instanceId);
      if (!card) return;

      if (damageBonus !== 0 && typeof card.addModifier === "function") {
        card.addModifier({
          scope: "card",
          kind: "damage_bonus",
          amount: damageBonus,
        });
      }

      if (costReduction !== 0) {
        const currentCost = card.getCurrentCost ? card.getCurrentCost() : (card.baseCost ?? 0);
        card.costOverride = Math.max(0, currentCost - costReduction);
      }
    });
  },
  TRANSFORM_SELECTED_CARD: (context, effect) => {
    const deckOwner = context.source?.deck ?? context.target?.deck ?? null;
    if (!deckOwner) return;

    const targetCardId = effect.targetCardId ?? effect.value?.targetCardId ?? null;
    if (!targetCardId) return;

    const definition = getCardDefinition(targetCardId);
    if (!definition) return;

    const selectionIds = getSelectionIds(context, effect);
    selectionIds.forEach((instanceId) => {
      const card = deckOwner.getCardInHand(instanceId);
      if (!card) return;

      card.definitionId = definition.id;
      card.name = definition.name;
      card.description = definition.description;
      card.image = definition.image;
      card.rarity = definition.rarity;
      card.targets = definition.targets;
      card.targeting = definition.targeting ? structuredClone(definition.targeting) : null;
      card.effects = structuredClone(definition.effects ?? []);
      card.tags = [...(definition.tags ?? [])];
      card.baseCost = definition.energy_cost ?? 0;
      card.costOverride = null;
      card.exhaust = definition.exhaust ?? false;
      card.temporary = definition.temporary ?? false;
      card.retain = definition.retain ?? false;
      card.charges = definition.charges ?? null;
    });
  },
  DISCARD_SELECTED_CARDS: (context, effect) => {
    const deckOwner = context.source?.deck ?? context.target?.deck ?? null;
    if (!deckOwner) return;

    const selectionIds = getSelectionIds(context, effect);

    selectionIds.forEach((instanceId) => {
      deckOwner.discardFromHand(instanceId);
    });
  },
  APPLY_OPTION_EFFECTS: (context, effect) => {
    const options = context.pendingInteraction?.options ?? [];
    const selectionId = Array.isArray(context.selectionIds) ? context.selectionIds[0] : null;
    if (!selectionId) return;

    const chosen = options.find((option) => option.id === selectionId);
    if (!chosen || !Array.isArray(chosen.effects)) return;

    chosen.effects.forEach((innerEffect) => resolveEffect(context, innerEffect));
  },
};

export function registerEffectHandler(type, handler) {
  effectHandlers[type] = handler;
}

export function getEffectHandler(type) {
  return effectHandlers[type] ?? null;
}

export function resolveEffect(context, effect) {
  getEffectSchema(effect.type);
  const handler = getEffectHandler(effect.type);
  if (!handler) return false;

  handler(context, effect);
  return true;
}
