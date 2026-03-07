import { observer } from "mobx-react"
import { StatusMarks } from "./StatusMarks";
import { CardLibrary } from "../../engine/cardEffects";



function inferCategory(def) {
  if (!def) return "UTILITY";

  // If you later add a manual override, keep this:
  if (def.category) return def.category;

  const types = (def.effects || []).map(e => e.type);

  // Attack if it deals damage
  if (types.includes("DAMAGE")) return "ATTACK";

  // Defend if it adds shield/block
  if (types.includes("SHIELD") || types.includes("BLOCK")) return "DEFEND";

  // Utility if it heals, draws, etc.
  if (types.includes("HEAL") || types.includes("DRAW")) return "UTILITY";

  // default fallback
  return "UTILITY";
}


function getIntentGlyph(def) {
  const cat = inferCategory(def);
  if (cat === "ATTACK") return "⚔";
  if (cat === "DEFEND") return "🛡";
  return "✦";
}


export const EnemyUnit = observer(({ onPress, enemy }) => {
  const healthPercent = (enemy.health / (enemy.maxHealth || 100)) * 100;
  return (
    <div className="enemy-wrapper">

      <div className="enemyUnitWrap" onClick={onPress}>
        <div className='enemyCard'>
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
            <StatusMarks unit={enemy} className="statusMarks--enemy" />

          </div>
        </div>
      </div>


      <div className='enemy-intents'>
        {enemy.intents.slice(0, 3).map((move, i) => {
          const def = CardLibrary[move.card]; // move.card is the id string
          return(
            <div key={i} className="intent-icon">
              <span className="intent-main">
                <span className="intent-glyph">{getIntentGlyph(def)}</span>
                <span className="intent-time">{move.time}</span>
              </span>
              <div className="intent-tooltip">
                <div className="intent-tooltip__title">{def?.name ?? move.card}</div>
                <div className="intent-tooltip__desc">{def?.description ?? "No description yet."}</div>
              </div>
            </div>
          )
        })}
      </div>

    </div>
  );
});
