import { LoopPattern } from "./mobLogic";
import { makeAutoObservable, makeObservable, observable, action } from "mobx";
import { EFFECT_ACTIONS } from "../engine/cardEffects";
import { CardLibrary } from "../engine/cardEffects";

export class Entity {
  constructor(name, health, image) {
    this.name = name;
    this.health = health;
    this.maxHealth = health;
    this.shield = 0;
    this.intents = [];
    this.alive = true;
    this.image = image
    this.onFire = 0;
    this.onWet = 0;
    this.onElec = 0;
    this.charge = 0;
    this.isFrozen = false;
    this.chargeConsumed = false;

    makeObservable(this, {
    onFire: observable,
    onWet: observable,
    onElec: observable,
    charge: observable,
    isFrozen: observable,
    health: observable,
    shield: observable,
    intents: observable,
    alive: observable,
    takeDamage: action,
    addShield: action,
    checkAlive: action,
    });
  }
  applyfire(amount){
    this.onFire += amount
  }
  takeDamage(amount, type) {
    if (type=="fire") {amount += this.onFire; }
    if (type=="elec") {amount += this.onWet}

    if (this.shield >= amount){
     this.shield -= amount;
    } else{
     amount -= this.shield;
     this.shield = 0;
     this.health -= amount;
    }

    this.checkAlive()
  }
  modifyHealth(amount) {this.health = Math.min(this.health + amount, this.maxHealth) }
  addShield(amount) {this.shield += amount; }
  checkAlive() {if (this.health <= 0){this.alive = false;}}

  playCard(target, card){
    console.log(this, this.isFrozen)
    this.chargeConsumed = false;


    card.effects.forEach(rawEffect => {
          
        const effect = { ...rawEffect }; 
        this.effectModifier(effect);
        
        const effect_action = EFFECT_ACTIONS[effect.type];
        if (effect_action) {
            if (effect.target == "target"){ effect_action(target, effect.value); }
            else { effect_action(this, effect.value); }
        }
    });
    if (this.chargeConsumed) {this.charge = 0;}
    this.isFrozen = false;  
  }
  effectModifier(effect){
 if (this.isFrozen) {
    effect.type = "NULL";
    return;
  }
    if (effect.type == "DAMAGE"){ 
      effect.value += this.charge
      this.chargeConsumed = true;
    }
  }

}



export class Player extends Entity{
    constructor(name, health, image, deck) {
        super(name, health, image);
        this.deck = new Deck(deck);
        
        makeObservable(this, {
            deck: observable,
            playCard: action,
            drawCard: action,
            refreshSelected: action
        });
        this.drawCard(4);
    }
    addGameManager(gameManager){ this.gameManager = gameManager; }
    playCard(target, card, idx) {
        super.playCard(target, card);
        this.deck.discardFromHand(idx);
    }
    drawCard(n){
  for (let i = 0; i < n; i++) {
    const c = this.deck.drawCard();
    if (!c) break;
  }
}
refreshSelected(handIndexes) {
  // handIndexes: array of indices to discard
  if (!handIndexes || handIndexes.length === 0) return 0;

  // IMPORTANT: discard from highest index first so indices don't shift
  const sorted = [...handIndexes].sort((a, b) => b - a);

  let discarded = 0;
  for (const idx of sorted) {
    const card = this.deck.hand[idx];
    if (!card) continue;
    this.deck.discardPile.push(card);
    this.deck.hand.splice(idx, 1);
    discarded++;
  }

  // Draw back the same number
  this.drawCard(discarded);
  return discarded;
}
}
/*Updated Deck*/ 
class Deck {
  constructor(initDeck) {
    const defs = initDeck.map(c => CardLibrary[c]);

    this.hand = [];
    this.drawPile = [...defs];     // cards available to draw
    this.discardPile = [];
    this.allCards = defs;

    makeAutoObservable(this);

    this.shuffle(this.drawPile);
  }

  shuffle(array) {
    // Fisher–Yates
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  reshuffleDiscardIntoDraw() {
    if (this.discardPile.length === 0) return;
    this.drawPile = [...this.discardPile];
    this.discardPile = [];
    this.shuffle(this.drawPile);
  }

  drawCard() {
    if (this.drawPile.length === 0) {
      this.reshuffleDiscardIntoDraw();
    }
    if (this.drawPile.length === 0) return null; // no cards anywhere

    // draw top (or random). top feels better for card games:
    const card = this.drawPile.pop();
    this.hand.push(card);
    return card;
  }

  discardFromHand(handIndex) {
    const [card] = this.hand.splice(handIndex, 1);
    if (card) this.discardPile.push(card);
    return card;
  }

  discardHandAll() {
    while (this.hand.length > 0) {
      this.discardPile.push(this.hand.pop());
    }
  }
}


export class Enemy extends Entity {
    constructor(name, health, image){
        super(name, health, image);

        this.possibleMoves = [];
        this.moveIndex = 0;

        makeObservable(this, {
            playCard: action,
            initializeIntents: action,
            consumeIntent: action,
            possibleMoves: observable,
            moveIndex: observable,
        });
    }

    initializeIntents(possibleMoves) {
        this.possibleMoves = (possibleMoves || []).map(move => ({ ...move }));
        this.moveIndex = 0;
        this.intents = [];

        // 预填 3 个 intent
        for (let i = 0; i < 3; i++) {
            const nextIntent = this.getNextIntent();
            if (nextIntent) {
                this.intents.push(nextIntent);
            }
        }
    }

    getNextIntent() {
        if (!this.possibleMoves.length) return null;

        const baseMove = this.possibleMoves[this.moveIndex % this.possibleMoves.length];
        this.moveIndex += 1;

        // 一定要 clone，不要直接共用原对象
        return { ...baseMove };
    }

    consumeIntent() {
        this.intents.shift();

        const newIntent = this.getNextIntent();
        if (newIntent) {
            this.intents.push(newIntent);
        }
    }

    playCard(target, card){
        super.playCard(target, CardLibrary[card]);
        this.consumeIntent();
    }
}