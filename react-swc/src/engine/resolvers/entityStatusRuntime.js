import {
  getStatusAmount,
  getStatusDuration,
  hasStatus,
  setStatusAmount,
} from "./statusHelpers";
import {
  getStatusAmountByTriggerType,
  getStatusDurationValue,
  getStatusEntriesByEvent,
  getStatusMagnitude,
} from "./statusBehavior";

function consumeStatusTrigger(entity, status, trigger) {
  if (!entity || !status || !trigger) return;

  const consumeBehavior = trigger.consume ?? null;
  if (!consumeBehavior) return;

  if (consumeBehavior === "clear_all") {
    entity.removeStatus(status.instanceId);
    return;
  }

  if (consumeBehavior === "duration") {
    const nextDuration = getStatusDurationValue(status, 1) - 1;
    if (nextDuration <= 0) {
      entity.removeStatus(status.instanceId);
    } else {
      status.duration = nextDuration;
    }
    return;
  }
}

function resolveStatusTrigger(entity, status, trigger) {
  if (!entity || !status || !trigger?.type) return;

  switch (trigger.type) {
    case "burn": {
      const amount = getStatusMagnitude(status, 0);
      if (amount > 0) {
        entity.takeDamage(amount, status.definitionId);
        if (trigger.decay === "halve") {
          status.amount = Math.floor(amount / 2);
          if (status.amount <= 0) {
            entity.removeStatus(status.instanceId);
          }
        }
      }
      break;
    }
    case "regen": {
      const healPerStack = trigger.healPerStack ?? 0;
      const regenAmount = getStatusMagnitude(status, 1);
      entity.modifyHealth(regenAmount * healPerStack);
      consumeStatusTrigger(entity, status, trigger);
      break;
    }
    case "decay_half_unless": {
      const blockerId = trigger.unlessStatus ?? null;
      const blockerPresent = blockerId ? hasStatus(entity, blockerId) : false;
      if (!blockerPresent) {
        const amount = getStatusMagnitude(status, 0);
        status.amount = Math.floor(amount / 2);
        if (status.amount <= 0) {
          entity.removeStatus(status.instanceId);
        }
      }
      break;
    }
    case "duration_decay": {
      const nextDuration = getStatusDurationValue(status, 0) - 1;
      if (nextDuration <= 0) {
        entity.removeStatus(status.instanceId);
      } else {
        status.duration = nextDuration;
      }
      break;
    }
    case "clear_self": {
      consumeStatusTrigger(entity, status, trigger);
      break;
    }
    default:
      break;
  }
}

function getStatusEventEntries(entity, event) {
  if (!entity || !event) return [];
  const statuses = Array.isArray(entity.statuses) ? [...entity.statuses] : [];
  return getStatusEntriesByEvent(statuses, event);
}

function consumeStatusEntries(entity, entries) {
  entries.forEach(({ status, trigger }) => {
    consumeStatusTrigger(entity, status, trigger);
  });
}

export function resolveDamageWithStatuses(entity, amount) {
  const shieldAmount = getStatusAmount(entity, "shield");

  if (shieldAmount >= amount) {
    setStatusAmount(entity, "shield", shieldAmount - amount);
  } else {
    setStatusAmount(entity, "shield", 0);
    entity.health -= amount - shieldAmount;
  }

  return entity.health;
}

export function processTurnStatuses(entity) {
  if (!entity) return;

  getStatusEventEntries(entity, "turn_end").forEach(({ status, trigger }) => {
    resolveStatusTrigger(entity, status, trigger);
  });
}

export function getNextTurnShieldValue(entity) {
  const shieldAmount = getStatusAmount(entity, "shield");
  const fortifyDuration = getStatusDuration(entity, "fortify");
  return fortifyDuration > 0 ? shieldAmount : Math.floor(shieldAmount / 2);
}

export function prepareEffectWithStatuses(entity, effect) {
  const beforeEffectEntries = getStatusEventEntries(entity, "before_effect");

  const freezeBehavior = beforeEffectEntries.find(
    (entry) => entry.trigger.type === "freeze_threshold_skip"
  );
  if (freezeBehavior) {
    const threshold = freezeBehavior.trigger.threshold ?? 3;
    const amount = getStatusMagnitude(freezeBehavior.status, 0);
    if (amount === threshold) {
      effect.type = "NULL";
      return effect;
    }
  }

  if (effect.type === "DAMAGE") {
    let addedDamage = 0;
    let damageMultiplier = 1;
    const toConsume = [];

    beforeEffectEntries.forEach(({ status, trigger }) => {
      if (!trigger?.type) return;

      if (trigger.type === "add_damage") {
        addedDamage += getStatusMagnitude(status, 0);
      }

      if (trigger.type === "multiply_damage") {
        damageMultiplier *= 1 + getStatusMagnitude(status, 0);
      }

      if (trigger.consume) {
        toConsume.push({ status, trigger });
      }
    });

    effect.value += addedDamage;
    effect.value *= damageMultiplier;
    consumeStatusEntries(entity, toConsume);
  }

  return effect;
}

export function consumePlayerPlayStatuses(player) {
  const preparationBonus = getStatusAmountByTriggerType(player, "card_play", "extra_plays");
  const cardPlayEntries = getStatusEventEntries(player, "card_play");
  consumeStatusEntries(player, cardPlayEntries);

  return 1 + preparationBonus;
}
