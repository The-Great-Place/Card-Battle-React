import { observer } from "mobx-react";
import "../BattleView/css/LootView.css";
import "../BattleView/css/CardUI.css";
import { useState } from "react";
import { HandCardView } from "../BattleView/HandCardView";
import { CardLibrary } from "../../engine/cardEffects";
import { getRandomLootChoices } from "../../engine/generateLoot";
import "./css/ShopView.css"

export const ShopView = observer(({ gameState, battleEngine }) => {
    const [shopOpen, setShopOpen] = useState(false);
    const [lootChoices, setLootChoices] = useState(() => getRandomLootChoices(0, 10));
    const refreshShop = (e) => {
        e.stopPropagation();
        const refreshed = battleEngine.dispatch({ type: "REFRESH_SHOP", cost: 2 });
        if (!refreshed) return;
        setLootChoices(getRandomLootChoices(0, 10));
    };
    let matchPrice = {
        "common":1,
        "uncommon": 2,
        "rare": 3,
        "epic": 4,
        "legendary": 5
    }
    const handleBuy = (cardId, cash) =>{
        battleEngine.dispatch({ type: "BUY_CARD", cardId, cost: cash });
    }

    return (
        <>
            <button className='clickable deck-button' onClick={(e) => { 
                e.stopPropagation(); 
                setShopOpen(true); 
            }}> 
                Shop  
            </button>

            {shopOpen && (
                <div
                    className="deckModalOverlay"
                    onClick={() => setShopOpen(false)}
                >
                    <div className="shop-content" onClick={(e) => e.stopPropagation()}>
                        <div className="shop-header">
                            <p>Gold: {gameState.player.gold}</p>
                            <button 
                                className='clickable refresh-button' 
                                onClick={refreshShop}
                            >
                                Refresh Shop
                            </button>
                        </div>
                        
                        <div className="shop-items">
                            {lootChoices.map((element, index) => {
                                const card = CardLibrary[element.id];
                                if (!card) return null;

                                return (
                                    <div key={element.id ?? index}>
                                        <HandCardView 
                                            card={card} 
                                            player={null}
                                        />
                                        <button onClick={() => handleBuy(element.id, matchPrice[element.rewardRarity])}>
                                            Buy for {matchPrice[element.rewardRarity]}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
})
