import { observer } from "mobx-react"
import { StatusMarks } from "./StatusMarks";
import { getCardDefinition } from "../../engine/definitions/cardRegistry";
import { HandCardView } from "./HandCardView";



export const EnemyUnit = observer(({ onPress, enemyView }) => {
  const enemy = enemyView?.entity;
  if (!enemy) return null;

  const healthPercent = Math.max(0, (enemy.health / (enemy.maxHealth)) * 100);
  return (
    <div className="enemy-wrapper">

      <div className='enemyUnitWrap' onClick={onPress}>
        <div className={`enemyCard ${enemyView.isSelected ? 'selectedEnemy' : ''} ${enemyView.isLegalTarget ? 'clickable' : ''}`}>
          <img src={enemy.image} alt="Enemy" className='enemyImg' />
          <div className='statsOverlay'>
            <div className="stat-bar health-bar">
              <div
                className="bar-fill"
                style={{ width: `${healthPercent}%` }}
              />
              <span className="bar-text">
                {enemy.health} / {enemy.maxHealth || 100}
              </span>
              
            </div>
            <div className="enemy-name">{enemy.name}</div>
            <StatusMarks unit={enemy} className="statusMarks--enemy" />

          </div>
        </div>
      </div>


      <div className='enemy-intents'>
        {enemy.intents.slice(0, 3).map((move, i) => {
          const def = getCardDefinition(move.card); // move.card is the id string
          if (!def) return null;
          return(
            <div key={i} className="intent-icon">
                {/* <span className="intent-glyph">{getIntentGlyph(def)}</span> */}
                {/* <span className="intent-time">{move.time}</span> */}
                <img className="intent-image" src={def.image}></img>
              <div className="intent-card-preview">
                <HandCardView onPress={null} player={null} card={def} card_idx={null} selectedCardIdx={null}/>
                {/* <div className="intent-tooltip__title">{def?.name ?? move.card}</div>
                <div className="intent-tooltip__desc">{def?.description ?? "No description yet."}</div> */}
              </div>
            </div>
          )
        })}
      </div>

    </div>
  );
});
