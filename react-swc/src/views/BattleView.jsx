import React from 'react';
import { useState } from 'react';
import { useGameStore } from '../store/useBattleStore.js'; // Adjust path
import './BattleView.css';
import { observer } from "mobx-react"


const EnemyUnit = observer(({ onPress, enemy }) => {
  const healthPercent = (enemy.health / (enemy.maxHealth || 100)) * 100;
  return (
    <div onClick={onPress} className='enemyCard'>
      <img src={enemy.image} alt="Enemy" className='enemyImg' />
      <div className='statsOverlay'>
        {/* Health Bar */}
        <div className="stat-bar health-bar">
          <div 
            className="bar-fill" 
            style={{ width: `${healthPercent}%` }}
          ></div>
          <span className="bar-text">{enemy.health} / {enemy.maxHealth || 100}</span>
        </div>
        {/* Shield (optional, can also be a bar) */}
        <p>Shield: {enemy.shield || 0}</p>
      </div>
    </div>
  );
});



export const BattleView = observer(() => {
  const gameManager = useGameStore(s => s.gameManager);
  const player = useGameStore(s => s.player);
  const enemies = useGameStore(s => s.enemies);
  const current_enemies = enemies[gameManager.enemies_index]

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



  return (
    <div className='battleContainer'>
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
              {enemy.intents.slice(0, 3).map((move, i) => (
                <div key={i} className='intent-icon' title={move.card}>
                  {move.time}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

    {/* Bottom Layout */}
      <div className='footerRow'>
          {/* Left Section: Deck above, then Player + Refresh side by side */}
          <div className='player-area'>
            <button className='clickable deck-button'>Deck</button>
            <div className='player-row'>
              <div onClick={() => handleTargetSelect(player)} className='playerSection'>
                <img src={player.image} alt="Player" className='playerImg' />
                <div className='statsOverlay'>
                  <div className="stat-bar health-bar">
                    <div className="bar-fill" style={{ width: `${(player.health / player.maxHealth) * 100}%` }}></div>
                    <span className="bar-text">{player.health} / {player.maxHealth}</span>
                  </div>
                  <p>Shield: {player.shield}</p>
                </div>
              </div>
              <button onClick={playerDrawCard} className='clickable refresh-button'>Refresh Hand</button>
            </div>
          </div>

          {/* Hand Section */}
          <div className="handContainer"></div>
          <div className='handRow'>
            {player.deck.hand.map((card, idx) => (
             
          <button
       key={idx}
      onClick={() => setSelectedCardIdx(idx)}
      className={`card card--fullart ${idx === selectedCardIdx ? 'selectedCard' : ''}`}
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
  <img className="card__frame" src="/Card/frame.png" alt="" aria-hidden="true" />
</button>


            ))}
          </div>

          {/* Right Section: Draw Card button only */}
          <div className='draw-area'>
            <button onClick={playerDrawCard} className='clickable draw-button'>Draw Card</button>
          </div>
      </div>
  </div>
  );
});