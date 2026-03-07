import { observer } from "mobx-react"

//Shows the status of units and their stacks
function getStatusList(unit) {
  return [
    unit.onFire > 0 && { key: "fire", icon: "🔥", label: "Burn", value: unit.onFire },
    unit.onWet > 0 && { key: "wet", icon: "💧", label: "Wet", value: unit.onWet },
    unit.onElec > 0 && { key: "elec", icon: "⚡", label: "Elec", value: unit.onElec },
    unit.charge > 0 && { key: "charge", icon: "🔋", label: "Charge", value: unit.charge },
    unit.isFrozen && { key: "frozen", icon: "❄️", label: "Frozen", value: "" },
    unit.shield > 0 && { key: "shield", icon: "🛡️", label: "Shield", value: unit.shield },
  ].filter(Boolean);
}

export const StatusMarks = observer(({ unit, className = "" }) => {
  const statuses = getStatusList(unit);

  if (statuses.length === 0) return null;

  return (
    <div className={`statusMarks ${className}`}>
      {statuses.map((s) => (
        <div key={s.key} className={`statusMark statusMark--${s.key}`} title={s.label}>
          <span className="statusMark__icon">{s.icon}</span>
          {s.value !== "" && <span className="statusMark__value">{s.value}</span>}
        </div>
      ))}
    </div>
  );
});
