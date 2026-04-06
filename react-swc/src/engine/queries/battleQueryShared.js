export function getPlayer(gameState) {
  return gameState?.player ?? null;
}

export function getHandCard(gameState, cardInstanceId) {
  const player = getPlayer(gameState);
  if (!player || !cardInstanceId) return null;
  return player.deck.getCardInHand(cardInstanceId);
}

export function isInteractionLocked(gameState) {
  return Boolean(
    gameState?.lootOpen ||
      gameState?.runComplete ||
      gameState?.runFailed ||
      gameState?.pendingInteraction
  );
}

export function getAllBattleEntities(gameState) {
  const player = getPlayer(gameState);
  const enemies = gameState?.currentEnemies ?? [];

  return [
    ...(player ? [player] : []),
    ...enemies,
  ];
}
