import {
  canPlayCard,
  getCardCost,
  getLegalTargetIds,
  getLegalTargets,
  getTargetingLimitsForCard,
  getTargetingRule,
} from "./battleCardQueries";
import { getHandCard, getPlayer, isInteractionLocked } from "./battleQueryShared";
import { shouldAutoTarget } from "../resolvers/targetingResolver";

export function getAutoTargetIds(gameState, cardInstanceId) {
  const card = getHandCard(gameState, cardInstanceId);
  const player = getPlayer(gameState);
  if (!card || !player) return [];

  const rule = getTargetingRule(card);
  const legalTargets = getLegalTargets(gameState, cardInstanceId);
  const limits = getTargetingLimitsForCard(player, card);

  if (shouldAutoTarget(rule)) {
    return legalTargets.map((target) => target.id);
  }

  return legalTargets.length === 1 && limits.minTargets <= 1
    ? legalTargets.map((target) => target.id)
    : [];
}

export function getSelectedTargetValidity(gameState, cardInstanceId, selectedTargetIds = []) {
  const card = getHandCard(gameState, cardInstanceId);
  const player = getPlayer(gameState);
  if (!card || !player) {
    return {
      selectedTargetIds: [],
      validSelectedTargetIds: [],
      requiredTargets: 0,
      hasRequiredTargets: false,
    };
  }

  const limits = getTargetingLimitsForCard(player, card);
  const legalTargetIds = new Set(getLegalTargetIds(gameState, cardInstanceId));
  const validSelectedTargetIds = (selectedTargetIds ?? []).filter((targetId) => legalTargetIds.has(targetId));
  const autoTargetIds = getAutoTargetIds(gameState, cardInstanceId);
  const trimmedSelectedTargetIds =
    limits.maxTargets > 0
      ? validSelectedTargetIds.slice(-limits.maxTargets)
      : autoTargetIds;

  return {
    selectedTargetIds: trimmedSelectedTargetIds,
    validSelectedTargetIds,
    requiredTargets: limits.minTargets,
    hasRequiredTargets: trimmedSelectedTargetIds.length >= limits.minTargets,
  };
}

export function getCardPlayState(gameState, cardInstanceId, selectedTargetIds = []) {
  const player = getPlayer(gameState);
  const card = getHandCard(gameState, cardInstanceId);
  const playable = canPlayCard(gameState, cardInstanceId);
  const legalTargets = getLegalTargets(gameState, cardInstanceId);
  const legalTargetIds = legalTargets.map((target) => target.id);
  const {
    selectedTargetIds: normalizedSelectedTargetIds,
    requiredTargets,
    hasRequiredTargets,
  } = getSelectedTargetValidity(gameState, cardInstanceId, selectedTargetIds);

  return {
    card,
    playable,
    cost: card && player ? getCardCost(player, card) : null,
    legalTargets,
    legalTargetIds,
    requiredTargets,
    selectedTargetIds: normalizedSelectedTargetIds,
    autoTargetIds: getAutoTargetIds(gameState, cardInstanceId),
    canPlay: playable && hasRequiredTargets,
  };
}

export function canPlaySelectedCard(gameState, selectedCard, selectedTargetIds) {
  const cardInstanceId = selectedCard?.instanceId ?? selectedCard?.card?.instanceId ?? null;
  if (!cardInstanceId) return false;
  return getCardPlayState(gameState, cardInstanceId, selectedTargetIds).canPlay;
}

export function getVisibleInteraction(gameState, selectedCardId = null, selectedTargetIds = []) {
  const pendingInteraction = gameState?.pendingInteraction ?? null;
  if (pendingInteraction) {
    const legalEntityIds = pendingInteraction.validEntityIds ?? [];
    const legalCardIds = pendingInteraction.validCardInstanceIds ?? [];
    const selectedIds = pendingInteraction.selectedTargetIds ?? [];
    const minTargets = pendingInteraction.minSelections ?? 0;
    const maxTargets = pendingInteraction.maxSelections ?? Math.max(
      legalEntityIds.length,
      legalCardIds.length
    );

    return {
      type: pendingInteraction.type ?? "interaction",
      actionLabel: pendingInteraction.actionLabel ?? "Confirm",
      selectedCardId: null,
      selectedTargetIds: selectedIds,
      legalTargetIds: legalEntityIds,
      legalCardIds: legalCardIds,
      requiredTargets: minTargets,
      selector: pendingInteraction.selector ?? null,
      minTargets,
      maxTargets,
      canConfirm: selectedIds.length >= minTargets,
      options: pendingInteraction.options ?? [],
    };
  }

  if (!selectedCardId || isInteractionLocked(gameState)) {
    return {
      type: "idle",
      actionLabel: "Play Card",
      selectedCardId: null,
      selectedTargetIds: [],
      legalTargetIds: [],
      canConfirm: false,
      minTargets: 0,
      maxTargets: 0,
      selector: null,
    };
  }

  const player = getPlayer(gameState);
  const card = getHandCard(gameState, selectedCardId);
  const rule = card ? getTargetingRule(card) : null;
  const limits = player && card ? getTargetingLimitsForCard(player, card) : { minTargets: 0, maxTargets: 0 };

  const playState = getCardPlayState(gameState, selectedCardId, selectedTargetIds);

  return {
    type: "play_card",
    actionLabel: "Play Card",
    selectedCardId,
    selectedTargetIds: playState.selectedTargetIds,
    legalTargetIds: playState.legalTargetIds,
    requiredTargets: playState.requiredTargets,
    selector: rule?.selector ?? null,
    minTargets: limits.minTargets,
    maxTargets: limits.maxTargets,
    canConfirm: playState.canPlay,
  };
}
