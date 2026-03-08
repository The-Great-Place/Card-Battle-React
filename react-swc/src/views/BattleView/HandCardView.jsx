import "../CardUI.css";

export const HandCardView = ({ onPress, player, card, card_idx, selectedCardIdx }) => {
    
    if (player===null) return (
        <button
            className="card card--fullart"
        >
            <img className="card__artFull" src={card.image} alt={card.name} />
            <div className="card__vignette" aria-hidden="true" />

            <div className="card__cost">
                <span className="card__costValue">{card.energy_cost}</span>
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
        </button>


    )
    
    const baseCost = card.energy_cost ?? 1;
    const reduction =
        (player.gameManager?.player?.costReductionCharges ?? 0) > 0
            ? (player.gameManager?.player?.costReductionAmount ?? 0)
            : 0;

    const displayCost = Math.max(0, baseCost - reduction);
    const canPlay = (player.gameManager?.energy ?? 0) >= displayCost;
    
    return (
        <button
            onClick={(e) => {
                e.stopPropagation();
                if (canPlay) onPress();
            }}
            className={`card card--fullart ${card_idx === selectedCardIdx ? 'selectedCard' : ''} ${!canPlay ? 'card--disabled' : ''}`}
            style={{ "--i": card_idx, "--n": (player ? player.deck.hand.length: "") }}
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
        </button>
    );
};