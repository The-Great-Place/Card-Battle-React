export class ModifierInstance {
  constructor({
    instanceId = crypto.randomUUID(),
    definitionId = null,
    kind,
    scope = "entity",
    sourceEntityId = null,
    sourceCardInstanceId = null,
    sourceStatusInstanceId = null,
    duration = null,
    remainingUses = null,
    amount = null,
    tags = [],
    state = {},
  }) {
    this.instanceId = instanceId;
    this.definitionId = definitionId;
    this.kind = kind;
    this.scope = scope;
    this.sourceEntityId = sourceEntityId;
    this.sourceCardInstanceId = sourceCardInstanceId;
    this.sourceStatusInstanceId = sourceStatusInstanceId;
    this.duration = duration;
    this.remainingUses = remainingUses;
    this.amount = amount;
    this.tags = [...tags];
    this.state = { ...state };
  }
}

export function createModifierInstance(config) {
  return new ModifierInstance(config);
}
