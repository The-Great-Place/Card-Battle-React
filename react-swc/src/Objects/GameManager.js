import { makeAutoObservable } from "mobx";
import { CardLibrary } from "../engine/cardEffects";

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
    this.player = player;
    this.enemies = enemies;
    this.enemies_index = 0;

    this.turn = 1;
    this.energy = 3;
    this.maxEnergy = 3;
    this.cardsPerTurn = 5;
    this.playerTurn = true;

    this.lootOpen = false;
    this.pendingLoot = [];
    this.runComplete = false;
    this.runFailed = false;
    this.current_view = "chapter-view";

    this.restartCallback = restartCallback;

    makeAutoObservable(this, {}, { autoBind: true });
  }

  get currentEnemies() {
    return this.enemies[this.enemies_index] || [];
  }

  startBattle() {
    this.turn = 1;
    this.playerTurn = true;
    this.energy = this.maxEnergy;

    // 清空旧的玩家意图
    if (this.player.intents) {
      this.player.intents = [];
    }

    // 清空手牌
    if (this.player.deck?.discardHandAll) {
      this.player.deck.discardHandAll();
    }

    // 如果你不想开局抽太多，记得把 Player constructor 里的 drawCard(4) 删掉
    this.player.drawCard(this.cardsPerTurn);

    this.updateGame();
  }

  startPlayerTurn() {
    this.playerTurn = true;
    this.energy = this.maxEnergy;
    this.player.drawCard(this.cardsPerTurn);
    this.updateGame();
  }

  playCard(target, card_idx) {
    if (!this.playerTurn) return;
    if (this.lootOpen || this.runComplete || this.runFailed) return;

    const card = this.player.deck.hand[card_idx];
    if (!card) return;

    const cost = card.energy_cost ?? 1; // 注意这里必须统一成 energy_cost
    if (this.energy < cost) return;

    this.energy -= cost;
    this.player.playCard(target, card, card_idx);

    this.updateGame();
  }

  endTurn() {
    if (!this.playerTurn) return;
    if (this.lootOpen || this.runComplete || this.runFailed) return;

    this.playerTurn = false;

    if (this.player.deck?.discardHandAll) {
      this.player.deck.discardHandAll();
    }

    this.runEnemyTurn();
    this.updateGame();

    if (this.lootOpen || this.runComplete || this.runFailed) return;

    this.turn += 1;
    this.startPlayerTurn();
  }

runEnemyTurn() {
  this.currentEnemies.forEach((e) => {
    if (!e.alive) return;
    if (!e.intents || e.intents.length === 0) return;

    const intent = e.intents[0];
    const matchTarget = {
      player: this.player,
      self: e,
    };

    if (intent.time > 1) {
      intent.time -= 1;
      return;
    }

    const target = matchTarget[intent.target];
    if (!target) return;

    e.playCard(target, intent.card);
  });
}

  updateGame() {
    this.player.checkAlive();
    this.currentEnemies.forEach((e) => e.checkAlive());

    if (!this.player.alive) {
      this.runFailed = true;
      return;
    }

    const allEnemyDead =
      this.currentEnemies.length > 0 &&
      this.currentEnemies.every((e) => !e.alive);

    if (!allEnemyDead) return;

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

    this.startBattle();
  }

  skipLoot() {
    this.pendingLoot = [];
    this.lootOpen = false;
    this.enemies_index += 1;

    this.startBattle();
  }

  restartRun() {
    if (this.restartCallback) {
      this.restartCallback();
    }
  }

  nextLevel() {
    this.current_view = "chapter-view";
    this.runComplete = false;
  }
}