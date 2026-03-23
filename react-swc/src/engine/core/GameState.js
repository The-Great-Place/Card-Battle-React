import { makeAutoObservable } from "mobx";

export class GameState {
  constructor(player, restartCallback = null) {
    this.player = player;
    this.enemies = [];
    this.enemiesIndex = 0;

    this.turn = 1;
    this.cardsPerTurn = 5;
    this.playerTurn = true;

    this.lootOpen = false;
    this.pendingLoot = [];
    this.runComplete = false;
    this.runFailed = false;
    this.currentView = "chapter-view";
    this.currentLevelId = null;

    this.chapterProgress = {
      levels: {
        "darkened-grave": { status: "available" },
        "goblin-huts": { status: "available" },
        "monster-tunnel": { status: "available" },
        "secret-passage": { status: "available" },
        "dragon-den": { status: "locked" },
      },
    };

    this.restartCallback = restartCallback;

    makeAutoObservable(this, {}, { autoBind: true });
  }

  get currentEnemies() {
    return this.enemies[this.enemiesIndex] || [];
  }
}
