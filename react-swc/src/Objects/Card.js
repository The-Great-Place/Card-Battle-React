import { makeAutoObservable } from 'mobx'
import { CardLibrary } from "../engine/cardEffects";

export class Deck {
  constructor(initDeck) {
    const cards = initDeck.map(cardId => new CardInstance(CardLibrary[cardId]));

    this.hand = [];
    this.drawPile = [...cards];     // cards available to draw
    this.discardPile = [];
    this.allCards = cards;

    makeAutoObservable(this);

    this.shuffle(this.drawPile);
  }
  gainCard(cardId){
    const card = new CardInstance(CardLibrary[cardId]);
    this.discardPile.push(card);
    this.allCards.push(card);
    return card;
  }

  addCardInstance(card, zone = "discardPile") {
    if (!card) return null;

    this[zone].push(card);
    if (!this.allCards.includes(card)) {
      this.allCards.push(card);
    }

    return card;
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
    const card = this.drawPile.pop()
    this.hand.push(card);
    return card
  }
  getCardInHand(instanceId) {
    return this.hand.find(card => card.instanceId === instanceId) ?? null;
  }

  getHandIndex(instanceId) {
    return this.hand.findIndex(card => card.instanceId === instanceId);
  }

  discardFromHand(instanceId) {
    const handIndex = this.getHandIndex(instanceId);
    if (handIndex < 0) return null;

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

export class CardInstance {
  constructor(definition, overrides = {}) {
    this.instanceId = crypto.randomUUID()
    this.definitionId = definition.id

    this.name = definition.name
    this.description = definition.description
    this.image = definition.image
    this.rarity = definition.rarity
    this.targets = definition.targets
    this.effects = structuredClone(definition.effects ?? [])
    this.tags = [...(definition.tags ?? [])]

    this.baseCost = definition.energy_cost ?? 0
    this.costOverride = overrides.costOverride ?? null

    this.exhaust = overrides.exhaust ?? definition.exhaust ?? false
    this.temporary = overrides.temporary ?? false
    this.retain = overrides.retain ?? false

    this.charges = overrides.charges ?? null

    this.permanentModifiers = []
    this.battleModifiers = []
    this.ephemeralModifiers = []

    this.state = {}
  }

  getCurrentCost() {
    return this.costOverride ?? this.baseCost
  }

  static fromCardId(cardId, overrides = {}) {
    const definition = CardLibrary[cardId];
    if (!definition) return null;
    return new CardInstance(definition, overrides);
  }
}
