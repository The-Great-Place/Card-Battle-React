import { makeAutoObservable } from "mobx";
import { getRandomLootChoices } from "../engine/generateLoot";

export class GameManager {
  constructor(player, enemies, restartCallback = null) {
    this.player = player;
    this.enemies = enemies;
    this.enemies_index = 0;

    this.turn = 1;
    this.cardsPerTurn = 5;
    this.playerTurn = true;

    this.lootOpen = false;
    this.pendingLoot = [];
    this.runComplete = false;
    this.runFailed = false;
    this.current_view = "chapter-view";
    this.currentLevelId = null;

    
    this.chapterProgress = {
    levels: {
    "darkened-grave": { status: "available" },
    "goblin-huts": { status: "available" },
    "monster-tunnel": { status: "available" },
    "secret-passage": { status: "available" },
    "dragon-den": { status: "locked" },
      }
    };

    this.restartCallback = restartCallback;


    makeAutoObservable(this, {}, { autoBind: true });
  }

  get currentEnemies() { return this.enemies[this.enemies_index] || [];}

  startBattle() { this.turn = 1; this.startPlayerTurn() }

  startPlayerTurn() {
    this.player.deck.discardHandAll();
    this.playerTurn = true;
    this.player.energy = this.player.maxEnergy;
    this.player.drawCard(this.cardsPerTurn);
    this.player.handleOverTurnEffects()
    this.updateGame();
  }

  playCard(target, card_idx) {
    if (!this.playerTurn) return;
    if (this.lootOpen || this.runComplete || this.runFailed) return;

    const card = this.player.deck.hand[card_idx];
    if (!card) return;

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

  console.log(1)

  this.runEnemyTurn();
  this.updateGame();

  if (!this.player.alive) {
    this.runFailed = true;
    return;
  }

  // 然后如果开 loot / complete，就停
  if (this.lootOpen || this.runComplete) return;

  this.turn += 1;
  this.startPlayerTurn();
}

runEnemyTurn() {
  this.currentEnemies.forEach((e) => {
    if (!e.alive) return;
    if (!e.intents || e.intents.length === 0) return;

    const matchTarget = {
      player: this.player,
      self: e,
    };

     // 敌人行动前触发decay shield
    if (e.alive) {
      e.handleOverTurnEffects()
    }
    


    e.intents.forEach((intent) => {
      const target = matchTarget[intent.target]
       if (!target) return;
      e.playCard(target, intent.card)
    })
    e.getNextIntent()   
   });
}

  completeCurrentLevel() {
    if (!this.currentLevelId) return;

    const level = this.chapterProgress.levels[this.currentLevelId];
    if (!level) return;

    level.status = "completed";

    const allNormalCleared =
      this.chapterProgress.levels["darkened-grave"].status === "completed" &&
      this.chapterProgress.levels["goblin-huts"].status === "completed" &&
      this.chapterProgress.levels["monster-tunnel"].status === "completed";

    if (allNormalCleared) {
      this.chapterProgress.levels["dragon-den"].status = "available";
    }
  }

  updateGame() {
    const allEnemyDead =
    this.currentEnemies.length > 0 &&
    this.currentEnemies.every((e) => !e.alive);

    if (!allEnemyDead) return;

    // 无论是不是最后一波，先给 loot
    this.pendingLoot = getRandomLootChoices(this.enemies_index, 3);
    this.lootOpen = true;
  }

  claimLoot(card) {
     if (card) {
    this.player.deck.discardPile.push({ ...card });
    }

    this.pendingLoot = [];
    this.lootOpen = false;

    const isLastWave = this.enemies_index >= this.enemies.length - 1;
    if (isLastWave) {
      this.runComplete = true;
      return;
    }

    this.enemies_index += 1;
    this.startBattle();
  }

  skipLoot() {
    this.pendingLoot = [];
    this.lootOpen = false;

    const isLastWave = this.enemies_index >= this.enemies.length - 1;
    if (isLastWave) {
      this.runComplete = true;
      return;
    }

    this.enemies_index += 1;
    this.startBattle();
  }

  restartRun() {
    if (this.restartCallback) {
      this.restartCallback();
    }
  }

  nextLevel() {
    this.completeCurrentLevel();
    this.player.gold += 10;
    this.current_view = "chapter-view";
    this.runComplete = false;
    this.runFailed = false;
    this.lootOpen = false;
    this.pendingLoot = [];
    this.enemies_index = 0;
  }
}