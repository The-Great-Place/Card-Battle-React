import { HandCardView } from "../HandCardView.jsx";
import { observer } from "mobx-react";
import { AnimatePresence } from "motion/react";
import { canPlaySelectedCard, getPlayableCards } from "../../../engine/queries/battleQueries";

export const HandPanel= observer(({ gameState, player, selectedCard, selectedTargetIds, onCardSelect, onPlayCard }) => {
  const playableIds = new Set(getPlayableCards(gameState).map((card) => card.instanceId));
  const canPlaySelection = canPlaySelectedCard(gameState, selectedCard, selectedTargetIds);

  return (
    <div className="handSection">
      {selectedCard.card && (
        <button onClick={onPlayCard} className="play-button" disabled={!canPlaySelection}>
          Play Card
        </button>
      )}

      <div className='handRow'>
        <AnimatePresence initial={false}>
          {player.deck.hand.map((card, idx) => (
            <HandCardView
              key={card.instanceId ?? idx}
              onPress={() => onCardSelect(card)}
              player={player}
              card={card}
              card_idx={idx}
              selectedCard={selectedCard}
              canPlay={playableIds.has(card.instanceId)}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
})
