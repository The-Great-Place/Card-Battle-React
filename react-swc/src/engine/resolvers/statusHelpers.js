import { getStatusDefinition } from "../definitions/statusRegistry";
import { createStatusInstance } from "../models/StatusInstance";

function normalizeStatusInput(statusInput) {
  if (typeof statusInput === "string") {
    return { definitionId: statusInput };
  }

  return { ...statusInput };
}

function findStackableStatus(owner, definitionId) {
  return owner.statuses.find((status) => status.definitionId === definitionId) ?? null;
}

export function applyStatus(owner, statusInput) {
  if (!owner) return null;

  const normalizedStatus = normalizeStatusInput(statusInput);
  const definition = getStatusDefinition(normalizedStatus.definitionId);
  const stacking = normalizedStatus.stacking ?? definition?.stacking ?? "separate_instances";

  if (stacking !== "separate_instances") {
    const existing = findStackableStatus(owner, normalizedStatus.definitionId);
    if (existing) {
      if (stacking === "amount") {
        existing.amount = (existing.amount ?? 0) + (normalizedStatus.amount ?? normalizedStatus.stacks ?? 0);
      } else if (stacking === "duration") {
        existing.duration = (existing.duration ?? 0) + (normalizedStatus.duration ?? normalizedStatus.amount ?? 0);
      } else if (stacking === "replace") {
        Object.assign(existing, normalizedStatus);
      }

      return existing;
    }
  }

  const status = createStatusInstance({
    ...normalizedStatus,
    ownerId: normalizedStatus.ownerId ?? owner.id,
  });

  owner.statuses.push(status);
  return status;
}

export function removeStatus(owner, statusInstanceId) {
  if (!owner || !statusInstanceId) return null;

  const index = owner.statuses.findIndex((status) => status.instanceId === statusInstanceId);
  if (index < 0) return null;

  const [removedStatus] = owner.statuses.splice(index, 1);
  return removedStatus ?? null;
}

export function getStatusesByDefinition(owner, definitionId) {
  if (!owner || !definitionId) return [];
  return owner.statuses.filter((status) => status.definitionId === definitionId);
}

export function getFirstStatusByDefinition(owner, definitionId) {
  return getStatusesByDefinition(owner, definitionId)[0] ?? null;
}

export function getStatusAmount(owner, definitionId) {
  return getStatusesByDefinition(owner, definitionId).reduce((total, status) => {
    return total + (status.amount ?? status.stacks ?? 0);
  }, 0);
}

export function getStatusDuration(owner, definitionId) {
  return getStatusesByDefinition(owner, definitionId).reduce((total, status) => {
    return total + (status.duration ?? status.amount ?? 0);
  }, 0);
}

export function getStatusMaxDuration(owner, definitionId) {
  return getStatusesByDefinition(owner, definitionId).reduce((maxDuration, status) => {
    return Math.max(maxDuration, status.duration ?? status.amount ?? 0);
  }, 0);
}

export function hasStatus(owner, definitionId) {
  return getStatusesByDefinition(owner, definitionId).length > 0;
}

export function setStatusAmount(owner, definitionId, amount) {
  if (!owner || !definitionId) return null;

  const statuses = getStatusesByDefinition(owner, definitionId);
  if (statuses.length === 0) return null;

  const normalizedAmount = Math.max(0, amount ?? 0);

  statuses[0].amount = normalizedAmount;
  for (let index = statuses.length - 1; index >= 1; index -= 1) {
    removeStatus(owner, statuses[index].instanceId);
  }

  if (normalizedAmount === 0) {
    removeStatus(owner, statuses[0].instanceId);
    return null;
  }

  return statuses[0];
}

export function setStatusDuration(owner, definitionId, duration) {
  if (!owner || !definitionId) return null;

  const statuses = getStatusesByDefinition(owner, definitionId);
  if (statuses.length === 0) return null;

  const normalizedDuration = Math.max(0, duration ?? 0);

  statuses[0].duration = normalizedDuration;
  for (let index = statuses.length - 1; index >= 1; index -= 1) {
    removeStatus(owner, statuses[index].instanceId);
  }

  if (normalizedDuration === 0) {
    removeStatus(owner, statuses[0].instanceId);
    return null;
  }

  return statuses[0];
}

export function clearStatuses(owner, definitionId) {
  if (!owner || !definitionId) return [];

  const statuses = getStatusesByDefinition(owner, definitionId);
  statuses.forEach((status) => removeStatus(owner, status.instanceId));
  return statuses;
}

export function consumeStatusAmount(owner, definitionId, amount = 1) {
  const status = getFirstStatusByDefinition(owner, definitionId);
  if (!status) return null;

  const nextAmount = Math.max(0, (status.amount ?? 0) - amount);
  status.amount = nextAmount;

  if (nextAmount === 0) {
    removeStatus(owner, status.instanceId);
    return null;
  }

  return status;
}

export function tickStatusDurations(owner, definitionId, decrement = 1) {
  if (!owner || !definitionId) return [];

  const statuses = getStatusesByDefinition(owner, definitionId);
  const updatedStatuses = [];

  statuses.forEach((status) => {
    const nextDuration = Math.max(0, (status.duration ?? 0) - decrement);
    status.duration = nextDuration;

    if (nextDuration === 0) {
      removeStatus(owner, status.instanceId);
      return;
    }

    updatedStatuses.push(status);
  });

  return updatedStatuses;
}
