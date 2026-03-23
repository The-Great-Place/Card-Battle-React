import { EnemyUnit } from "../EnemyUnit.jsx";
import { observer } from "mobx-react";


export const EnemyRow = observer(({ enemies, onTargetSelect, selectedTargets, hitFxMap }) =>{
  return (
    <div className='enemy-row-wrapper'>
      {enemies.map((enemy, idx) => (
        <EnemyUnit
          key={idx + 1}
          onPress={() => onTargetSelect(enemy, idx + 1)}
          enemy={enemy}
          enemy_idx={idx + 1}
          selectedTargets={selectedTargets}
          hitFx={hitFxMap[idx + 1] || null}
        />
      ))}
    </div>
  );
})
