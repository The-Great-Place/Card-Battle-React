import { HandCardView } from "../HandCardView.jsx";
import { observer } from "mobx-react";
import { AnimatePresence } from "motion/react";

export const HandPanel= observer(({
  player,
  handCards,
  actionButton,
  selectedCard,
  onCardSelect,
  onAction,
  onCancelInteraction,
  selectionHint,
  interaction,
  interactionSelectionIds = [],
  onInteractionOptionSelect,
  interactionActive = false,
}) => {
  const optionList = Array.isArray(interaction?.options) ? interaction.options : [];

  return (
    <div className="handSection">
      {actionButton?.visible && (
        <button onClick={onAction} className="play-button" disabled={actionButton.disabled}>
          {actionButton.label}
        </button>
      )}
      {interactionActive && onCancelInteraction && (
        <button onClick={onCancelInteraction} className="play-button play-button--ghost">
          Cancel
        </button>
      )}
      {selectionHint && <div className="targetHint">{selectionHint}</div>}

      {optionList.length > 0 && onInteractionOptionSelect && (
        <div className="interaction-options">
          {optionList.map((option) => {
            const isSelected = interactionSelectionIds.includes(option.id);
            return (
              <button
                key={option.id ?? option.label}
                className={`interaction-option ${isSelected ? "interaction-option--selected" : ""}`}
                type="button"
                onClick={() => onInteractionOptionSelect(option.id)}
              >
                <span className="interaction-option__label">{option.label ?? option.id}</span>
                {option.description && (
                  <span className="interaction-option__desc">{option.description}</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      <div className='handRow'>
        <AnimatePresence initial={false}>
          {handCards.map(({ card, isPlayable, isInteractionTarget }, idx) => (
            <HandCardView
              key={card.instanceId ?? idx}
              onPress={() => onCardSelect(card)}
              player={player}
              card={card}
              card_idx={idx}
              selectedCard={selectedCard}
              canPlay={isPlayable || isInteractionTarget}
              isInteractionTarget={isInteractionTarget}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
})
