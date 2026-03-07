
export const HandCardView = ({ onPress, player, card, card_idx, selectedCardIdx}) => {

    return(
        <button onClick={(e) => {e.stopPropagation(); onPress(); }}
        className={`card card--fullart ${card_idx === selectedCardIdx ? 'selectedCard' : ''}`}
        style={{ "--i": card_idx, "--n": player.deck.hand.length }} >

            {/* Full-card art */}
            <img className="card__artFull" src={card.image} alt={card.name} />

            {/* Dark vignette for readability */}
            <div className="card__vignette" aria-hidden="true" />

            {/* Top-left cost */}
            <div className="card__cost">
                <span className="card__costValue">{card.energy_cost ?? 1}</span>
            </div>

            {/* Pips under cost */}
            {/* <div className="card__pips">
                {Array.from({ length: Math.min(card.traits?.length ?? 0, 6) }).map((_, i) => (
                <span key={i} className="card__pip" />
                ))}
            </div> */}

            {/* Name banner */}
            <div className="card__name">
                <span className="card__nameText">{card.name}</span>
            </div>

            {/* Description */}
            <div className="card__desc">
                <div className="card__descInner">
                • {card.description || 'No description'}
                </div>
            </div>

            {/* Frame overlay */}
            <img className="card__frame" src="./Card/Frame.png" alt="" aria-hidden="true" />
        </button>
    )
}

  // For Refresh hand and selectable discard in the future
//   const [refreshMode, setRefreshMode] = useState(false);
//   const [refreshSet, setRefreshSet] = useState(new Set());
//   const toggleRefreshPick = (idx) => {
//     setRefreshSet(prev => {
//       const next = new Set(prev);
//       if (next.has(idx)) next.delete(idx);
//       else next.add(idx);
//       return next;
//     });
//   };

//   const doRefresh = () => {
//     const indexes = Array.from(refreshSet);
//     const n = player.refreshSelected(indexes);
//     setRefreshSet(new Set());
//     setRefreshMode(false);
//     if (n > 0) gameManager.progressTime(1); // or whatever time cost you want
//   };