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
    this.charge = 5;
    this.isFrozen = false;

    makeObservable(this, {
      health: observable,
      shield: observable,
      intents: observable,
      alive: observable,
      takeDamage: action,
      addShield: action,
      checkAlive: action,
    });

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
    card.effects.forEach(effect => {
        this.modifyEffectStrength(effect)
        const effect_action = EFFECT_ACTIONS[effect.type];
        if (effect_action) {
            if (effect.target == "target"){ effect_action(target, effect.value); }
            else { effect_action(this, effect.value); }
        }
    });
    
    this.charge = 0;
    this.isFrozen = false;
  }
  modifyEffectStrength(effect){
    if (this.isFrozen == true){ effect = "NULL" }
    if (effect.type == "DAMAGE"){ effect.value += this.charge }

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
        this.intents.splice(0, 1);
    }
    drawCard(n){

      for (let i = 0; i < n; i++) {
        const c = this.deck.drawCard();
        if (!c) break;
      }
      console.log(this.deck)
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
        makeObservable(this, {
            playCard: action,
            initializeIntents: action,
            consumeIntent: action
        });
    }

    initializeIntents(possibleMoves) {
        this.intentGenerator = new LoopPattern(possibleMoves);
        makeObservable(this, {intentGenerator: observable})
        let lastTime = 0;
        // Pre-fill the window with 3 items
        for(let i = 0; i < 3; i++) {
            const intent = this.intentGenerator.generateNext(lastTime);
            this.intents.push(intent);
            lastTime = intent.time;
        }
    }
    consumeIntent() {
        this.intents.shift(); // Remove the used one
        
        // Generate a new one to keep the window at 3
        const lastIntent = this.intents[this.intents.length - 1];
        const newIntent = this.intentGenerator.generateNext(lastIntent.time);
        this.intents.push(newIntent);
    }
    playCard(target, card){
        super.playCard(target, CardLibrary[card]);
        this.consumeIntent()
    }


}