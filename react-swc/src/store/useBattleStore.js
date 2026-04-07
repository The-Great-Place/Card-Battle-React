import { create } from 'zustand';
import { Player } from '../Objects/Entity';
import { GameState } from '../engine/core/GameState';
import { BattleEngine } from '../engine/core/BattleEngine';

function buildBattleState(set) {
  const player = new Player('player', 50, null, [
        "STRIKE",
        "STRIKE",
        "DEFEND",
        "DEFEND",
        "PATCH_UP",
        // "ARCANE_FORGE",
        //"TACTICAL_INSIGHT",
        // "FIVEFOLD_STRIKE"
        // "DEFEND",
        // "BURNING_DETERMINATION",
        //"GROWING_STRIKE",
        // "CHARGE",
        // "COMBUST",
        // "FLICKER_CUT",
        // "RUSH",
        // "ATTACK_RUSH",
        // "EXECUTION",
        // "FIVEFOLD_STRIKE",
        // "SPIN_STRIKE",
        // "KINDLE",
        // "INTERACTION_DEMO",
        // "ARCANE_FORGE",
        // "METAMORPHOSIS",
        // "STRATEGIC_DECISION"
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
