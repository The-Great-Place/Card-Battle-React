import React from 'react';
import { useState, forceUpdate } from 'react';
import { useGameStore } from '../store/useBattleStore.js'; // Adjust path
import './BattleView.css';

const EnemyUnit = ({ onPress, enemy }) => {
  return (
    <div onClick={onPress} className='enemyCard'>
      <img src={enemy.image} alt="Enemy" className='enemyImg' />
      <div className='statsOverlay'>
        <p>HP: {enemy.health}</p>
        <p>Shield: {enemy.shield || 0}</p>
      </div>
      
      {/* Bookmark Intent Icons */}
      <div className='intentBar'>
        {enemy.intents.slice(0, 3).map((move, i) => (
          <div key={i} className='bookmark' title={move.description}>
            {move.icon}
          </div>
        ))}
      </div>
    </div>
  );
};

export const BattleView = () => {
  const player = useGameStore(s => s.entities.player);
  const enemies = useGameStore(s => s.entities.enemies[0]);
  const playerDrawCard = useGameStore(s => s.playerDrawCard);
  const playerUsedCard = useGameStore(s => s.playerUsedCard);
  const playCard = useGameStore(s => s.playCard);
  const player2 = useGameStore(s=>s.player)

  const [selectedCardIdx, setSelectedCardIdx] = useState(null);

  const handleTargetSelect = (target) => {
    if (selectedCardIdx !== null) {
      playCard(player, target, selectedCardIdx);
      playerUsedCard()
      setSelectedCardIdx(null);
    }
  };

  const handleC = (t) => {
    player2.takeDamage()
  }



  return (
    <div  className='battleContainer'>
      {/* Top: Enemies */}
      <div className='enemyRow'>
        {enemies.map((enemy, idx) => (
          <EnemyUnit onPress={() => handleTargetSelect(['enemies', 0])} key={idx} enemy={enemy} />
        ))}
      </div>

      {/* Bottom Layout */}
      <div className='footerRow'>
        {/* Player Section */}
        <div onClick={() => handleTargetSelect(['player', 0])} className='playerSection'>
          <img src={player.image} alt="Player" className='playerImg' />
          <div className='statsOverlay'>
            <p>Health: {player2.health}</p>
            <p>Shield: {player.shield}</p>
          </div>
        </div>

        {/* Hand Section */}
        <div className='handRow'>
            {player.deck.hand.map((card, idx) => (
                <button key={idx} onClick={() => setSelectedCardIdx(idx)}
                    className={`card ${idx === selectedCardIdx ? 'selectedCard' : ''}`}>
                    {card.name}
                </button>
            ))}
        </div>
        
        <div>
        <button onClick={playerDrawCard} className='card'> Draw Card </button>
        {/* <p> Round: {round}</p> */}
        </div>
      </div>
    </div>
  );
};