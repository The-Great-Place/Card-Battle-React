import { create } from 'zustand';
import { Player,Enemy } from '../Objects/Entity';
import { GameManager } from '../Objects/GameManager';
import { createEnemy } from '../engine/enemyRegistry';

function buildBattleState(set) {
  const player = new Player('player', 20, null, [
    "STRIKE",
    "STRIKE",
    "PATCH_UP",
    "DEFEND",
    "FOCUS",
    "RUSH"

  ]);

  const g1 = createEnemy('GOBLIN');

  const g2 = createEnemy('GOBLIN');
  const g3 = createEnemy('GOBLIN');
  
  const s1 = createEnemy('SKELETON');
  const s2 = createEnemy('SKELETON');
  const s3 = createEnemy('SKELETON');

  const s4 = createEnemy('SKELETON');
  const s5 = createEnemy('SKELETON');
  const s6 = createEnemy('SKELETON');
  const s7 = createEnemy('SKELETON');
  const s8 = createEnemy('SKELETON');
  const s9 = createEnemy('SKELETON');


  const s10 = createEnemy('SKELETON');
  const v1 = createEnemy('VAMPIRE_BAT');
  const s11 = createEnemy('SKELETON');

  const v2 = createEnemy('VAMPIRE_BAT');
  const v3 = createEnemy('VAMPIRE_BAT');
  const v4 = createEnemy('VAMPIRE_BAT');

  const enemies = [
    [g1],
    [g2,g3],
    [s1, s2, s3,], 
    [s4, s5,s6,s7,s8,s9],
    [s10, v1, s11],
    [v2,v3,v4],
  ];

  const restartBattle = () => {
    set(buildBattleState(set));
  };

  const gameManager = new GameManager(player, enemies, restartBattle);

  return {
    player,
    enemies,
    gameManager,
    restartBattle,
  };
}

export const useGameStore = create((set) => ({
  ...buildBattleState(set),
}));