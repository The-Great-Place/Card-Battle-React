import { getRandomLootChoices } from "../generateLoot";
import { canPlayCard } from "../queries/battleQueries";

export class BattleEngine {
  constructor(gameState) {
    this.gameState = gameState;
  }

  dispatch(command) {
    switch (command.type) {
      case "START_LEVEL":
        return this.startLevel(command);
      case "START_BATTLE":
        return this.startBattle();
      case "PLAY_CARD":
        return this.playCard(command);
      case "END_TURN":
        return this.endTurn();
      case "CLAIM_REWARD":
        return this.claimReward(command);
      case "SKIP_REWARD":
        return this.skipReward();
      case "NEXT_LEVEL":
        return this.nextLevel();
      case "RESTART_RUN":
        return this.restartRun();
      case "BUY_CARD":
        return this.buyCard(command);
      case "REFRESH_SHOP":
        return this.refreshShop(command);
      default:
        throw new Error(`Unknown command type: ${command.type}`);
    }
  }

  startLevel({ levelId, enemies }) {
    const levelStatus = this.gameState.chapterProgress.levels[levelId]?.status;
    if (levelStatus !== "available") return false;

    this.gameState.enemies = enemies;
    this.gameState.enemiesIndex = 0;
    this.gameState.currentLevelId = levelId;
    this.gameState.currentView = "battle-view";
    this.gameState.runComplete = false;
    this.gameState.runFailed = false;
    this.gameState.lootOpen = false;
    this.gameState.pendingLoot = [];

    this.startBattle();
    return true;
  }

  startBattle() {
    this.gameState.turn = 1;
    this.startPlayerTurn();
  }

  startPlayerTurn() {
    const { player, cardsPerTurn } = this.gameState;
    player.deck.discardHandAll();
    this.gameState.playerTurn = true;
    player.energy = player.maxEnergy;
    player.drawCard(cardsPerTurn);
    player.handleOverTurnEffects();
    this.updateBattleState();
  }

  playCard({ cardInstanceId, targetIds = [] }) {
    const { player } = this.gameState;
    if (!this.gameState.playerTurn) return false;
    if (this.gameState.lootOpen || this.gameState.runComplete || this.gameState.runFailed) return false;
    if (!canPlayCard(this.gameState, cardInstanceId)) return false;

    const card = player.deck.getCardInHand(cardInstanceId);
    if (!card) return false;

    const targets = this.resolveEntityTargets(targetIds);
    if (targets.length === 0) return false;

    player.playCard(targets, card, cardInstanceId);
    this.updateBattleState();
    return true;
  }

  endTurn() {
    const { player } = this.gameState;
    if (!this.gameState.playerTurn) return false;
    if (this.gameState.lootOpen || this.gameState.runComplete || this.gameState.runFailed) return false;

    this.gameState.playerTurn = false;
    player.deck.discardHandAll();

    this.runEnemyTurn();
    this.updateBattleState();

    if (!player.alive) {
      this.gameState.runFailed = true;
      return false;
    }

    if (this.gameState.lootOpen || this.gameState.runComplete) return true;

    this.gameState.turn += 1;
    this.startPlayerTurn();
    return true;
  }

  runEnemyTurn() {
    this.gameState.currentEnemies.forEach((enemy) => {
      if (!enemy.alive || !enemy.intents || enemy.intents.length === 0) return;

      const matchTarget = {
        player: this.gameState.player,
        self: enemy,
      };

      if (enemy.alive) {
        enemy.handleOverTurnEffects();
      }

      enemy.intents.forEach((intent) => {
        const target = matchTarget[intent.target];
        if (!target) return;
        enemy.playCard(target, intent.card);
      });

      enemy.getNextIntent();
    });
  }

  updateBattleState() {
    const allEnemyDead =
      this.gameState.currentEnemies.length > 0 &&
      this.gameState.currentEnemies.every((enemy) => !enemy.alive);

    if (!allEnemyDead) return;

    this.gameState.pendingLoot = getRandomLootChoices(this.gameState.enemiesIndex, 3);
    this.gameState.lootOpen = true;
  }

  claimReward({ cardId }) {
    if (cardId) {
      this.gameState.player.deck.gainCard(cardId);
    }

    this.finishRewardStep();
    return true;
  }

  skipReward() {
    this.finishRewardStep();
    return true;
  }

  finishRewardStep() {
    this.gameState.pendingLoot = [];
    this.gameState.lootOpen = false;

    const isLastWave = this.gameState.enemiesIndex >= this.gameState.enemies.length - 1;
    if (isLastWave) {
      this.gameState.runComplete = true;
      return;
    }

    this.gameState.enemiesIndex += 1;
    this.startBattle();
  }

  completeCurrentLevel() {
    if (!this.gameState.currentLevelId) return;

    const level = this.gameState.chapterProgress.levels[this.gameState.currentLevelId];
    if (!level) return;

    level.status = "completed";

    const allNormalCleared =
      this.gameState.chapterProgress.levels["darkened-grave"].status === "completed" &&
      this.gameState.chapterProgress.levels["goblin-huts"].status === "completed" &&
      this.gameState.chapterProgress.levels["monster-tunnel"].status === "completed";

    if (allNormalCleared) {
      this.gameState.chapterProgress.levels["dragon-den"].status = "available";
    }
  }

  nextLevel() {
    this.completeCurrentLevel();
    this.gameState.player.gold += 10;
    this.gameState.currentView = "chapter-view";
    this.gameState.runComplete = false;
    this.gameState.runFailed = false;
    this.gameState.lootOpen = false;
    this.gameState.pendingLoot = [];
    this.gameState.enemiesIndex = 0;
  }

  restartRun() {
    if (this.gameState.restartCallback) {
      this.gameState.restartCallback();
    }
  }

  buyCard({ cardId, cost = 0 }) {
    if (!cardId) return false;
    if (this.gameState.player.gold < cost) return false;

    this.gameState.player.gold -= cost;
    this.gameState.player.deck.gainCard(cardId);
    return true;
  }

  refreshShop({ cost = 0 }) {
    if (this.gameState.player.gold < cost) return false;

    this.gameState.player.gold -= cost;
    return true;
  }

  resolveEntityTargets(targetIds) {
    const ids = Array.isArray(targetIds) ? targetIds : [targetIds];

    return ids
      .map((targetId) => this.findEntityById(targetId))
      .filter(Boolean);
  }

  findEntityById(entityId) {
    if (!entityId) return null;
    if (this.gameState.player.id === entityId) return this.gameState.player;
    return this.gameState.currentEnemies.find((enemy) => enemy.id === entityId) ?? null;
  }
}
