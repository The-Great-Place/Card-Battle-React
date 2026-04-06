import { getStatusDefinition } from "../definitions/statusRegistry";

export function getStatusBehavior(definitionId) {
  if (!definitionId) return null;
  const definition = getStatusDefinition(definitionId);
  if (!definition) return null;

  return {
    definition,
    triggers: definition.triggers ?? [],
  };
}

export function getStatusMagnitude(status, fallback = 0) {
  if (!status) return fallback;
  if (status.amount != null) return status.amount;
  if (status.stacks != null) return status.stacks;
  return fallback;
}

export function getStatusDurationValue(status, fallback = 0) {
  if (!status) return fallback;
  if (status.duration != null) return status.duration;
  if (status.amount != null) return status.amount;
  return fallback;
}

export function getStatusEntriesByEvent(statuses, event) {
  if (!Array.isArray(statuses) || !event) return [];

  return statuses.flatMap((status) => {
    const meta = getStatusBehavior(status?.definitionId);
    const triggers = meta?.triggers ?? [];

    return triggers
      .filter((trigger) => trigger.event === event)
      .map((trigger) => ({
        status,
        definition: meta?.definition ?? null,
        trigger,
      }));
  });
}

export function getStatusAmountByPlayBehavior(owner, playType) {
  return getStatusAmountByTriggerType(owner, "card_play", playType);
}

export function getStatusAmountByTriggerType(owner, event, type) {
  if (!owner || !event || !type) return 0;
  const statuses = Array.isArray(owner.statuses) ? owner.statuses : [];

  return getStatusEntriesByEvent(statuses, event).reduce((total, entry) => {
    if (entry.trigger?.type !== type) return total;
    return total + getStatusMagnitude(entry.status, 1);
  }, 0);
}
