import EnemyRegistry from "../data/enemies.json"
import { Enemy } from "../Objects/Entity";
export function createEnemy(type) {
  const data = EnemyRegistry[type];
  if (!data) throw new Error(`Enemy type ${type} not found!`);
  
  // Return a new instance using the data
  const enemy = new Enemy(data.name, data.hp);
  enemy.initializeIntents(data.pattern);
  return enemy
}