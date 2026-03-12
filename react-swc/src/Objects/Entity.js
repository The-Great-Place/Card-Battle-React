import { LoopPattern } from "./mobLogic";
import { makeAutoObservable, makeObservable, observable, action } from "mobx";
import { EFFECT_ACTIONS } from "../engine/cardEffects";
import { CardLibrary } from "../engine/cardEffects";

export class Entity {
  constructor(name, health, image) {
    this.name = name;
    this.health = health;
    this.maxHealth = health;
    this.intents = [];
    this.alive = true;
    this.image = image
    this.costReductionAmount = 0;
    this.costReductionCharges = 0;

    this.stack = {
      "burn": 0,
      "flow": 0,
      "freeze": 0,
      "charge": 0,
      "regeneratioin": [],
      "fortify": 0,
      "shield": 0,
      "static": false,
      "damageMultiplier": 1,
      "multiselect": 0
    }    

    makeObservable(this, {
      stack: observable,
      health: observable,
      intents: observable,
      alive: observable,
      costReductionAmount: observable,
      costReductionCharges: observable,
      takeDamage: action,
      applyStack: action,
      checkAlive: action,

    });
  }
  applyStack(type, amount){
    if (type == "Regeneration"){ this.stack["Regeneration"].push(turns); return;}
    if (type == "Stun"){ this.stack["Stun"] = true; }
    this.stack[type] += amount;
  }

  takeDamage(amount, type) {
    console.log(amount, type)
    console.log(this.health, amount)
    if (this.stack.shield >= amount){
     this.stack.shield -= amount;
    } else{
     amount -= this.stack.shield;
     this.stack.shield = 0;
     this.health -= amount;
    }
    this.checkAlive()
  }

  modifyHealth(amount) {this.health = Math.min(this.health + amount, this.maxHealth) }
  checkAlive() {if (this.health <= 0){this.alive = false;}}
  
  handleOverTurnEffects(){
    //handle Burn
    if (this.stack.burn > 0){
      const burnDamage = this.stack.burn;

      // burn 伤害直接打到这个单位
      this.takeDamage(burnDamage, "burn");

      // 伤害结算后 burn 减半，向下取整
      this.stack.burn = Math.floor(this.stack.burn / 2);
    }

    //handle Regen
    if (this.stack.regeneration > 0){
      const activeCount = this.stack.regeneration.length;
      if (activeCount <= 0) return;

      this.modifyHealth(activeCount * 5);

      this.stack.regeneration = this.stack.regeneration
        .map(turnsLeft => turnsLeft - 1)
        .filter(turnsLeft => turnsLeft > 0);
    }

    //handle Shield
    if (this.stack.shield > 0 && this.stack.fortify <= 0){
      Math.floor(this.stack.shield /= 2)
    }

    //handle Fortify
    if (this.stack.fortify > 0){
      this.fortify -= 1;
    }

    //handle Charge
    this.stack.charge = 0
  }



  getNextTurnShield() { return Math.floor(this.shield / 2);}
  playCard(target, card){
    card.effects.forEach(rawEffect => {
          
        const effect = { ...rawEffect }; 
        this.effectModifier(effect);
        
        const effect_action = EFFECT_ACTIONS[effect.type];
        if (effect_action) {
            if (effect.target == "target"){ 
              if (Array.isArray(target)){
                  target.forEach(element => {
                    effect_action(element, effect.value); 
                  });
              } else {
                effect_action(target, effect.value)
              }
            }
            else { effect_action(this, effect.value); }
        }
    });
    this.isFrozen = false;  
  }
  effectModifier(effect){
    if (this.stack.freeze == 3) {
      effect.type = "NULL";
      return;
    }
    if (effect.type == "DAMAGE"){ 
      effect.value += this.stack.charge
      effect.value *= this.stack.damageMultiplier
      this.stack.damageMultiplier = 1
    }
  }

}



export class Player extends Entity{
  constructor(name, health, image, deck) {
        super(name, health, image);
        this.deck = new Deck(deck);
        this.energy = 3;
        this.maxEnergy = 3;
        this.costReduction = []
        
        makeObservable(this, {
            deck: observable,
            costReduction: observable,
            energy: observable,
            playCard: action,
            drawCard: action,
            refreshSelected: action
        });
  }
  playCard(target, card, idx) {

    //Handle Energy Reduction
    let cost = card.energy_cost
    console.log(this.energy)
    if (this.costReduction.length > 0){ 
      cost -= this.costReduction[0]
      this.costReduction.splice(0,1)
    }
    this.energy -= cost;
    super.playCard(target, card);
    this.deck.discardFromHand(idx);
  }
  drawCard(n){
    for (let i = 0; i < n; i++) {
      const c = this.deck.drawCard();
      if (!c) break;
    }
  }
  addGameManager(gameManager){this.gameManager = gameManager}
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
    if (!card) return null;

    if (!card.exhaust) {
      this.discardPile.push(card);
    }

    return card;
  }

  discardHandAll() {
    while (this.hand.length > 0) {
      this.discardPile.push(this.hand.pop());
    }
  }
}


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
        super.playCard(target, CardLibrary[card]);
    }
}