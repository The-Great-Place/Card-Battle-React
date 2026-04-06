import { getStatusAmount, getStatusDuration, getStatusMaxDuration } from "../resolvers/statusHelpers";
import { getStatusBehavior } from "../resolvers/statusBehavior";

function getStatusMeta(definitionId, fallbackIcon, fallbackLabel) {
  const definition = getStatusBehavior(definitionId)?.definition ?? null;
  return {
    icon: definition?.icon ?? fallbackIcon,
    label: fallbackLabel ?? definition?.name ?? definitionId,
    title: definition?.name ?? fallbackLabel ?? definitionId,
  };
}

function getStatusTrigger(definitionId, type, event = null) {
  const triggers = getStatusBehavior(definitionId)?.triggers ?? [];
  return triggers.find((trigger) => {
    if (event && trigger.event !== event) return false;
    return trigger.type === type;
  }) ?? null;
}

export function getStatusDisplayList(unit) {
  if (!unit) return [];

  const burnAmount = getStatusAmount(unit, "burn");
  const burnMeta = getStatusMeta("burn", "🔥", "");
  const burnTrigger = getStatusTrigger("burn", "burn", "turn_end");
  const burnDecay = burnTrigger?.decay === "halve" ? Math.floor(burnAmount / 2) : burnAmount;
  const chargeAmount = getStatusAmount(unit, "charge");
  const chargeMeta = getStatusMeta("charge", "✨", "Charge");
  const multiselectAmount = getStatusAmount(unit, "multiselect");
  const multiselectMeta = getStatusMeta("multiselect", "🎯", "Multi");
  const preparationAmount = getStatusAmount(unit, "preparation");
  const preparationMeta = getStatusMeta("preparation", "🔁", "Prep");
  const costReductionAmount = getStatusAmount(unit, "costReduction");
  const costReductionMeta = getStatusMeta("costReduction", "⚡", "Cost");
  const freezeAmount = getStatusAmount(unit, "freeze");
  const freezeMeta = getStatusMeta("freeze", "❄️", "Frozen");
  const shieldAmount = getStatusAmount(unit, "shield");
  const shieldMeta = getStatusMeta("shield", "🛡️", "");
  const fortifyAmount = getStatusDuration(unit, "fortify");
  const fortifyMeta = getStatusMeta("fortify", "🧱", "Fortify");
  const regenStacks = unit.statuses?.filter((status) => status.definitionId === "regeneration")?.length ?? 0;
  const regenTrigger = getStatusTrigger("regeneration", "regen", "turn_end");
  const regenHeal = regenStacks * (regenTrigger?.healPerStack ?? 0);
  const regenTurns = regenStacks > 0 ? getStatusMaxDuration(unit, "regeneration") : 0;
  const regenMeta = getStatusMeta("regeneration", "💚", "Regen");
  const shieldTrigger = getStatusTrigger("shield", "decay_half_unless", "turn_end");
  const shieldBlockedBy = shieldTrigger?.unlessStatus ?? null;
  const shieldBlocked = shieldBlockedBy ? getStatusDuration(unit, shieldBlockedBy) > 0 : false;
  const shieldDecayPreview = shieldBlocked ? shieldAmount : Math.floor(shieldAmount / 2);

  return [
    burnAmount > 0 && {
      key: "fire",
      icon: burnMeta.icon,
      label: burnMeta.label,
      title: burnMeta.title,
      value: `${burnAmount} (${burnDecay})`,
    },
    chargeAmount > 0 && {
      key: "charge",
      icon: chargeMeta.icon,
      label: chargeMeta.label,
      title: chargeMeta.title,
      value: chargeAmount,
    },
    multiselectAmount > 0 && {
      key: "multiselect",
      icon: multiselectMeta.icon,
      label: multiselectMeta.label,
      title: multiselectMeta.title,
      value: `+${multiselectAmount}`,
    },
    preparationAmount > 0 && {
      key: "preparation",
      icon: preparationMeta.icon,
      label: preparationMeta.label,
      title: preparationMeta.title,
      value: `+${preparationAmount}`,
    },
    costReductionAmount !== 0 && {
      key: "costReduction",
      icon: costReductionMeta.icon,
      label: costReductionMeta.label,
      title: costReductionMeta.title,
      value: costReductionAmount > 0 ? `-${costReductionAmount}` : `+${Math.abs(costReductionAmount)}`,
    },
    freezeAmount > 0 && {
      key: "frozen",
      icon: freezeMeta.icon,
      label: freezeMeta.label,
      title: freezeMeta.title,
      value: freezeAmount > 1 ? freezeAmount : "",
    },
    shieldAmount > 0 && {
      key: "shield",
      icon: shieldMeta.icon,
      label: shieldMeta.label,
      title: shieldMeta.title,
      value: fortifyAmount > 0
        ? `${shieldAmount}`
        : `${shieldAmount} (${shieldDecayPreview})`,
    },
    fortifyAmount > 0 && {
      key: "fortify",
      icon: fortifyMeta.icon,
      label: fortifyMeta.label,
      title: fortifyMeta.title,
      value: fortifyAmount,
    },
    regenStacks > 0 && {
      key: "regen",
      icon: regenMeta.icon,
      label: regenMeta.label,
      title: regenMeta.title,
      value: `+${regenHeal} (${regenTurns}t)`,
    },
  ].filter(Boolean);
}
