let activeCardDefinitions = {};

function cloneEffects(effects) {
  return Array.isArray(effects) ? effects.map((effect) => ({ ...effect })) : [];
}

function cloneTags(tags) {
  return Array.isArray(tags) ? [...tags] : [];
}

function normalizeTargeting(definition) {
  if (definition?.targeting) {
    return { ...definition.targeting };
  }

  if (definition?.targets == null || definition.targets === 0) {
    return {
      selector: "self",
      required: true,
    };
  }

  return {
    selector: "enemy",
    count: definition.targets,
    required: true,
  };
}

export function normalizeCardDefinition(definition) {
  if (!definition?.id) return null;

  return {
    ...definition,
    targeting: normalizeTargeting(definition),
    effects: cloneEffects(definition.effects),
    tags: cloneTags(definition.tags),
  };
}

function normalizeCardDefinitions(definitions) {
  return Object.fromEntries(
    Object.entries(definitions ?? {})
      .map(([cardId, definition]) => {
        const normalizedDefinition = normalizeCardDefinition({
          id: definition?.id ?? cardId,
          ...definition,
        });

        return normalizedDefinition ? [cardId, normalizedDefinition] : null;
      })
      .filter(Boolean),
  );
}

export function getCardDefinition(cardId) {
  return activeCardDefinitions[cardId] ?? null;
}

export function getAllCardDefinitions() {
  return { ...activeCardDefinitions };
}

export function setCardDefinitions(definitions) {
  activeCardDefinitions = normalizeCardDefinitions(definitions);
  return getAllCardDefinitions();
}

export function mergeCardDefinitions(definitions) {
  activeCardDefinitions = {
    ...activeCardDefinitions,
    ...normalizeCardDefinitions(definitions),
  };

  return getAllCardDefinitions();
}

export async function loadCardDefinitions(loader) {
  const definitions = await loader();
  return setCardDefinitions(definitions);
}
