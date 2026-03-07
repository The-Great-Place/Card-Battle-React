import './BattleView.css';

import { useState } from 'react';
import { observer } from "mobx-react"

import { useGameStore } from '../../store/useBattleStore.js'; // Adjust path
import { LootView } from "../LootView.jsx";
import { RunCompleteView } from "../RunCompleteView.jsx";
import { EnemyUnit } from './EnemyUnit.jsx';
import { PlayerUnit } from './PlayerUnit.jsx';
import { HandCardView } from './HandCardView.jsx';




export const BattleView = observer(() => {
  const gameManager = useGameStore(s => s.gameManager);
  const player = useGameStore(s => s.player);
  const enemies = useGameStore(s => s.enemies);
  const current_enemies = enemies[gameManager.enemies_index] || [];
  const [selectedCardIdx, setSelectedCardIdx] = useState(null);


  
  const handleTargetSelect = (target) => {
    if (selectedCardIdx !== null) {
      gameManager.intentAction(target, selectedCardIdx);
      setSelectedCardIdx(null);
    }
  };

  // Placeholder synergy value (replace with actual store data)
  const synergy = 3;




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
          <EnemyUnit key={idx} onPress={() => handleTargetSelect(enemy)} enemy={enemy} />
        ))}
      </div>

      {/* Bottom Layout */}
      <div className='footerRow'>
          {/* Left Section: Deck above, then Player + Refresh side by side */}
          <PlayerUnit onPress={() => handleTargetSelect(player)} player={player} gameManager={gameManager}></PlayerUnit>

          {/* Hand Section */}
          <div className='handRow'>
            {player.deck.hand.map((card, idx) => (
              <HandCardView key={idx} onPress={() => setSelectedCardIdx(prev => (prev === idx ? null : idx))} player={player} card={card} card_idx={idx} selectedCardIdx={selectedCardIdx}></HandCardView>
            ))}
          </div>

      </div>

      {/*  Game State Managing */}
      {gameManager.lootOpen && ( <LootView loot={gameManager.pendingLoot} onPick={(card)=>gameManager.claimLoot(card)} onSkip={()=>gameManager.skipLoot()} />)}
      {gameManager.runComplete && ( <RunCompleteView title="Run Complete" buttonText="Restart Run" onRestart={() => gameManager.restartRun()} />)}
      {gameManager.runFailed && ( <RunCompleteView title="You Died" buttonText="Try Again" onRestart={() => gameManager.restartRun()}/>)}
  </div>
  );
});