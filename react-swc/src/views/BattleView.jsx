import React from 'react';
import { useState } from 'react';
import { useGameStore } from '../store/useBattleStore.js'; // Adjust path
import './BattleView.css';
import { observer } from "mobx-react"
import { CardLibrary } from "../engine/cardEffects";
import { LootView } from "./LootView";
import { RunCompleteView } from "./RunCompleteView";

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

//Shows the status of units and their stacks
function getStatusList(unit) {
  return [
    unit.onFire > 0 && { key: "fire", icon: "🔥", label: "Burn", value: unit.onFire },
    unit.onWet > 0 && { key: "wet", icon: "💧", label: "Wet", value: unit.onWet },
    unit.onElec > 0 && { key: "elec", icon: "⚡", label: "Elec", value: unit.onElec },
    unit.charge > 0 && { key: "charge", icon: "🔋", label: "Charge", value: unit.charge },
    unit.isFrozen && { key: "frozen", icon: "❄️", label: "Frozen", value: "" },
  ].filter(Boolean);
}

const StatusMarks = observer(({ unit, className = "" }) => {
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

//Deck info
function PileSection({ title, cards }) {
  const grouped = groupCards(cards).sort((a, b) =>
    a.card.name.localeCompare(b.card.name)
  );

  return (
    <div className="pileSection">
      <div className="pileSection__header">
        {title} ({cards.length})
      </div>

      <div className="pileSection__list">
        {grouped.length > 0 ? (
          grouped.map(({ card, count }, i) => (
            <div key={`${card.id}-${i}`} className="pileCardRow">
              <img src={card.image} alt={card.name} className="pileCardIcon" />

              <div className="pileCardInfo">
                <div className="pileCardName">{card.name}</div>
                <div className="pileCardDesc">{card.description || "No description"}</div>
              </div>

              {count > 1 && <div className="pileCardCount">x{count}</div>}
            </div>
          ))
        ) : (
          <div className="pileEmpty">Empty</div>
        )}
      </div>
    </div>
  );
}


//Shows the card's in stacks
function groupCards(cards) {
  const map = {};

  cards.forEach(card => {
    const key = card.id; // use id so duplicates group correctly

    if (!map[key]) {
      map[key] = {
        card: card,
        count: 1
      };
    } else {
      map[key].count += 1;
    }
  });

  return Object.values(map);
}

const EnemyUnit = observer(({ onPress, enemy }) => {
  const healthPercent = (enemy.health / (enemy.maxHealth || 100)) * 100;

  return (
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
          <p>Shield: {enemy.shield || 0}</p>
        </div>
      </div>

      <StatusMarks unit={enemy} className="statusMarks--enemy" />
    </div>
  );
});



export const BattleView = observer(() => {
  const gameManager = useGameStore(s => s.gameManager);
  const player = useGameStore(s => s.player);
  const enemies = useGameStore(s => s.enemies);
  const current_enemies = enemies[gameManager.enemies_index] || [];
  const lootOpen = gameManager.lootOpen;
  const pendingLoot = gameManager.pendingLoot;
  const [selectedCardIdx, setSelectedCardIdx] = useState(null);
  const [currentTurn, setCurrentTurn] = useState(1); // Example turn state


  
  const handleTargetSelect = (target) => {
    if (selectedCardIdx !== null) {
      gameManager.intentAction(target, selectedCardIdx);
      setSelectedCardIdx(null);
    }
  };

  // Placeholder synergy value (replace with actual store data)
  const synergy = 3;
  const playerDrawCard = () => { gameManager.drawCard(1) }

  const refreshHandSimple = () => {
    const n = player.deck.hand.length;
    if (n <= 0) return;

    player.deck.discardPile.push(...player.deck.hand);
    player.deck.hand.splice(0, player.deck.hand.length);

    player.drawCard(n);
    gameManager.progressTime(2);
  };
  
const [deckOpen, setDeckOpen] = useState(false);

  // For Refresh hand and selectable discard in the future
  const [refreshMode, setRefreshMode] = useState(false);
  const [refreshSet, setRefreshSet] = useState(new Set());
  const toggleRefreshPick = (idx) => {
    setRefreshSet(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const doRefresh = () => {
    const indexes = Array.from(refreshSet);
    const n = player.refreshSelected(indexes);
    setRefreshSet(new Set());
    setRefreshMode(false);
    if (n > 0) gameManager.progressTime(1); // or whatever time cost you want
  };


  return (
    <div
      className='battleContainer'
      onClick={() => setSelectedCardIdx(null)}
    >
      {/* Top Bar: Synergy (left) and Turn (center) */}
      <div className='top-bar'>
        <div className='synergy'>
          <span className='synergy-icon'>⚡</span>
          <span className='synergy-value'>Synergy: {synergy}</span>
        </div>
        <div className='turn-indicator'>Time {gameManager.time}</div>
        <div className='top-right-placeholder'>{/* optional right element */}
            <button className='clickable setting'>Setting</button>
            </div>
        
      </div>

      {/* Enemies Row - each enemy now in a wrapper with intents on side */}
      <div className='enemy-row-wrapper'>
        {current_enemies.map((enemy, idx) => (
          <div key={idx} className='enemy-wrapper'>
            <EnemyUnit onPress={() => handleTargetSelect(enemy)} enemy={enemy} />
            {/* Intents moved outside card, to the side */}
            <div className='enemy-intents'>
              {enemy.intents.slice(0, 3).map((move, i) => {
  const def = CardLibrary[move.card]; // move.card is the id string

  return (
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
  );
})}
            </div>
          </div>
        ))}
      </div>

    {/* Bottom Layout */}
      <div className='footerRow'>
          {/* Left Section: Deck above, then Player + Refresh side by side */}
          <div className='player-area'>
            <button
              className='clickable deck-button'
              onClick={(e) => {
                e.stopPropagation();
                setDeckOpen(true);
              }}
             >
              Deck
            </button>
            <div className='player-row'>
             <div className="playerWrap" onClick={() => handleTargetSelect(player)}>
                <StatusMarks unit={player} className="statusMarks--player" />
                <div className='playerSection'>
                  <img src={player.image} alt="Player" className='playerImg' />
                  <div className='statsOverlay'>
                    <div className="stat-bar health-bar">
                      <div
                        className="bar-fill"
                        style={{ width: `${(player.health / player.maxHealth) * 100}%` }}
                      />
                      <span className="bar-text">
                        {player.health} / {player.maxHealth}
                      </span>
                    </div>
                    <p>Shield: {player.shield}</p>
                  </div>
                </div>
              </div>
           <button
            onClick={refreshHandSimple}
            className='clickable refresh-button'
          >
            Refresh Hand
          </button>
            </div>
          </div>

          {/* Hand Section */}
          <div className="handContainer"></div>
          <div className='handRow'>
            {player.deck.hand.map((card, idx) => (
             
          <button
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                if (refreshMode) {
                  toggleRefreshPick(idx);
                } else {
                  setSelectedCardIdx(prev => (prev === idx ? null : idx));
                }
              }}
              className={`card card--fullart
                ${idx === selectedCardIdx ? 'selectedCard' : ''}
                ${refreshSet.has(idx) ? 'refreshPick' : ''}`
              }
              style={{ "--i": idx, "--n": player.deck.hand.length }}
>
  {/* Full-card art */}
  <img className="card__artFull" src={card.image} alt={card.name} />

  {/* Dark vignette for readability */}
  <div className="card__vignette" aria-hidden="true" />

  {/* Top-left cost */}
  <div className="card__cost">
    <span className="card__costValue">{card.time_cost ?? 1}</span>
  </div>

  {/* Pips under cost */}
  <div className="card__pips">
    {Array.from({ length: Math.min(card.traits?.length ?? 0, 6) }).map((_, i) => (
      <span key={i} className="card__pip" />
    ))}
  </div>

  {/* Name banner */}
  <div className="card__name">
    <span className="card__nameText">{card.name}</span>
  </div>

  {/* Description */}
  <div className="card__desc">
    <div className="card__descInner">
      • {card.description || 'No description'}
    </div>
  </div>

  {/* Frame overlay */}
  <img className="card__frame" src="./Card/Frame.png" alt="" aria-hidden="true" />
</button>


            ))}
          </div>

          {/* Right Section: Draw Card button only */}
          <div className="draw-area">
            <div className="draw-wrapper">

              <button onClick={playerDrawCard} className="clickable draw-button">
                Draw Card
              </button>

              <div className="draw-tooltip">
                <div className="draw-title">
                Draw Pile ({player.deck.drawPile.length})</div>

                  {groupCards(player.deck.drawPile)
                    .sort((a, b) => a.card.name.localeCompare(b.card.name))
                    .map(({card, count}, i) => (
                      <div key={i} className="draw-card-row">
                        <img src={card.image} className="draw-card-icon" />
                        <span>{card.name}{count > 1 ? ` x${count}` : ""}</span>
                      </div>
                ))}

                {player.deck.drawPile.length === 0 && (
                  <div className="draw-empty">Empty</div>
                )}
              </div>

            </div>
          </div>
      </div>
  {/* Deck Stuff */}
      {deckOpen && (
        <div
          className="deckModalOverlay"
          onClick={() => setDeckOpen(false)}
        >
          <div
            className="deckModal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="deckModal__top">
              <div className="deckModal__title">Deck Viewer</div>
              <button
                className="deckModal__close clickable"
                onClick={() => setDeckOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className="deckModal__content">
              <PileSection title="Draw Pile" cards={player.deck.drawPile} />
              <PileSection title="Discard Pile" cards={player.deck.discardPile} />
            </div>
          </div>
        </div>
      )}
 {/*  Loot Stuff */}
{gameManager.lootOpen && (
  <LootView
    loot={gameManager.pendingLoot}
    onPick={(card)=>gameManager.claimLoot(card)}
    onSkip={()=>gameManager.skipLoot()}
  />
)}
{gameManager.runComplete && (
  <RunCompleteView
    title="Run Complete"
    buttonText="Restart Run"
    onRestart={() => gameManager.restartRun()}
  />
)}

{gameManager.runFailed && (
  <RunCompleteView
    title="You Died"
    buttonText="Try Again"
    onRestart={() => gameManager.restartRun()}
  />
)}
  </div>
  );
});