import { getRandomLootChoices } from "../generateLoot";
import { canPlayCard, getCardPlayState } from "../queries/battleQueries";
import {
  getTargetingRule,
  resolveTargetsForPlay,
} from "../resolvers/targetingResolver";
import {
  InteractionController,
  registerInteractionController,
} from "./InteractionController";
import { resolveEffect } from "../resolvers/effectResolver";

export class BattleEngine {
  constructor(gameState) {
    this.gameState = gameState;
    this.interactionController = new InteractionController(gameState);
    registerInteractionController(this.interactionController);
    console.log("Iniitalized GameState: ", gameState)
  }

  dispatch(command) {
    console.log("Command:",command.type, "Recieved")
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
      case "CONFIRM_INTERACTION":
        return this.confirmInteraction(command);
      case "CANCEL_INTERACTION":
        return this.cancelInteraction();
      case "SET_INTERACTION_SELECTIONS":
        return this.setInteractionSelections(command);
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
    if (this.gameState.pendingInteraction) return false;
    if (!this.gameState.playerTurn) return false;
    if (this.gameState.lootOpen || this.gameState.runComplete || this.gameState.runFailed) return false;
    if (!canPlayCard(this.gameState, cardInstanceId)) return false;

    const card = player.deck.getCardInHand(cardInstanceId);
    if (!card) return false;

    const playState = getCardPlayState(this.gameState, cardInstanceId, targetIds);
    if (!playState.canPlay) return false;

    const rule = getTargetingRule(card);
    const resolvedTargets = resolveTargetsForPlay(this.gameState, rule, playState.selectedTargetIds);
    if (playState.requiredTargets > 0 && resolvedTargets.length < playState.requiredTargets) return false;

    player.playCard(resolvedTargets, card, cardInstanceId);
    this.updateBattleState();
    return true;
  }

  endTurn() {
    const { player } = this.gameState;
    console.log(player)
    if (!this.gameState.playerTurn) return false;
    if (this.gameState.lootOpen || this.gameState.runComplete || this.gameState.runFailed) return false;

    this.gameState.playerTurn = false;
    console.log(player.deck)
    player.deck.discardHandAll();
    console.log(player.deck)
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

  confirmInteraction({ selectionIds = [] }) {
    const result = this.interactionController.confirmInteraction(selectionIds);
    console.log("Interaction confirmed", result);
    if (result) {
      this.resolveInteractionEffects(result.pending, result.selectionIds, "onConfirm");
    }
    return Boolean(result);
  }

  cancelInteraction() {
    const result = this.interactionController.cancelInteraction();
    console.log("Interaction cancelled", result);
    if (result) {
      this.resolveInteractionEffects(result, [], "onCancel");
    }
    return Boolean(result);
  }

  setInteractionSelections({ selectionIds = [] }) {
    const result = this.interactionController.updateSelection(selectionIds);
    return Boolean(result);
  }

  resolveInteractionEffects(pendingInteraction, selectionIds = [], effectKey = "onConfirm") {
    if (!pendingInteraction) return;

    const effects = pendingInteraction[effectKey] ?? [];
    if (!Array.isArray(effects) || effects.length === 0) return;

    const selections = selectionIds.length > 0
      ? [...selectionIds]
      : [...(pendingInteraction.selectedTargetIds ?? [])];

    const context = {
      source: this.gameState.player,
      target: this.gameState.player,
      card: null,
      selectionIds: selections,
      pendingInteraction,
    };

    effects.forEach((effect) => resolveEffect(context, effect));
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

}
