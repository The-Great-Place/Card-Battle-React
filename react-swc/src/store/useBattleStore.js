import { create } from 'zustand';
import { Player,Enemy } from '../Objects/Entity';
import { GameManager } from '../Objects/GameManager';
import { createEnemy } from '../engine/enemyRegistry';

function buildBattleState(set) {
  const player = new Player('player', 50, null, [
       "STRIKE",
       "STRIKE",
       "STRIKE",
      "DEFEND",
      "DEFEND",
       "PATCH_UP",
       
 
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