import { observer } from "mobx-react"
import { StatusMarks } from "./StatusMarks";
import { CardLibrary } from "../../engine/cardEffects";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";


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


export const EnemyUnit = observer(({ onPress, enemy,  enemy_idx, selectedTargets, hitFx}) => {
  const healthPercent = (enemy.health / (enemy.maxHealth || 100)) * 100;
  const isSelected = selectedTargets?.idx?.includes(enemy_idx);

  //new
  const [showHit, setShowHit] = useState(false);
  const [damagePops, setDamagePops] = useState([]);

    useEffect(() => {
            if (!hitFx) return;

            setShowHit(true);

            const hits = hitFx.hits || [];
            const timers = [];

            hits.forEach((value, index) => {
              const timer = setTimeout(() => {
                    setDamagePops(prev => [
                  ...prev,
                  {
                    value,
                    key: `${hitFx.instanceKey}-${index}`,
                    offsetX: Math.random() * 120 - 60,
                    offsetY: Math.random() * 100 - 50
                  }
                ]);
              }, index * 140);

              timers.push(timer);
            });

            const shakeTimer = setTimeout(() => {
              setShowHit(false);
            }, Math.max(220, hits.length * 140));

            timers.push(shakeTimer);

            return () => {
              timers.forEach(clearTimeout);
            };
      }, [hitFx]);


return (
  <div className={`enemy-wrapper ${isSelected ? "enemy-wrapper--selected" : ""}`}>

      <div className="enemyUnitWrap" onClick={onPress}>

       

       <motion.div
          className='enemyCard'
          animate={
            showHit
              ? { x: [0, -4, 4, -2, 2, 0], scale: [1, 1.015, 0.995, 1] }
              : { x: 0, scale: 1 }
          }
          transition={{ duration: 0.18, ease: "easeOut" }}
        >
           <div className="enemyUnit__damageLayer">
            <div className="enemyUnit__damageAnchor">
              <AnimatePresence>
                {damagePops.map((pop, index) => (
                 <motion.div
                    key={pop.key}
                    className="damageNumber"
                    initial={{
                      opacity: 0,
                      x: pop.offsetX,
                      y: pop.offsetY + 8,
                      scale: 0.7
                    }}
                    animate={{
                      opacity: 1,
                      x: pop.offsetX,
                      y: pop.offsetY - 26,
                      scale: 1.05
                    }}
                    exit={{
                      opacity: 0,
                      x: pop.offsetX,
                      y: pop.offsetY - 42,
                      scale: 0.92
                    }}
                    transition={{ duration: 0.45, ease: "easeOut" }}
                    onAnimationComplete={() => {
                      setDamagePops(prev => prev.filter(item => item.key !== pop.key));
                    }}
                  >
                    -{pop.value}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>





          <img src={enemy.image} alt="Enemy" className='enemyImg' />

          <motion.div
            className="enemyHitFlash"
            initial={false}
            animate={
              showHit
                ? { opacity: [0, 0.38, 0.2, 0] }
                : { opacity: 0 }
            }
            transition={{ duration: 0.32, ease: "easeOut" }}
          />

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
        </motion.div>
      </div>


  <div className='enemy-intents'>
  {enemy.intents.slice(0, 3).map((move, i) => {
    const def = CardLibrary[move.card];

    return (
      <div key={i} className="intent-icon">
        <span className="intent-main">
          {def?.image ? (
            <img
              src={def.image}
              alt={def?.name ?? move.card}
              className="intent-image"
            />
          ) : (
            <span className="intent-glyph">{getIntentGlyph(def)}</span>
          )}
          <span className="intent-time">{move.time}</span>
        </span>

        <div className="intent-tooltip">
          <div className="intent-tooltip__title">{def?.name ?? move.card}</div>
          <div className="intent-tooltip__desc">
            {def?.description ?? "No description yet."}
          </div>
        </div>

     {def && (
  <div className="intent-card-preview">
    <div className="intent-card-preview__scale">

            <div className="card card--fullart">
              <img
                className="card__artFull"
                src={def.image}
                alt={def.name}
              />

              <div className="card__vignette" />

              <div className="card__cost">
                <span className="card__costValue">
                  {def.timeCost ?? move.time ?? 0}
                </span>
              </div>

              <div className="card__name">
                <span className="card__nameText">
                  {def.name}
                </span>
              </div>

              <div className="card__desc">
                <div className="card__descInner">
                  • {def.description || "No description"}
                </div>
              </div>

              <img
  className="card__frame"
  src="./Card/Frame.png"
  alt=""
  aria-hidden="true"
/>
            </div>

          </div>
        </div>
      )}
      </div>
    );
  })}
</div>

    </div>
  );
});
