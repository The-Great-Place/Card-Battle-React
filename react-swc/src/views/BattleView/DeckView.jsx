import { useState } from "react";

//Shows the card's in stacks
function groupCards(cards) {
  const map = {};

  cards.forEach(card => {
    const key = card.id; // use id so duplicates group correctly

    if (!map[key]) {
      map[key] = {
        card: card,
        count: 1
      };
    } else {
      map[key].count += 1;
    }
  });

  return Object.values(map);
}


//Deck info
function PileSection({ title, cards }) {
  const grouped = groupCards(cards).sort((a, b) =>
    a.card.name.localeCompare(b.card.name)
  );

  return (
    <div className="pileSection">
      <div className="pileSection__header">
        {title} ({cards.length})
      </div>

      <div className="pileSection__list">
        {grouped.length > 0 ? (
          grouped.map(({ card, count }, i) => (
            <div key={`${card.id}-${i}`} className="pileCardRow">
              <img src={card.image} alt={card.name} className="pileCardIcon" />

              <div className="pileCardInfo">
                <div className="pileCardName">{card.name}</div>
                <div className="pileCardDesc">{card.description || "No description"}</div>
              </div>

              {count > 1 && <div className="pileCardCount">x{count}</div>}
            </div>
          ))
        ) : (
          <div className="pileEmpty">Empty</div>
        )}
      </div>
    </div>
  );
}

export function DeckView({deck}){

    const [deckOpen, setDeckOpen] = useState(false);
    
    return(
        <>
        <button className='clickable deck-button' onClick={(e) => { e.stopPropagation();setDeckOpen(true); }}> Deck  </button>

        {deckOpen && (
            <div
            className="deckModalOverlay"
            onClick={() => setDeckOpen(false)}
            >
            <div
                className="deckModal"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="deckModal__top">
                <div className="deckModal__title">Deck Viewer</div>
                <button
                    className="deckModal__close clickable"
                    onClick={() => setDeckOpen(false)}
                >
                    ✕
                </button>
                </div>

                <div className="deckModal__content">
                <PileSection title="Draw Pile" cards={deck.drawPile} />
                <PileSection title="Discard Pile" cards={deck.discardPile} />
                </div>
            </div>
            </div>
        )}
        </>
    )
}