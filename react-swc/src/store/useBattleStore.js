import { create } from 'zustand';
import { Player,Enemy } from '../Objects/Entity';
import { GameManager } from '../Objects/GameManager';
import { createEnemy } from '../engine/enemyRegistry';

function buildBattleState(set) {
  const player = new Player('player', 50, null, [
      // "STRIKE",
      // "FIREBALL",
      // "FIREBALL",
      // "DEFEND",
      "DEFEND",
      // "PATCH_UP",
      // "GUARD",
      // "RUSH",
      // "RUSH",
      // "EXECUTION",
      // "FIVEFOLD_STRIKE",
    //"FIVEFOLD_STRIKE",
    //"FIVEFOLD_STRIKE",
    //"FIVEFOLD_STRIKE",
    //"FIVEFOLD_STRIKE",
    //"FIVEFOLD_STRIKE",
    //"FIVEFOLD_STRIKE",
    "DESPERATION",
    "LAST_DEFENSE",
      "SWEEP",
      "SHIELD_BASH",
      // "DEATH_CLEAVE",
      // "MULTISELECT",
      // "EXECUTION",
      // "LAST_DEFENSE",
      // "SPIN_STRIKE",
      // "QUICK_GUARD",
      "ACCUMULATE",
      // "FORTRESS",
      // "BRACE",
      "FOLLOWING_STRIKE",
      "STRIKE",
      "ATTACK_RUSH"
  ]);

  const restartBattle = () => {
    set(buildBattleState(set));
  };

  const gameManager = new GameManager(player, [], restartBattle);
  player.addGameManager(gameManager);
  gameManager.startBattle();

  return { gameManager };
}

export const useGameStore = create((set) => ({
  ...buildBattleState(set),
}));