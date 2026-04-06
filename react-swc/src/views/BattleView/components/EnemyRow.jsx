import { EnemyUnit } from "../EnemyUnit.jsx";
import { observer } from "mobx-react";


export const EnemyRow = observer(({ enemyViews, onTargetSelect, hitFxMap }) =>{
  return (
    <div className='enemy-row-wrapper'>
      {enemyViews.map((enemyView, idx) => (
        <EnemyUnit
          key={idx + 1}
          onPress={() => onTargetSelect(enemyView.entity.id)}
          enemyView={enemyView}
          hitFx={hitFxMap[idx + 1] || null}
        />
      ))}
    </div>
  );
})
