export function getCardCost(player, card) {
  const baseCost = card?.getCurrentCost ? card.getCurrentCost() : (card?.energy_cost ?? card?.baseCost ?? 0);
  const reduction = player?.costReduction?.[0] ?? 0;
  return Math.max(0, baseCost - reduction);
}

export function canPlayCard(gameState, cardInstanceId) {
  const player = gameState?.player;
  if (!player || !cardInstanceId) return false;
  if (!gameState.playerTurn || gameState.lootOpen || gameState.runComplete || gameState.runFailed) return false;

  const card = player.deck.getCardInHand(cardInstanceId);
  if (!card) return false;

  return player.energy >= getCardCost(player, card);
}

export function getRequiredTargetCount(player, card) {
  const baseTargets = card?.targets ?? 0;
  const bonusTargets = player?.stack?.multiselect ?? 0;
  return Math.max(0, baseTargets + bonusTargets);
}

export function canPlaySelectedCard(gameState, selectedCard, selectedTargetIds) {
  if (!selectedCard?.instanceId) return false;
  if (!canPlayCard(gameState, selectedCard.instanceId)) return false;

  const card = gameState.player.deck.getCardInHand(selectedCard.instanceId);
  if (!card) return false;

  const requiredTargets = getRequiredTargetCount(gameState.player, card);
  return (selectedTargetIds?.length ?? 0) >= requiredTargets;
}

export function getPlayableCards(gameState) {
  const hand = gameState?.player?.deck?.hand ?? [];
  return hand.filter((card) => canPlayCard(gameState, card.instanceId));
}
