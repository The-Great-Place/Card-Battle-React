import { makeObservable, observable, action } from "mobx";
import { Deck } from "./Card";
import { getCardCost } from "../engine/queries/battleQueries";
import { getCardDefinition } from "../engine/definitions/cardRegistry";
import {
  applyStatus as applyRuntimeStatus,
  getStatusesByDefinition as getRuntimeStatusesByDefinition,
  removeStatus as removeRuntimeStatus,
} from "../engine/resolvers/statusHelpers";
import { consumeModifierUse } from "../engine/resolvers/modifierHelpers";
import {
  consumePlayerPlayStatuses,
  getNextTurnShieldValue,
  prepareEffectWithStatuses,
  processTurnStatuses,
  resolveDamageWithStatuses,
} from "../engine/resolvers/entityStatusRuntime";
import { resolveCardPlay } from "../engine/resolvers/cardPlayRuntime";

export class Entity {
  constructor(name, health, image) {
    this.id = crypto.randomUUID();
    this.name = name;
    this.health = health;
    this.maxHealth = health;
    this.intents = [];
    this.alive = true;
    this.image = image
    this.statuses = [];

    makeObservable(this, {
      health: observable,
      intents: observable,
      alive: observable,
      statuses: observable.shallow,
      takeDamage: action,
      checkAlive: action,
      applyStatus: action,
      removeStatus: action,
    });
  }
  applyStatus(statusInput) {
    return applyRuntimeStatus(this, statusInput);
  }

  removeStatus(statusInstanceId) {
    return removeRuntimeStatus(this, statusInstanceId);
  }

  getStatusesByDefinition(definitionId) {
    return getRuntimeStatusesByDefinition(this, definitionId);
  }

  takeDamage(amount) {
    resolveDamageWithStatuses(this, amount);
    this.checkAlive()
  }

  modifyHealth(amount) {this.health = Math.min(this.health + amount, this.maxHealth) }
  checkAlive() {if (this.health <= 0){this.alive = false;}}
  
  handleOverTurnEffects(){
    processTurnStatuses(this);
  }



  getNextTurnShield() {
    return getNextTurnShieldValue(this);
  }
  playCard(target, card){
    resolveCardPlay(this, target, card, (effect) => this.effectModifier(effect));
    this.isFrozen = false;  
  }
  effectModifier(effect){
    prepareEffectWithStatuses(this, effect);
  }

}



export class Player extends Entity{
  constructor(name, health, image, deck) {
        super(name, health, image);
        this.deck = new Deck(deck);
        this.energy = 3;
        this.maxEnergy = 3;
        this.gold = 0
        
        makeObservable(this, {
            deck: observable,
            energy: observable,
            gold: observable,
            playCard: action,
            drawCard: action,
            // refreshSelected: action
        });
  }
  playCard(target, card, cardInstanceId) {
    const cost = getCardCost(this, card);
    this.energy -= cost;
    const init_prep = consumePlayerPlayStatuses(this);
    const exhaustModifiers = card?.getModifiersByKind ? card.getModifiersByKind("exhaust_on_use") : [];
    const shouldExhaust = card?.exhaust || exhaustModifiers.length > 0;
    for (let i = 0; i < init_prep; i++){
      super.playCard(target, card);
    }
    exhaustModifiers.forEach((modifier) => {
      if (modifier.remainingUses != null) {
        consumeModifierUse(card, modifier.instanceId, 1);
      }
    });
    this.deck.discardFromHand(cardInstanceId, shouldExhaust);
  }
  drawCard(n){
    for (let i = 0; i < n; i++) {
      const c = this.deck.drawCard();
      if (!c) break;
    }
  }


  // refreshSelected(cardInstanceIds) {
  //   if (!cardInstanceIds || cardInstanceIds.length === 0) return 0;

  //   const sorted = [...cardInstanceIds]
  //     .map(instanceId => ({
  //       instanceId,
  //       idx: this.deck.getHandIndex(instanceId),
  //     }))
  //     .filter(({ idx }) => idx >= 0)
  //     .sort((a, b) => b.idx - a.idx);

  //   let discarded = 0;
  //   for (const { idx } of sorted) {
  //     const card = this.deck.hand[idx];
  //     if (!card) continue;
  //     this.deck.addCardInstance(card);
  //     this.deck.hand.splice(idx, 1);
  //     discarded++;
  //   }

  //   // Draw back the same number
  //   this.drawCard(discarded);
  //   return discarded;
  // }
}

/*Updated Deck*/ 
// class Deck {
//   constructor(initDeck) {
//     const defs = initDeck.map(c => CardLibrary[c]);

//     this.hand = [];
//     this.drawPile = [...defs];     // cards available to draw
//     this.discardPile = [];
//     this.allCards = defs;

//     makeAutoObservable(this);

//     this.shuffle(this.drawPile);
//   }

//   shuffle(array) {
//     // Fisher–Yates
//     for (let i = array.length - 1; i > 0; i--) {
//       const j = Math.floor(Math.random() * (i + 1));
//       [array[i], array[j]] = [array[j], array[i]];
//     }
//   }

//   reshuffleDiscardIntoDraw() {
//     if (this.discardPile.length === 0) return;
//     this.drawPile = [...this.discardPile];
//     this.discardPile = [];
//     this.shuffle(this.drawPile);
//   }

//   drawCard() {
//     if (this.drawPile.length === 0) {
//       this.reshuffleDiscardIntoDraw();
//     }
//     if (this.drawPile.length === 0) return null; // no cards anywhere

//     // draw top (or random). top feels better for card games:
//     const card = this.drawPile.pop();
//     this.hand.push(card);
//     return card;
//   }

//   discardFromHand(handIndex) {
//     const [card] = this.hand.splice(handIndex, 1);
//     if (!card) return null;

//     if (!card.exhaust) {
//       this.discardPile.push(card);
//     }

//     return card;
//   }

//   discardHandAll() {
//     while (this.hand.length > 0) {
//       this.discardPile.push(this.hand.pop());
//     }
//   }
// }


export class Enemy extends Entity {
    constructor(name, health, image, possibleMoves, pattern_type){
        super(name, health, image);

        this.intentGenerator = new pattern_type(possibleMoves);
        this.intents = this.intentGenerator.generateNext();

        makeObservable(this, {
          playCard: action,
          intentGenerator: observable,
        });
    }


    getNextIntent() {
        this.intents = this.intentGenerator.generateNext()    }


    playCard(target, card){
        const definition = getCardDefinition(card);
        if (!definition) return;
        super.playCard(target, definition);
    }
}
