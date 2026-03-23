import './css/BattleView.css';

import { observer } from "mobx-react";

import { useGameStore } from '../../store/useBattleStore.js';
import { PlayerUnit } from './PlayerUnit.jsx';
import { BattleHeader } from './components/BattleHeader.jsx';
import { EnemyRow } from './components/EnemyRow.jsx';
import { HandPanel } from './components/HandPanel.jsx';
import { BattleOverlays } from './components/BattleOverlays.jsx';
import { useBattleSelection } from './hooks/useBattleSelection.js';
import { canPlaySelectedCard } from '../../engine/queries/battleQueries.js';

export const BattleView = observer(() => {
  const gameState = useGameStore((s) => s.gameState);
  const battleEngine = useGameStore((s) => s.battleEngine);
  const player = gameState.player;
  const currentEnemies = gameState.currentEnemies;
  const hitFxMap = {};

  const {
    selectedCard,
    selectedTargets,
    selectedTargetIds,
    clearSelection,
    handleTargetSelect,
    handleCardSelect,
  } = useBattleSelection(player);

  const handlePlayCard = () => {
    if (!canPlaySelectedCard(gameState, selectedCard, selectedTargetIds)) return;

    const wasPlayed = battleEngine.dispatch({
      type: "PLAY_CARD",
      cardInstanceId: selectedCard.instanceId,
      targetIds: selectedTargetIds,
    });

    if (wasPlayed) {
      clearSelection();
    }
  };

  return (
    <div className='battleContainer'>
      <BattleHeader turn={gameState.turn} />

      <EnemyRow
        enemies={currentEnemies}
        onTargetSelect={handleTargetSelect}
        selectedTargets={selectedTargets}
        hitFxMap={hitFxMap}
      />

      <div className='footerRow'>
        <PlayerUnit
          onPress={() => handleTargetSelect(player, 0)}
          player={player}
          selectedTargets={selectedTargets}
        />
        <HandPanel
          gameState={gameState}
          player={player}
          selectedCard={selectedCard}
          selectedTargetIds={selectedTargetIds}
          onCardSelect={handleCardSelect}
          onPlayCard={handlePlayCard}
        />
        <button onClick={() => battleEngine.dispatch({ type: "END_TURN" })} className="clickable refresh-button">
          End Turn
        </button>
      </div>

      <BattleOverlays gameState={gameState} battleEngine={battleEngine} />
    </div>
  );
});
