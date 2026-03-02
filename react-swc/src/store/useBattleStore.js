import { create } from 'zustand';
import { produce } from 'immer';


// Factories now return plain objects
const createCard = (name, time, effect) => ({ name, time, effect });

const createDeck = (initCards) => ({
  hand: [],
  drawn: [...initCards],
  discard: [],
  allCards: [...initCards],
});

const createEntity = (name, health, initCards) => ({
  name,
  health,
  shield: 0,
  deck: createDeck(initCards),
  intents: [1, 2, 3],
});

// Define your cards with "Effect" strings or logic keys
const basic_attack = createCard("Basic Attack", 1, "ATTACK_3");
const basic_shield = createCard("Basic Shield", 2, "SHIELD_5");

export const useGameStore = create((set) => ({
  // --- STATE ---
  player: 0,
  round: 0,
  entities:{
    player: createEntity("Hero", 100, [basic_attack, basic_shield]),
    enemies: [[createEntity("e1", 10, [basic_attack])]],
    getTarget: function(target){
        if(target[0]=='player') return this.player
        if(target[0] == 'enemies') return this.enemies[0][target[1]]
    }
  },

  // --- ACTIONS (The Logic) ---
  
  playerDrawCard: () => set(produce(state => {
    const deck = state.entities.player.deck;
    if (deck.allCards.length > 0) {
      const idx = Math.floor(Math.random() * deck.allCards.length);
      deck.hand.push(deck.allCards[idx]);
    }
  })),
  playerUsedCard: (cardIdx) => set(produce(state => {
    state.entities.player.deck.hand.splice(cardIdx, 1);
  })),

  playCard: (user, target1, cardIdx) => set(produce(state => {
    const card = state.entities.player.deck.hand[cardIdx];
    const target = state.entities.getTarget(target1); // Current wave

    // Logic for Damage
    if (card.effect === "ATTACK_3") {
      let damage = 3;
      if (target.shield >= damage) {
        target.shield -= damage;
      } else {
        damage -= target.shield;
        target.shield = 0;
        target.health -= damage;
      }
    } 
    
    // Logic for Shield
    if (card.effect === "SHIELD_5") {
      target.shield += 5;
    }
  })),
}));