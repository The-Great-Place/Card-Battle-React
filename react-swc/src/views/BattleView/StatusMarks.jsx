import { observer } from "mobx-react";
import { getStatusDisplayList } from "../../engine/queries/statusViewQueries";

export const StatusMarks = observer(({ unit, className = "" }) => {
  const statuses = getStatusDisplayList(unit);
  if (statuses.length === 0) return null;

  return (
    <div className={`statusMarks ${className}`}>
      {statuses.map((s) => (
        <div key={s.key} className={`statusMark statusMark--${s.key}`} title={s.title ?? s.label}>
          <span className="statusMark__icon">{s.icon}</span>
          <span className="statusMark__text">
            {s.label} {s.value !== "" && s.value}
          </span>
        </div>
      ))}
    </div>
  );
});
