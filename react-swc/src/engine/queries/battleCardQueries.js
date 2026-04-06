import { getStatusAmountByPlayBehavior } from "../resolvers/statusBehavior";
import {
  getLegalTargetsForRule,
  getTargetingLimits,
  normalizeTargetingRule,
} from "../resolvers/targetingResolver";
import { getHandCard, getPlayer } from "./battleQueryShared";

export function getCardCost(player, card) {
  const baseCost = card?.getCurrentCost ? card.getCurrentCost() : (card?.energy_cost ?? card?.baseCost ?? 0);
  const reduction = getStatusAmountByPlayBehavior(player, "cost_reduction");
  const modifierAdjustments = card?.getModifiersByKind
    ? card.getModifiersByKind("cost_adjustment").reduce((total, modifier) => {
        return total + (modifier.amount ?? 0);
      }, 0)
    : 0;
  return Math.max(0, baseCost - reduction + modifierAdjustments);
}

export function getTargetingRule(card) {
  return normalizeTargetingRule(card);
}

export function getTargetingLimitsForCard(player, card) {
  const bonusTargets = getStatusAmountByPlayBehavior(player, "extra_targets");
  return getTargetingLimits(getTargetingRule(card), bonusTargets);
}

export function getRequiredTargetCount(player, card) {
  const limits = getTargetingLimitsForCard(player, card);
  return limits.minTargets;
}

export function getLegalTargets(gameState, cardInstanceId) {
  const player = getPlayer(gameState);
  const card = getHandCard(gameState, cardInstanceId);

  if (!player || !card) return [];

  const rule = getTargetingRule(card);
  return getLegalTargetsForRule(gameState, rule);
}

export function getLegalTargetIds(gameState, cardInstanceId) {
  return getLegalTargets(gameState, cardInstanceId).map((entity) => entity.id);
}

export function canPlayCard(gameState, cardInstanceId) {
  const player = getPlayer(gameState);
  if (!player || !cardInstanceId) return false;
  if (!gameState.playerTurn || gameState.lootOpen || gameState.runComplete || gameState.runFailed) return false;

  const card = getHandCard(gameState, cardInstanceId);
  if (!card) return false;

  return player.energy >= getCardCost(player, card);
}

export function getPlayableCards(gameState) {
  const hand = getPlayer(gameState)?.deck?.hand ?? [];
  return hand.filter((card) => canPlayCard(gameState, card.instanceId));
}

export function getPlayableCardIds(gameState) {
  return getPlayableCards(gameState).map((card) => card.instanceId);
}
