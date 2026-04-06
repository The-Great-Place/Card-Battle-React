let activeInteractionController = null;

function sanitizeInteractionPayload(interaction, context) {
  const defaultSource = context.card
    ? { kind: "card", id: context.card?.instanceId ?? "unknown" }
    : context.source
    ? { kind: "entity", id: context.source?.id ?? "unknown" }
    : { kind: "system", id: "system" };

    return {
      id: interaction.id ?? crypto.randomUUID(),
      type: interaction.type ?? "select_cards",
      source: interaction.source ?? defaultSource,
      actionLabel: interaction.actionLabel ?? "Confirm",
      minSelections: interaction.minSelections ?? 0,
      maxSelections: interaction.maxSelections ?? interaction.minSelections ?? 0,
      selector: interaction.selector ?? null,
      validEntityIds: Array.isArray(interaction.validEntityIds)
        ? [...interaction.validEntityIds]
        : [],
      validCardInstanceIds: Array.isArray(interaction.validCardInstanceIds)
        ? [...interaction.validCardInstanceIds]
        : [],
      validOptionIds: Array.isArray(interaction.options)
        ? interaction.options.map((option) => option.id).filter(Boolean)
        : [],
      options: Array.isArray(interaction.options) ? [...interaction.options] : [],
      payload: interaction.payload ? { ...interaction.payload } : {},
      onConfirm: Array.isArray(interaction.onConfirm) ? [...interaction.onConfirm] : [],
      onCancel: Array.isArray(interaction.onCancel) ? [...interaction.onCancel] : [],
    selectedTargetIds: Array.isArray(interaction.selectedTargetIds)
      ? [...interaction.selectedTargetIds]
      : [],
  };
}

export class InteractionController {
  constructor(gameState) {
    this.gameState = gameState;
    registerInteractionController(this);
  }

  beginInteraction(interaction, context = {}) {
    if (!interaction) return null;

    const pending = sanitizeInteractionPayload(interaction, context);
    this.gameState.pendingInteraction = pending;
    return pending;
  }

  updateSelection(selectionIds = []) {
    if (!this.gameState.pendingInteraction) return null;

    const deduped = Array.from(new Set(selectionIds ?? []));
    this.gameState.pendingInteraction = {
      ...this.gameState.pendingInteraction,
      selectedTargetIds: deduped,
    };

    return this.gameState.pendingInteraction;
  }

  confirmInteraction(selectionIds = []) {
    if (!this.gameState.pendingInteraction) return null;

    const pending = this.gameState.pendingInteraction;
    this.gameState.pendingInteraction = null;
    return {
      pending,
      selectionIds: Array.isArray(selectionIds) ? [...selectionIds] : [],
    };
  }

  cancelInteraction() {
    const pending = this.gameState.pendingInteraction;
    this.gameState.pendingInteraction = null;
    return pending;
  }
}

export function registerInteractionController(controller) {
  activeInteractionController = controller;
}

export function getRegisteredInteractionController() {
  return activeInteractionController;
}
