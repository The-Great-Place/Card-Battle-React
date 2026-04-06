import React from "react";
import { observer } from "mobx-react";
import { getCardDefinition } from "../../engine/definitions/cardRegistry";
import "./css/LootView.css";
import "./css/CardUI.css";

export const LootView = observer(({ loot, onPick, onSkip }) => {
  return (
    <div className="lootOverlay">
      <div className="lootPanel">
        <div className="lootTitle">Choose a Reward</div>
        <div className="lootSubtitle">Pick 1 card to add to your deck</div>

        <div className="lootCards">
          {loot.map((cardId, i) => {
            const card = getCardDefinition(cardId.id)
            if (!card) return null;
            const cost = card.energy_cost ?? 1;
            const rarity = card.rewardRarity || card.rarity || "common";

            return (
              <div key={i} className="lootCardWrap">
                <button
                  className="lootCard card card--fullart"
                  onClick={() => onPick(cardId.id)}
                >
                  <img className="card__artFull" src={card.image} alt={card.name} />
                  <div className="card__vignette" aria-hidden="true" />

                  <div className="card__cost">
                    <span className="card__costValue">{cost}</span>
                  </div>

                  <div className="card__name">
                    <span className="card__nameText">{card.name}</span>
                  </div>

                  <div className="card__desc">
                    <div className="card__descInner">
                      • {card.description || "No description"}
                    </div>
                  </div>

                  <img
                    className="card__frame"
                    src="./Card/Frame.png"
                    alt=""
                    aria-hidden="true"
                  />
                </button>

                <div className={`lootRarityUnder lootRarityUnder--${rarity}`}>
                  {rarity.toUpperCase()}
                </div>
              </div>
            );
          })}
        </div>

        <button className="lootSkip" onClick={onSkip}>
          Skip
        </button>
      </div>
    </div>
  );
});
