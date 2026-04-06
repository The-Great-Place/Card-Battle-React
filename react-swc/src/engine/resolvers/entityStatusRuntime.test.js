import { beforeEach, describe, expect, it } from "vitest";

import { setStatusDefinitions } from "../definitions/statusRegistry";
import {
  consumePlayerPlayStatuses,
  prepareEffectWithStatuses,
  processTurnStatuses,
} from "./entityStatusRuntime";
import { applyStatus, getStatusAmount, getStatusDuration } from "./statusHelpers";
import { getStatusAmountByPlayBehavior } from "./statusBehavior";

function createTestEntity() {
  return {
    id: "entity-1",
    health: 30,
    maxHealth: 30,
    statuses: [],
    removeStatus(statusInstanceId) {
      const index = this.statuses.findIndex((status) => status.instanceId === statusInstanceId);
      if (index >= 0) {
        this.statuses.splice(index, 1);
      }
    },
    takeDamage(amount) {
      this.health -= amount;
    },
    modifyHealth(amount) {
      this.health = Math.min(this.maxHealth, this.health + amount);
    },
  };
}

describe("entityStatusRuntime", () => {
  beforeEach(() => {
    setStatusDefinitions({
      charge: {
        id: "charge",
        stacking: "amount",
        triggers: [
          { event: "before_effect", type: "add_damage" },
          { event: "turn_end", type: "clear_self", consume: "clear_all" },
        ],
      },
      preparation: {
        id: "preparation",
        stacking: "amount",
        triggers: [{ event: "card_play", type: "extra_plays", consume: "clear_all" }],
      },
      costReduction: {
        id: "costReduction",
        stacking: "separate_instances",
        triggers: [{ event: "card_play", type: "cost_reduction", consume: "duration" }],
      },
      shield: {
        id: "shield",
        stacking: "amount",
        triggers: [{ event: "turn_end", type: "decay_half_unless", unlessStatus: "fortify" }],
      },
      fortify: {
        id: "fortify",
        stacking: "duration",
        triggers: [{ event: "turn_end", type: "duration_decay" }],
      },
      regeneration: {
        id: "regeneration",
        stacking: "separate_instances",
        triggers: [{ event: "turn_end", type: "regen", healPerStack: 5, consume: "duration" }],
      },
    });
  });

  it("consumes every separate card-play status instance through one event pass", () => {
    const entity = createTestEntity();
    applyStatus(entity, { definitionId: "preparation", amount: 2 });
    applyStatus(entity, { definitionId: "costReduction", amount: 1, duration: 1 });
    applyStatus(entity, { definitionId: "costReduction", amount: 2, duration: 1 });

    expect(getStatusAmountByPlayBehavior(entity, "extra_plays")).toBe(2);
    expect(getStatusAmountByPlayBehavior(entity, "cost_reduction")).toBe(3);

    const totalPlays = consumePlayerPlayStatuses(entity);

    expect(totalPlays).toBe(3);
    expect(getStatusAmount(entity, "preparation")).toBe(0);
    expect(getStatusAmount(entity, "costReduction")).toBe(0);
  });

  it("uses before-effect triggers and clears charge at turn end through definitions", () => {
    const entity = createTestEntity();
    applyStatus(entity, { definitionId: "charge", amount: 2 });

    const effect = { type: "DAMAGE", value: 4 };
    prepareEffectWithStatuses(entity, effect);

    expect(effect.value).toBe(6);
    expect(getStatusAmount(entity, "charge")).toBe(2);

    processTurnStatuses(entity);

    expect(getStatusAmount(entity, "charge")).toBe(0);
  });

  it("ticks fortify, preserves shield, and decrements regeneration consistently on turn end", () => {
    const entity = createTestEntity();
    entity.health = 20;

    applyStatus(entity, { definitionId: "shield", amount: 8 });
    applyStatus(entity, { definitionId: "fortify", duration: 1 });
    applyStatus(entity, { definitionId: "regeneration", duration: 2 });

    processTurnStatuses(entity);

    expect(getStatusAmount(entity, "shield")).toBe(8);
    expect(getStatusDuration(entity, "fortify")).toBe(0);
    expect(getStatusDuration(entity, "regeneration")).toBe(1);
    expect(entity.health).toBe(25);
  });
});
