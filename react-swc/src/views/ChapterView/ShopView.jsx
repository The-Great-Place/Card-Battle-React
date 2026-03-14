import React from "react";
import { observer } from "mobx-react";
import "../BattleView/css/LootView.css";
import "../BattleView/css/CardUI.css";
import { useState } from "react";
import { HandCardView } from "../BattleView/HandCardView";
import { CardLibrary } from "../../engine/cardEffects";
import { getRandomLootChoices } from "../../engine/generateLoot";
import "./css/ShopView.css"

export const ShopView = observer(({ gameManager }) => {
    const [shopOpen, setShopOpen] = useState(false);
    const [lootChoices, setLootChoices] = useState(() => getRandomLootChoices(0, 10));
    console.log(lootChoices)
    const refreshShop = (e) => {
        gameManager.player.gold -= 2;
        e.stopPropagation();
        setLootChoices(getRandomLootChoices(0, 10));
    };
    let matchPrice = {
        "common":1,
        "uncommon": 2,
        "rare": 3,
        "epic": 4,
        "legendary": 5
    }
    const handleBuy = (card, cash) =>{
        gameManager.player.gold -= cash;
        gameManager.player.deck.discardPile.push({ ...card });
(card)
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
                            <p>Gold: {gameManager.player.gold}</p>
                            <button 
                                className='clickable refresh-button' 
                                onClick={refreshShop}
                            >
                                Refresh Shop
                            </button>
                        </div>
                        
                        <div className="shop-items">
                            {lootChoices.map((element, index) => (
                                <div key={index}>
                                <HandCardView 
                                     
                                    card={element} 
                                    player={null}
                                />
                                <button  onClick={() => handleBuy(element, matchPrice[element.rarity])}> Buy for {matchPrice[element.rarity]} </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
})