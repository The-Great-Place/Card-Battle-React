const defaultEffectSchemas = {
  DAMAGE: {
    type: "DAMAGE",
    valueKind: "number_or_formula",
    targeting: "entity",
  },
  HEAL: {
    type: "HEAL",
    valueKind: "number_or_formula",
    targeting: "entity",
  },
  DRAW: {
    type: "DRAW",
    valueKind: "number_or_formula",
    targeting: "entity",
  },
  APPLY_STACK: {
    type: "APPLY_STACK",
    valueKind: "number_or_formula",
    targeting: "entity",
    fields: ["stack_name"],
  },
  REDUCE_NEXT_CARDS_COST: {
    type: "REDUCE_NEXT_CARDS_COST",
    valueKind: "number_or_formula",
    targeting: "entity",
    fields: ["charges"],
  },
  CREATE_TEMP_CARD_IN_HAND: {
    type: "CREATE_TEMP_CARD_IN_HAND",
    valueKind: "object",
    targeting: "entity",
    fields: ["value.cardId", "value.count", "value.modifiers"],
  },
  APPLY_MODIFIER: {
    type: "APPLY_MODIFIER",
    valueKind: "object",
    targeting: "card",
    fields: ["modifier"],
  },
  APPLY_MODIFIER_WITH_USES: {
    type: "APPLY_MODIFIER_WITH_USES",
    valueKind: "object",
    targeting: "card",
    fields: ["modifier", "uses"],
  },
  APPLY_MODIFIER_WITH_DURATION: {
    type: "APPLY_MODIFIER_WITH_DURATION",
    valueKind: "object",
    targeting: "card",
    fields: ["modifier", "duration"],
  },
  BEGIN_INTERACTION: {
    type: "BEGIN_INTERACTION",
    valueKind: "object",
    targeting: "system",
    fields: ["interaction"],
  },
  UPGRADE_SELECTED_CARD: {
    type: "UPGRADE_SELECTED_CARD",
    valueKind: "object",
    targeting: "entity",
    fields: ["upgrade"],
  },
  TRANSFORM_SELECTED_CARD: {
    type: "TRANSFORM_SELECTED_CARD",
    valueKind: "object",
    targeting: "entity",
    fields: ["targetCardId"],
  },
  APPLY_OPTION_EFFECTS: {
    type: "APPLY_OPTION_EFFECTS",
    valueKind: "object",
    targeting: "entity",
  },
  DISCARD_SELECTED_CARDS: {
    type: "DISCARD_SELECTED_CARDS",
    valueKind: "object",
    targeting: "entity",
    fields: ["selectionIds"],
  },
};

let activeEffectSchemas = { ...defaultEffectSchemas };

export function getEffectSchema(type) {
  return activeEffectSchemas[type] ?? null;
}

export function getAllEffectSchemas() {
  return { ...activeEffectSchemas };
}

export function setEffectSchemas(schemas) {
  activeEffectSchemas = { ...(schemas ?? {}) };
  return getAllEffectSchemas();
}

export function mergeEffectSchemas(schemas) {
  activeEffectSchemas = {
    ...activeEffectSchemas,
    ...(schemas ?? {}),
  };

  return getAllEffectSchemas();
}

export async function loadEffectSchemas(loader) {
  const schemas = await loader();
  return setEffectSchemas(schemas);
}
