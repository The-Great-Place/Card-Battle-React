function getPlayerEntity(gameState) {
  return gameState?.player ?? null;
}

function getAliveEnemies(gameState) {
  const enemies = gameState?.currentEnemies ?? [];
  return enemies.filter((enemy) => enemy?.alive);
}

function getAllyEntities(gameState) {
  const player = getPlayerEntity(gameState);
  return player && player.alive ? [player] : [];
}

function pickRandomTargets(entities, count) {
  if (!Array.isArray(entities) || entities.length === 0) return [];
  const limited = Math.min(count ?? 1, entities.length);
  const pool = [...entities];
  const chosen = [];

  while (chosen.length < limited && pool.length > 0) {
    const index = Math.floor(Math.random() * pool.length);
    chosen.push(pool[index]);
    pool.splice(index, 1);
  }

  return chosen;
}

export function normalizeTargetingRule(card) {
  if (card?.targeting) return { ...card.targeting };

  const legacyTargets = card?.targets ?? null;
  if (legacyTargets == null) {
    return { selector: "self" };
  }

  if (legacyTargets === 0) {
    return { selector: "self" };
  }

  return {
    selector: "enemy",
    count: legacyTargets,
    required: true,
  };
}

export function getTargetingRule(card) {
  return normalizeTargetingRule(card);
}

export function getTargetingLimits(rule, bonusTargets = 0) {
  const requiredBase = rule?.count ?? rule?.min ?? (rule?.required ? 1 : 0);
  const maxBase = rule?.max ?? rule?.count ?? requiredBase;

  const min = Math.max(0, (requiredBase ?? 0) + bonusTargets);
  const max = Math.max(0, (maxBase ?? 0) + bonusTargets);

  return {
    minTargets: min,
    maxTargets: max,
    required: rule?.required ?? min > 0,
  };
}

export function getLegalTargetsForRule(gameState, rule) {
  const player = getPlayerEntity(gameState);
  const aliveEnemies = getAliveEnemies(gameState);
  const allies = getAllyEntities(gameState);

  switch (rule?.selector) {
    case "self":
    case "ally":
      return player && player.alive ? [player] : [];
    case "all_allies":
      return allies;
    case "enemy":
    case "random_enemy":
      return aliveEnemies;
    case "all_enemies":
      return aliveEnemies;
    case "random_allies":
      return allies;
    case "all_entities":
      return [
        ...(player && player.alive ? [player] : []),
        ...aliveEnemies,
      ];
    default:
      return aliveEnemies;
  }
}

export function shouldAutoTarget(rule) {
  if (!rule?.selector) return false;
  return (
    rule.selector === "self" ||
    rule.selector === "ally" ||
    rule.selector === "all_allies" ||
    rule.selector === "all_enemies" ||
    rule.selector === "all_entities"
  );
}

export function isRandomSelector(rule) {
  if (!rule?.selector) return false;
  return rule.selector === "random_enemy" || rule.selector === "random_allies";
}

export function resolveTargetsForPlay(gameState, rule, selectedTargetIds = []) {
  const legalTargets = getLegalTargetsForRule(gameState, rule);
  const idToEntity = new Map((legalTargets ?? []).map((entity) => [entity.id, entity]));
  const limits = getTargetingLimits(rule);

  if (isRandomSelector(rule)) {
    const count = rule?.count ?? limits.maxTargets ?? 1;
    return pickRandomTargets(legalTargets, count);
  }

  if (shouldAutoTarget(rule)) {
    return legalTargets;
  }

  const trimmedSelection = (selectedTargetIds ?? [])
    .map((id) => idToEntity.get(id))
    .filter(Boolean);
  const maxSelection = limits.maxTargets > 0 ? limits.maxTargets : trimmedSelection.length;

  return trimmedSelection.slice(-maxSelection);
}
