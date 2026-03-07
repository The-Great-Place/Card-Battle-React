import { create } from 'zustand';
import { Player,Enemy } from '../Objects/Entity';
import { GameManager } from '../Objects/GameManager';
import { createEnemy } from '../engine/enemyRegistry';

function buildBattleState() {
  const player = new Player('player', 20, null, [
     "STRIKE",
     "STRIKE",
     "DEFEND",
     "DEFEND",
     "FOCUS",
     "PATCH_UP"
    //"FIVEFOLD_STRIKE",
    //"FIVEFOLD_STRIKE",
    //"FIVEFOLD_STRIKE",
    //"FIVEFOLD_STRIKE",
    //"FIVEFOLD_STRIKE",
    //"FIVEFOLD_STRIKE",
    //"FIVEFOLD_STRIKE",

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