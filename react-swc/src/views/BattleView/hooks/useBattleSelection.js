import { useState } from "react";
import { getRequiredTargetCount } from "../../../engine/queries/battleQueries";

const EMPTY_TARGETS = { targets: [], idx: [] };
const EMPTY_CARD = { card: null, instanceId: null };

export function useBattleSelection(player) {
  const [selectedCard, setSelectedCard] = useState(EMPTY_CARD);
  const [selectedTargets, setSelectedTargets] = useState(EMPTY_TARGETS);

  const clearSelection = () => {
    setSelectedCard(EMPTY_CARD);
    setSelectedTargets(EMPTY_TARGETS);
  };

  const handleTargetSelect = (target, idx) => {
    if (!selectedCard.card) return;

    setSelectedTargets((prev) => {
      const existingIndex = prev.idx.indexOf(idx);
      if (existingIndex >= 0) {
        return {
          targets: prev.targets.filter((_, i) => i !== existingIndex),
          idx: prev.idx.filter((_, i) => i !== existingIndex),
        };
      }

      const nextTargets = [...prev.targets, target];
      const nextIdx = [...prev.idx, idx];
      const maxTargets = getRequiredTargetCount(player, selectedCard.card);

      if (nextTargets.length > maxTargets) {
        nextTargets.shift();
        nextIdx.shift();
      }

      return { targets: nextTargets, idx: nextIdx };
    });
  };

  const handleCardSelect = (card) => {
    if (selectedCard.instanceId === card.instanceId) {
      clearSelection();
      return;
    }

    setSelectedCard({ card, instanceId: card.instanceId });
    if (getRequiredTargetCount(player, card) === 0) {
      setSelectedTargets({ targets: [player], idx: [0] });
      return;
    }

    setSelectedTargets(EMPTY_TARGETS);
  };

  return {
    selectedCard,
    selectedTargets,
    selectedTargetIds: selectedTargets.targets.map((target) => target.id),
    clearSelection,
    handleTargetSelect,
    handleCardSelect,
  };
}
