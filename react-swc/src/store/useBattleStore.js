import { create } from 'zustand';
import { Enemy, Player } from '../Objects/Entity';
import { GameManager } from '../Objects/GameManager';
import { CardLibrary } from '../engine/cardEffects';

// Define your cards with "Effect" strings or logic keys

const player = new Player('player', 20, [
  CardLibrary.STRIKE, 
  CardLibrary.STRIKE, 
  CardLibrary.DEFEND,
  CardLibrary.QUICK_STEP,
  CardLibrary.PATCH_UP,
  CardLibrary.FOCUS,
])
const skeleton = new Enemy('Skeleton', 20)
skeleton.initializeIntents([
    {'card':CardLibrary.STRIKE, 'target':player, 'time': 2},
    {'card':CardLibrary.STRIKE, 'target':player, 'time': 1},
    {'card':CardLibrary.DEFEND, 'target':skeleton, 'time': 3}, 
  ]
)
const bandit = new Enemy('Bandit', 30)
bandit.initializeIntents([
    {'card':CardLibrary.STRIKE, 'target':player, 'time': 2},
    {'card':CardLibrary.DEFEND, 'target':bandit, 'time': 2}, 
    {'card':CardLibrary.PATCH_UP, 'target':bandit, 'time': 1}, 
  ]
)
const slime = new Enemy('Slime', 20)
slime.initializeIntents([
    {'card':CardLibrary.STRIKE, 'target':player, 'time': 2},
  ]
)
const enemies = [[skeleton], [bandit], [slime,skeleton]]

export const useGameStore = create((set) => ({
  // --- STATE ---
  player: player,
  enemies: enemies,
  gameManager: new GameManager(player, enemies),
}));