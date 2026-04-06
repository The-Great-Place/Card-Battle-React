import { getPlayableCardIds } from "./battleCardQueries";
import { getCardPlayState, getVisibleInteraction } from "./battleInteractionQueries";
import { getPlayer, isInteractionLocked } from "./battleQueryShared";

export function getBattleOverlayState(gameState) {
  return {
    lootOpen: Boolean(gameState?.lootOpen),
    pendingLoot: gameState?.pendingLoot ?? [],
    runComplete: Boolean(gameState?.runComplete),
    runFailed: Boolean(gameState?.runFailed),
  };
}

export function getBattleViewModel(gameState, selectedCardId = null, selectedTargetIds = []) {
  const player = getPlayer(gameState);
  const currentEnemies = gameState?.currentEnemies ?? [];
  const playableCardIds = new Set(getPlayableCardIds(gameState));
  const visibleInteraction = getVisibleInteraction(gameState, selectedCardId, selectedTargetIds);
  const playState = selectedCardId
    ? getCardPlayState(gameState, selectedCardId, selectedTargetIds)
    : null;
  const normalizedSelectedTargetIds = visibleInteraction.selectedTargetIds ?? [];
  const legalTargetIds = new Set(visibleInteraction.legalTargetIds ?? []);
  const interactionCardTargets = visibleInteraction.legalCardIds ?? [];
  const hasPendingInteraction = Boolean(gameState?.pendingInteraction);

  return {
    header: {
      turn: gameState?.turn ?? 0,
      isPlayerTurn: Boolean(gameState?.playerTurn),
      canEndTurn: Boolean(gameState?.playerTurn) && !isInteractionLocked(gameState),
    },
    interaction: visibleInteraction,
    actionButton: {
      label: visibleInteraction.actionLabel ?? "Play Card",
      disabled: !visibleInteraction.canConfirm,
      visible: Boolean(selectedCardId) || hasPendingInteraction,
    },
    player: player
      ? {
          entity: player,
          isSelected: normalizedSelectedTargetIds.includes(player.id),
          isLegalTarget: legalTargetIds.has(player.id),
        }
      : null,
    enemies: currentEnemies.map((enemy) => ({
      entity: enemy,
      isSelected: normalizedSelectedTargetIds.includes(enemy.id),
      isLegalTarget: legalTargetIds.has(enemy.id),
    })),
    hand: (player?.deck?.hand ?? []).map((card) => ({
      card,
      isPlayable: playableCardIds.has(card.instanceId),
      isSelected: card.instanceId === selectedCardId,
      isInteractionTarget: interactionCardTargets.includes(card.instanceId),
    })),
    selectedCard: playState?.card ?? null,
    selectedCardId,
    selectedTargetIds: normalizedSelectedTargetIds,
    overlays: getBattleOverlayState(gameState),
  };
}
