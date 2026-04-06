export class StatusInstance {
  constructor({
    instanceId = crypto.randomUUID(),
    definitionId,
    ownerId,
    sourceEntityId = null,
    sourceCardInstanceId = null,
    stacks = null,
    duration = null,
    amount = null,
    state = {},
    modifiers = [],
  }) {
    this.instanceId = instanceId;
    this.definitionId = definitionId;
    this.ownerId = ownerId;
    this.sourceEntityId = sourceEntityId;
    this.sourceCardInstanceId = sourceCardInstanceId;
    this.stacks = stacks;
    this.duration = duration;
    this.amount = amount;
    this.state = { ...state };
    this.modifiers = [...modifiers];
  }
}

export function createStatusInstance(config) {
  return new StatusInstance(config);
}
