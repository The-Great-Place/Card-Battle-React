import "./css/CardUI.css";
import { motion } from "motion/react";
import { observer } from "mobx-react";
import {
  getHandCardButtonMotion,
  getHandCardSlotMotion,
} from "../../animations/cardMotion";
import { getCardCost } from "../../engine/queries/battleQueries";

export const HandCardView = observer(({ onPress, player, card, card_idx, selectedCard, canPlay = true, isInteractionTarget = false }) => {
  if (player === null) {
    return (
      <motion.button
        className="card card--fullart"
        whileHover={{ y: -8, scale: 1.04 }}
        transition={{ duration: 0.11 }}
      >
        <img className="card__artFull" src={card.image} alt={card.name} />
        <div className="card__vignette" aria-hidden="true" />

        <div className="card__cost">
          <span className="card__costValue">
            {card.getCurrentCost ? card.getCurrentCost() : (card.energy_cost ?? card.baseCost ?? 0)}
          </span>
        </div>

        <div className="card__name">
          <span className="card__nameText">{card.name}</span>
        </div>

        <div className="card__desc">
          <div className="card__descInner">
            • {card.description || "No description"}
          </div>
        </div>

        <img className="card__frame" src="./Card/Frame.png" alt="" aria-hidden="true" />
      </motion.button>
    );
  }

  const displayCost = getCardCost(player, card);
  const isSelected = card.instanceId === selectedCard?.instanceId;
  const slotMotion = getHandCardSlotMotion({ isSelected });
  const buttonMotion = getHandCardButtonMotion({ isSelected, canPlay });

  const highlightClass = isInteractionTarget ? "card--interaction-target" : "";

  return (
    <motion.div
      className="handCardSlot"
      style={{ "--i": card_idx, "--n": player ? player.deck.hand.length : "" }}
      {...slotMotion}
    >
      <motion.button
        onClick={(e) => {
          e.stopPropagation();
          if (canPlay) onPress();
        }}
        className={`card card--fullart ${isSelected ? "selectedCard" : ""} ${!canPlay ? "card--disabled" : ""} ${highlightClass}`}
        style={{ "--i": card_idx, "--n": player ? player.deck.hand.length : "" }}
        {...buttonMotion}
      >
        <img className="card__artFull" src={card.image} alt={card.name} />
        <div className="card__vignette" aria-hidden="true" />

        <div className="card__cost">
          <span className="card__costValue">{displayCost}</span>
        </div>

        <div className="card__name">
          <span className="card__nameText">{card.name}</span>
        </div>

        <div className="card__desc">
          <div className="card__descInner">
            • {card.description || "No description"}
          </div>
        </div>

        <img className="card__frame" src="./Card/Frame.png" alt="" aria-hidden="true" />
      </motion.button>
    </motion.div>
  );
});
