import { makeAutoObservable } from "mobx";
import { CardLibrary } from "../engine/cardEffects";

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));



function buildRewardPools() {
  const pools = {
    common: [],
    uncommon: [],
    rare: [],
  };

  Object.entries(CardLibrary).forEach(([id, card]) => {
    if (!card.rewardable) return;

    const rarity = card.rarity || "common";

    if (!pools[rarity]) {
      pools[rarity] = [];
    }

    pools[rarity].push(id);
  });

  return pools;
}

const REWARD_POOLS = buildRewardPools();

function randomFrom(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function rollRarityForWave(waveIndex) {
  const r = Math.random();

  //for waves if needed later
  //if (waveIndex === 0) {
   // if (r < 0.8) return "common";
  //  if (r < 0.97) return "uncommon";
   // return "rare";
 // }

  if (r < 0.5) return "common";
  if (r < 0.8) return "uncommon";
  return "rare";


}

function getRandomLootChoices(waveIndex, count = 3) {
  const chosenIds = new Set();
  const rewards = [];
    
  let safety = 0;
  while (rewards.length < count && safety < 100) {
    safety++;

    const rarity = rollRarityForWave(waveIndex);
    const pool = REWARD_POOLS[rarity] || [];
    if (pool.length === 0) continue;

    const id = randomFrom(pool);
    if (chosenIds.has(id)) continue;

    const card = CardLibrary[id];
    if (!card) continue;

    chosenIds.add(id);
    rewards.push({
      ...card,
      rewardRarity: rarity,
    });
  }

  return rewards;
}

export class GameManager {
  constructor(player, enemies, restartCallback = null) {
    this.time = 0;
    this.player = player;
    this.enemies = enemies;
    this.enemies_index = 0;

    this.lootOpen = false;
    this.pendingLoot = [];
    this.runComplete = false;
    this.runFailed = false;

    this.restartCallback = restartCallback;

    makeAutoObservable(this, {}, { autoBind: true });
  }

  get currentEnemies() {
    return this.enemies[this.enemies_index] || [];
  }

  progressTime(t) {
    if (this.lootOpen || this.runComplete || this.runFailed) return;

    for (let i = 0; i < t + 1; i++) {
      if (i !== 0) this.time += 1;
      this.runIntents();
      this.updateGame();

      if (this.lootOpen || this.runComplete || this.runFailed) break;
    }
  }

  runIntents() {
    const pi = this.player.intents?.[0];
    if (pi && pi.time <= this.time) {
      this.player.playCard(pi.target, this.player.deck.hand[pi.card_idx], pi.card_idx);
    }

    this.currentEnemies.forEach((e) => {
      if (!e.alive) return;

      const ei = e.intents?.[0];
      const matchTarget = { player: this.player, self: e };

      if (ei && ei.time <= this.time) {
        e.playCard(matchTarget[ei.target], ei.card);
      }
    });
  }

  updateGame() {
    this.player.checkAlive();
    this.currentEnemies.forEach((e) => e.checkAlive());

    // if (!this.player.alive) {
    //   this.runFailed = true;
    //   return;
    // }

    const allEnemyDead =
      this.currentEnemies.length > 0 &&
      this.currentEnemies.every((e) => !e.alive);

    if (!allEnemyDead) return;

    this.time = 0;

    const isLastWave = this.enemies_index >= this.enemies.length - 1;

    if (isLastWave) {
      this.runComplete = true;
      return;
    }

    this.pendingLoot = getRandomLootChoices(this.enemies_index, 3);
    this.lootOpen = true;
  }

  claimLoot(card) {
    if (card) {
      this.player.deck.discardPile.push({ ...card });
    }

    this.pendingLoot = [];
    this.lootOpen = false;
    this.enemies_index += 1;
  }

  skipLoot() {
    this.pendingLoot = [];
    this.lootOpen = false;
    this.enemies_index += 1;
  }

  intentAction(target, card_idx) {
    if (this.lootOpen || this.runComplete || this.runFailed) return;

    const card = this.player.deck.hand[card_idx];
    if (!card) return;

    this.player.intents.push({
      time: this.time + card.time_cost,
      target,
      card_idx,
    });

    this.progressTime(card.time_cost);
  }

  drawCard(n) {
    if (this.lootOpen || this.runComplete || this.runFailed) return;
    this.player.drawCard(n);
    this.progressTime(1);
  }

  restartRun() {
    if (this.restartCallback) {
      this.restartCallback();
    }
  }
}