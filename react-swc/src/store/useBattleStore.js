import { create } from 'zustand';
import { Player } from '../Objects/Entity';
import { GameState } from '../engine/core/GameState';
import { BattleEngine } from '../engine/core/BattleEngine';

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

  const gameState = new GameState(player, restartBattle);
  const battleEngine = new BattleEngine(gameState);

  return { gameState, battleEngine };
}

export const useGameStore = create((set) => ({
  ...buildBattleState(set),
}));

if (process.env.NODE_ENV === 'development') {
  window.useGameStore = useGameStore;
  window.debugStore = useGameStore.getState();
}
