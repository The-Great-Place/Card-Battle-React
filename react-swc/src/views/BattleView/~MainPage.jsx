import './css/BattleView.css';

import { useState } from 'react';
import { observer } from "mobx-react"
import { AnimatePresence } from "motion/react";


import { useGameStore } from '../../store/useBattleStore.js'; // Adjust path
import { LootView } from "./LootView.jsx";
import { RunCompleteView } from "./RunCompleteView.jsx";
import { EnemyUnit } from './EnemyUnit.jsx';
import { PlayerUnit } from './PlayerUnit.jsx';
import { HandCardView } from './HandCardView.jsx';




export const BattleView = observer(() => {
  const gameManager = useGameStore(s => s.gameManager);
  const player = gameManager.player
  const enemies = gameManager.enemies
  const current_enemies = enemies[gameManager.enemies_index] || [];
  const [selectedCard, setSelectedCard] = useState({"card":null, "idx":null});
  const [selectedTargets, setSelectedTargets] = useState({"targets":[], "idx":[]});
  const [hitFxMap, setHitFxMap] = useState({});
  

  const handleTargetSelect = (target, idx) => {
    if (selectedCard.card !== null) {
      setSelectedTargets((prev) => {
        const existingIndex = prev.idx.indexOf(idx);

        // If already selected, remove it
        if (existingIndex >= 0) {
          return {
            targets: prev.targets.filter((_, i) => i !== existingIndex),
            idx: prev.idx.filter((_, i) => i !== existingIndex),
          };
        }

        // Otherwise, add it
        let newTargets = [...prev.targets, target];
        let newTargetsIdx = [...prev.idx, idx];

        // Enforce max target limit
        if (newTargets.length > selectedCard.card.targets + player.stack.multiselect) {
          newTargets.shift();
          newTargetsIdx.shift();
        }
        // gameManager.playCard(target, selectedCardIdx);
        // setSelectedCardIdx(null);

        return { targets: newTargets, idx: newTargetsIdx };
      });
    }
  };

  const handleCardSelect = (card, idx) => {
    if (selectedCard.idx != idx){ 
      setSelectedCard({"card": card, "idx": idx}) 
      if (card.targets == 0){
        setSelectedTargets({"targets":[player], "idx":[0]})
      } else {
        setSelectedTargets({"targets":[], "idx":[]})
      }

    }
    else {
       setSelectedCard({"card":null, "idx": null})
       setSelectedTargets({"targets":[], "idx":[]})
    }
  }


// const getCardDamageHits = (card, totalDamage) => {
//   if (!card || !card.effects) return [totalDamage];

//   const hits = [];

//   for (const effect of card.effects) {
//     if (effect.type !== "DAMAGE") continue;

//     // 1. 明确写单段数值
//     if (typeof effect.value === "number" && !effect.hits && !effect.times && !effect.repeat) {
//       hits.push(effect.value);
//       continue;
//     }

//     // 2. 明确写多段次数
//     const count = effect.hits || effect.times || effect.repeat || 1;
//     const value = effect.value || effect.amount || 0;

//     for (let i = 0; i < count; i++) {
//       hits.push(value);
//     }
//   }

//   // 如果 card 里没成功读出来，就退回总伤害单段显示
//   if (hits.length === 0) return [totalDamage];

//   return hits;
// };


  const handlePlayCard = () => {
      if (selectedCard.idx === null || selectedTargets.targets.length === 0) return;

  // 1. 记录出牌前血量
//   const beforeHpMap = new Map();
//   selectedTargets.targets.forEach((target, i) => {
//     // 只处理敌人，player 不做这个受击飘字
//     if (selectedTargets.idx[i] !== 0) {
//       beforeHpMap.set(selectedTargets.idx[i], target.health);
//     }
//   });

//     //!! 2. 正常出牌(NEEDED)
    gameManager.playCard(selectedTargets.targets, selectedCard.idx);

//  // 3. 计算受击结果
//   const newHitFxMap = {};

//   selectedTargets.targets.forEach((target, i) => {
//     const targetIdx = selectedTargets.idx[i];

//     // 跳过 player
//     if (targetIdx === 0) return;

//     const beforeHp = beforeHpMap.get(targetIdx);
//     const afterHp = target.health;
//     const totalDamage = Math.max(0, beforeHp - afterHp);

//     if (totalDamage > 0) {
//       const hits = getCardDamageHits(selectedCard.card, totalDamage);

//       newHitFxMap[targetIdx] = {
//         hits,
//         instanceKey: `${targetIdx}-${Date.now()}-${i}`
//       };
//     }
//   });

//   // 4. 触发特效
//   setHitFxMap(newHitFxMap);

//!!清空选择（NEEDED）
    setSelectedCard({"card":null, "idx": null});
    setSelectedTargets({"targets":[], "idx":[]})
  }





  return (
    <div
      className='battleContainer'
      // onClick={() => setSelectedCardIdx(null)}
    >
      <div className='top-bar'>
        <div className='turn-indicator'> Turn {gameManager.turn} </div>
        <div className='top-right-placeholder'>{/* optional right element */}
            <button className='clickable setting'>Setting</button>
        </div>
      </div>

      {/* Enemies Row - each enemy now in a wrapper with intents on side */}
      <div className='enemy-row-wrapper'>
        {current_enemies.map((enemy, idx) => (
          <EnemyUnit
            key={idx + 1}
            onPress={() => handleTargetSelect(enemy, idx + 1)}
            enemy={enemy}
            enemy_idx={idx + 1}
            selectedTargets={selectedTargets}
            hitFx={hitFxMap[idx + 1] || null}
          />
        ))}
      </div>
 
      {/* Bottom Layout */}
      <div className='footerRow'>
          {/* Left Section: Deck above, then Player + Refresh side by side */}
          <PlayerUnit onPress={() => handleTargetSelect(player, 0)} player={player} selectedTargets={selectedTargets}></PlayerUnit>
<div className="handSection">
          {/* Hand Section */}
          {selectedCard.card && (
            <button
              onClick={handlePlayCard}
              className="play-button"
            >
              Play Card
            </button>
          )}

          <div className='handRow'>
          
            <AnimatePresence initial={false}>

              {player.deck.hand.map((card, idx) => (
                <HandCardView key={idx} onPress={() => handleCardSelect(card, idx)} player={player} card={card} card_idx={idx} selectedCard={selectedCard}></HandCardView>
              ))}
            </AnimatePresence>

          </div>
        </div>
          <button onClick={gameManager.endTurn} className="clickable refresh-button"> End Turn</button>
      </div>

      {/*  Game State Managing */}
      {gameManager.lootOpen && ( <LootView loot={gameManager.pendingLoot} onPick={(card)=>gameManager.claimLoot(card)} onSkip={()=>gameManager.skipLoot()} />)}
      {gameManager.runComplete && ( <RunCompleteView title="Run Complete" buttonText="Next Level" onRestart={() => gameManager.nextLevel()} />)}
      {gameManager.runFailed && ( <RunCompleteView title="You Died" buttonText="Try Again" onRestart={() => gameManager.restartRun()}/>)}
  </div>
  );
});