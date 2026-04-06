import { beforeEach, describe, expect, it } from "vitest";

import {
  getCardDefinition,
  setCardDefinitions,
} from "./cardRegistry";

describe("cardRegistry Phase 6 targeting normalization", () => {
  beforeEach(() => {
    setCardDefinitions({});
  });

  it("derives self targeting for legacy self-target cards", () => {
    setCardDefinitions({
      CHARGE: {
        id: "CHARGE",
        name: "Charge",
        targets: 0,
        effects: [{ type: "APPLY_STACK", target: "self", value: 1 }],
      },
    });

    expect(getCardDefinition("CHARGE")).toMatchObject({
      id: "CHARGE",
      targeting: {
        selector: "self",
        required: true,
      },
    });
  });

  it("derives enemy targeting counts for legacy enemy-target cards", () => {
    setCardDefinitions({
      FIREBALL: {
        id: "FIREBALL",
        name: "Fireball",
        targets: 2,
        effects: [{ type: "DAMAGE", target: "target", value: 4 }],
      },
    });

    expect(getCardDefinition("FIREBALL")).toMatchObject({
      id: "FIREBALL",
      targeting: {
        selector: "enemy",
        count: 2,
        required: true,
      },
    });
  });

  it("preserves explicit targeting rules that are already migrated", () => {
    setCardDefinitions({
      METAMORPHOSIS: {
        id: "METAMORPHOSIS",
        name: "Metamorphosis",
        targets: 0,
        targeting: {
          selector: "self",
          required: true,
        },
        effects: [{ type: "BEGIN_INTERACTION" }],
      },
    });

    expect(getCardDefinition("METAMORPHOSIS")).toMatchObject({
      targeting: {
        selector: "self",
        required: true,
      },
    });
  });
});
