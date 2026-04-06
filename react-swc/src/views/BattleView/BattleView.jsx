import './css/BattleView.css';

import { observer } from "mobx-react";

import { useGameStore } from '../../store/useBattleStore.js';
import { PlayerUnit } from './PlayerUnit.jsx';
import { BattleHeader } from './components/BattleHeader.jsx';
import { EnemyRow } from './components/EnemyRow.jsx';
import { HandPanel } from './components/HandPanel.jsx';
import { BattleOverlays } from './components/BattleOverlays.jsx';
import { useBattleSelection } from './hooks/useBattleSelection.js';

const selectorLabelMap = {
  enemy: "enemy",
  ally: "ally",
  self: "yourself",
  all_enemies: "all enemies",
  all_allies: "all allies",
  all_entities: "all units",
  random_enemy: "random enemy",
  random_allies: "random ally",
};

const selectorHintMap = {
  self: "Targets yourself automatically",
  ally: "Targets an ally automatically",
  all_allies: "Targets all allies",
  all_enemies: "Targets all enemies",
  all_entities: "Targets all units",
};

const randomSelectorMap = {
  random_enemy: "Random enemy target",
  random_allies: "Random ally target",
};

function formatSelectionHint(interaction, selectedCount = 0) {
  if (!interaction) return null;

  const { selector, minTargets = 0, maxTargets = 0 } = interaction;
  if (selector && selectorHintMap[selector]) return selectorHintMap[selector];

  if (selector && randomSelectorMap[selector]) {
    const picks = maxTargets || minTargets || 1;
    return `${randomSelectorMap[selector]} (${picks} pick${picks === 1 ? "" : "s"})`;
  }

  if (maxTargets > 0) {
    const range = minTargets === maxTargets ? `${maxTargets}` : `${minTargets}-${maxTargets}`;
    const isSingle = !range.includes("-") && Number(range) === 1;
    const targetWord = isSingle ? "target" : "targets";
    const baseLabel = selector && selectorLabelMap[selector] ? `${selectorLabelMap[selector]} ` : "";
    const suffix = selectedCount && maxTargets > 0 ? ` (${selectedCount}/${maxTargets})` : "";
    return `Select ${range} ${baseLabel}${targetWord}${suffix}`;
  }

  if (minTargets > 0) {
    const targetWord = minTargets === 1 ? "target" : "targets";
    return `Select at least ${minTargets} ${targetWord}`;
  }

  if (selector) {
    return `Targets ${selectorLabelMap[selector] ?? selector}`;
  }

  return null;
}

export const BattleView = observer(() => {
  const gameState = useGameStore((s) => s.gameState);
  const battleEngine = useGameStore((s) => s.battleEngine);
  const hitFxMap = {};

  const {
    selectedCard,
    selectedCardId,
    selectedTargetIds,
    battleViewModel,
    clearSelection,
    handleTargetSelect,
    handleCardSelect,
    handleOptionSelect,
  } = useBattleSelection(gameState, battleEngine);

  const selectionHint = formatSelectionHint(
    battleViewModel.interaction,
    (battleViewModel.selectedTargetIds ?? []).length,
  );

  const hasPendingInteraction = Boolean(gameState.pendingInteraction);

  const handleAction = () => {
    if (battleViewModel.actionButton.disabled) return;

    if (gameState.pendingInteraction) {
      battleEngine.dispatch({
        type: "CONFIRM_INTERACTION",
        selectionIds: battleViewModel.selectedTargetIds,
      });
      clearSelection();
      return;
    }

    if (!selectedCardId) return;

    const wasPlayed = battleEngine.dispatch({
      type: "PLAY_CARD",
      cardInstanceId: selectedCardId,
      targetIds: selectedTargetIds,
    });

    if (wasPlayed) {
      clearSelection();
    }
  };

  const handleCancelInteraction = () => {
    if (!gameState.pendingInteraction) return;
    battleEngine.dispatch({ type: "CANCEL_INTERACTION" });
    clearSelection();
  };

  console.log(battleViewModel)
  return (
    <div className='battleContainer'>
      <BattleHeader turn={battleViewModel.header.turn} />

      <EnemyRow
        enemyViews={battleViewModel.enemies}
        onTargetSelect={handleTargetSelect}
        hitFxMap={hitFxMap}
      />

      <div className='footerRow'>
        <PlayerUnit
          onPress={() => handleTargetSelect(battleViewModel.player?.entity?.id)}
          playerView={battleViewModel.player}
        />
        <HandPanel
          player={battleViewModel.player?.entity}
          handCards={battleViewModel.hand}
          actionButton={battleViewModel.actionButton}
          selectedCard={selectedCard}
          onCardSelect={handleCardSelect}
          onAction={handleAction}
          onCancelInteraction={hasPendingInteraction ? handleCancelInteraction : null}
          selectionHint={selectionHint}
          interaction={battleViewModel.interaction}
          interactionSelectionIds={battleViewModel.selectedTargetIds}
          onInteractionOptionSelect={handleOptionSelect}
          interactionActive={hasPendingInteraction}
        />
        <button
          onClick={() => battleEngine.dispatch({ type: "END_TURN" })}
          className="clickable refresh-button"
          disabled={!battleViewModel.header.canEndTurn}
        >
          End Turn
        </button>
      </div>

      <BattleOverlays overlays={battleViewModel.overlays} battleEngine={battleEngine} />
    </div>
  );
});
