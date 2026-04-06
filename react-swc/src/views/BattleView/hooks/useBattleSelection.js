import { useMemo, useState } from "react";
import {
  getBattleViewModel,
  getCardPlayState,
} from "../../../engine/queries/battleQueries";

export function useBattleSelection(gameState, battleEngine) {
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [rawSelectedTargetIds, setRawSelectedTargetIds] = useState([]);
  const isInteractionLocked = gameState?.lootOpen || gameState?.runComplete || gameState?.runFailed;
  const activeSelectedCardId = !isInteractionLocked && gameState?.player?.deck?.getCardInHand(selectedCardId)
    ? selectedCardId
    : null;

  const selectedCard = activeSelectedCardId
    ? gameState?.player?.deck?.getCardInHand(activeSelectedCardId) ?? null
    : null;

  const pendingInteraction = gameState?.pendingInteraction ?? null;
  const isInteractionActive = Boolean(pendingInteraction);

  const playState = useMemo(
    () => getCardPlayState(gameState, activeSelectedCardId, rawSelectedTargetIds),
    [gameState, activeSelectedCardId, rawSelectedTargetIds],
  );

  const battleViewModel = useMemo(
    () => getBattleViewModel(gameState, activeSelectedCardId, rawSelectedTargetIds),
    [{...gameState}, activeSelectedCardId, rawSelectedTargetIds],
  );

  const clearSelection = () => {
    setSelectedCardId(null);
    setRawSelectedTargetIds([]);
  };

  const toggleInteractionSelection = (targetId) => {
    if (!pendingInteraction || !targetId || !battleEngine) return;

    const legalEntityIds = new Set(pendingInteraction.validEntityIds ?? []);
    const legalCardIds = new Set(pendingInteraction.validCardInstanceIds ?? []);
    const legalOptionIds = new Set(pendingInteraction.validOptionIds ?? []);
    if (
      !legalEntityIds.has(targetId) &&
      !legalCardIds.has(targetId) &&
      !legalOptionIds.has(targetId)
    ) {
      return;
    }

    const current = Array.isArray(pendingInteraction.selectedTargetIds)
      ? [...pendingInteraction.selectedTargetIds]
      : [];

    const isSelected = current.includes(targetId);
    const max = pendingInteraction.maxSelections > 0
      ? pendingInteraction.maxSelections
      : current.length + 1;
    let nextSelection;

    if (isSelected) {
      nextSelection = current.filter((id) => id !== targetId);
    } else {
      nextSelection = [...current, targetId];
      if (max > 0 && nextSelection.length > max) {
        nextSelection = nextSelection.slice(-max);
      }
    }

    battleEngine.dispatch({
      type: "SET_INTERACTION_SELECTIONS",
      selectionIds: nextSelection,
    });
  };

  const handleOptionSelect = (optionId) => {
    if (!optionId) return;
    toggleInteractionSelection(optionId);
  };

  const handleTargetSelect = (targetId) => {
    if (isInteractionLocked || !targetId) return;

    if (isInteractionActive) {
      toggleInteractionSelection(targetId);
      return;
    }

    if (!activeSelectedCardId) return;

    setRawSelectedTargetIds((prev) => {
      if (prev.includes(targetId)) {
        return prev.filter((id) => id !== targetId);
      }

      return [...prev, targetId];
    });
  };

  const handleCardSelect = (card) => {
    if (!card?.instanceId || isInteractionLocked) return;

    if (isInteractionActive) {
      toggleInteractionSelection(card.instanceId);
      return;
    }

    if (activeSelectedCardId === card.instanceId) {
      clearSelection();
      return;
    }

    setSelectedCardId(card.instanceId);
    setRawSelectedTargetIds(getCardPlayState(gameState, card.instanceId, []).selectedTargetIds);
  };

  return {
    selectedCard,
    selectedCardId: activeSelectedCardId,
    selectedTargetIds: playState.selectedTargetIds,
    battleViewModel,
    clearSelection,
    handleTargetSelect,
    handleCardSelect,
    handleOptionSelect,
  };
}
