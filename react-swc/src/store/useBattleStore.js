import { create } from 'zustand';
import { makeAutoObservable } from "mobx";
class Card {
  constructor(name, cost, exec, suggested){
    this.name = name;
    this.cost = cost;
    this.exec = exec;
    this.suggested = suggested //can be self, opponent, allies
  }
}

class Deck {
  constructor(initDeck){
    this.hand = [];
    this.drawn = initDeck;
    this.discard = [];
    this.allCards = initDeck;
    makeAutoObservable(this);
  }

  drawCard(){
    let newCardIdx = Math.floor(Math.random()*this.drawn.length)
    this.hand.push(this.drawn[newCardIdx])
  }
}

class Entity {
  constructor(name, health, deck) {
    this.name = name;
    this.health = health;
    this.maxHealth = health;
    this.deck = new Deck(deck);
    this.intents = []
    this.drawCard(3)
    if (this.name !='player') {
      this.intents = [
        {"round": this.deck.hand[0].cost + 1*Math.ceil(2*Math.random()), "card": this.deck.hand[0]},
        {"round": this.deck.hand[1].cost + 2*Math.ceil(2*Math.random()), "card": this.deck.hand[1]},
        {"round": this.deck.hand[2].cost + 3*Math.ceil(2*Math.random()), "card": this.deck.hand[2]},
      ]
    }
    makeAutoObservable(this); // Magic happens here
  }
  takeDamage(amount) { this.health -= amount; }
  addShield(amount) {this.shield += amount; }
  playCard(target, idx) {
    const card = this.deck.hand[idx];
    card.exec(this, target);
    this.deck.hand.splice(idx, 1);
  }
  drawCard(n){ for (let i = 0; i<n; i++) this.deck.drawCard() }
}



// Define your cards with "Effect" strings or logic keys
const basic_attack = new Card("Basic Attack", 1, function(a, b){b.takeDamage(3)});
const basic_shield = new Card("Basic Shield", 2, function(a, b){b.addShield(5)});
const e1 = new Entity('e1', 10, [basic_attack, basic_attack, basic_shield])
const e2 = new Entity('e1', 10, [basic_attack, basic_attack, basic_shield])
const e3 = new Entity('e1', 10, [basic_attack, basic_attack, basic_shield])

const player = new Entity('player', 100, [basic_attack, basic_attack, basic_attack, basic_attack, basic_shield, basic_shield])

export const useGameStore = create((set) => ({
  // --- STATE ---
  player: player,
  enemies: [[e1, e2, e3]],
  round: 0,
  action_queue:[]
}));